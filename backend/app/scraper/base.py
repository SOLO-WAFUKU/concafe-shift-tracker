"""
スクレイピング基盤クラス
Playwrightを使用したWebスクレイピングの共通機能を提供する
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from playwright.async_api import async_playwright, Page, Browser
from bs4 import BeautifulSoup
import yaml
import hashlib
from pathlib import Path

from ..database import get_db, get_redis
from ..crud import StoreRepository, GirlRepository, ShiftRepository, AdminRepository
from ..config import settings
from .image_uploader import ImageUploader

logger = logging.getLogger(__name__)


class ConCafeScraper:
    """コンカフェスクレイピング基盤クラス"""
    
    def __init__(self):
        self.redis = get_redis()
        self.image_uploader = ImageUploader()
        self.stores_config = self._load_stores_config()
    
    def _load_stores_config(self) -> Dict[str, Any]:
        """stores.yamlから店舗設定を読み込む"""
        config_path = Path(__file__).parent.parent.parent.parent / "stores.yaml"
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            logger.error(f"stores.yaml not found at {config_path}")
            return {"stores": []}
        except yaml.YAMLError as e:
            logger.error(f"Error parsing stores.yaml: {e}")
            return {"stores": []}
    
    async def scrape_all_stores(self) -> Dict[str, Any]:
        """全店舗のスクレイピングを実行"""
        results = {"success": [], "failed": [], "total_girls": 0, "total_shifts": 0}
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=settings.playwright_headless)
            
            try:
                tasks = []
                for store_config in self.stores_config.get("stores", []):
                    task = self._scrape_store_safe(browser, store_config)
                    tasks.append(task)
                
                # 並列実行（最大同時実行数制限）
                semaphore = asyncio.Semaphore(settings.max_concurrent_scrapers)
                
                async def limited_scrape(task):
                    async with semaphore:
                        return await task
                
                store_results = await asyncio.gather(*[limited_scrape(task) for task in tasks])
                
                for result in store_results:
                    if result["status"] == "success":
                        results["success"].append(result)
                        results["total_girls"] += result["girls_found"]
                        results["total_shifts"] += result["shifts_found"]
                    else:
                        results["failed"].append(result)
                        
            finally:
                await browser.close()
        
        return results
    
    async def _scrape_store_safe(self, browser: Browser, store_config: Dict[str, Any]) -> Dict[str, Any]:
        """店舗スクレイピングを安全に実行（エラーハンドリング付き）"""
        store_id = store_config["id"]
        start_time = datetime.utcnow()
        
        # スクレイピングログ開始
        with next(get_db()) as db:
            log = AdminRepository.create_scraping_log(db, store_id, "running")
        
        try:
            result = await self._scrape_store(browser, store_config)
            
            # 成功時のログ更新
            with next(get_db()) as db:
                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                log.status = "success"
                log.girls_found = result["girls_found"]
                log.shifts_found = result["shifts_found"]
                log.execution_time = execution_time
                log.completed_at = datetime.utcnow()
                db.commit()
            
            return result
            
        except Exception as e:
            logger.error(f"Error scraping store {store_id}: {str(e)}")
            
            # 失敗時のログ更新
            with next(get_db()) as db:
                execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
                log.status = "failed"
                log.error_message = str(e)
                log.execution_time = execution_time
                log.completed_at = datetime.utcnow()
                db.commit()
            
            # キャッシュからデータを取得して返す
            return await self._get_cached_data_or_empty(store_id)
    
    async def _scrape_store(self, browser: Browser, store_config: Dict[str, Any]) -> Dict[str, Any]:
        """単一店舗のスクレイピングを実行"""
        store_id = store_config["id"]
        store_name = store_config["name"]
        
        logger.info(f"Starting scrape for {store_name} ({store_id})")
        
        # DBに店舗情報を保存/更新
        with next(get_db()) as db:
            StoreRepository.create_or_update(db, store_config)
        
        # ページアクセス
        page = await browser.new_page()
        await page.goto(store_config["url"], wait_until="networkidle")
        
        # スクレイピング設定に基づく待機
        scraping_config = store_config.get("scraping_config", {})
        if scraping_config.get("wait_time"):
            await asyncio.sleep(scraping_config["wait_time"] / 1000)
        
        if scraping_config.get("scroll_to_bottom"):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)
        
        # HTMLを取得してBeautifulSoupで解析
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        await page.close()
        
        # スケジュール情報を抽出
        girls_data, shifts_data = await self._extract_schedule_data(soup, store_config)
        
        # データベースに保存
        girls_found, shifts_found = await self._save_scraped_data(
            store_id, girls_data, shifts_data
        )
        
        # キャッシュに保存
        cache_key = f"store_shifts:{store_id}"
        cache_data = {
            "girls": girls_data,
            "shifts": shifts_data,
            "scraped_at": datetime.utcnow().isoformat()
        }
        self.redis.setex(cache_key, settings.cache_ttl, json.dumps(cache_data))
        
        return {
            "store_id": store_id,
            "store_name": store_name,
            "status": "success",
            "girls_found": girls_found,
            "shifts_found": shifts_found
        }
    
    async def _extract_schedule_data(self, soup: BeautifulSoup, 
                                   store_config: Dict[str, Any]) -> Tuple[List[Dict], List[Dict]]:
        """HTMLからスケジュールデータを抽出"""
        selectors = store_config["selectors"]
        girls_data = []
        shifts_data = []
        
        # 日付範囲を生成（今日から7日後まで）
        date_range = []
        today = datetime.now()
        for i in range(8):
            date_range.append((today + timedelta(days=i)).strftime("%Y-%m-%d"))
        
        # スケジュールコンテナを取得
        schedule_container = soup.select_one(selectors.get("schedule_container", ".schedule"))
        if not schedule_container:
            logger.warning(f"Schedule container not found for {store_config['id']}")
            return girls_data, shifts_data
        
        # 日付セクションごとに処理
        date_sections = schedule_container.select(selectors.get("date_section", ".date"))
        
        for i, date_section in enumerate(date_sections):
            if i >= len(date_range):
                break
                
            current_date = date_range[i]
            
            # その日の嬢情報を取得
            girl_elements = date_section.select(selectors.get("girl_name", ".girl"))
            
            for girl_element in girl_elements:
                girl_name = girl_element.get_text(strip=True)
                if not girl_name:
                    continue
                
                # 画像URL取得
                img_element = girl_element.find_parent().select_one(selectors.get("girl_image", "img"))
                image_url = None
                if img_element:
                    image_url = img_element.get("src") or img_element.get("data-src")
                    if image_url and not image_url.startswith("http"):
                        # 相対URLを絶対URLに変換
                        from urllib.parse import urljoin
                        image_url = urljoin(store_config["url"], image_url)
                
                # 嬢データに追加
                girl_data = {
                    "name": girl_name,
                    "image_url": image_url,
                    "date": current_date
                }
                girls_data.append(girl_data)
                
                # シフト時間を取得
                shift_time_element = girl_element.find_parent().select_one(
                    selectors.get("shift_time", ".time")
                )
                
                if shift_time_element:
                    shift_time_text = shift_time_element.get_text(strip=True)
                    start_time, end_time = self._parse_shift_time(
                        shift_time_text, store_config.get("open_time", "11:00"), 
                        store_config.get("close_time", "22:00")
                    )
                    
                    if start_time and end_time:
                        shift_data = {
                            "girl_name": girl_name,
                            "date": current_date,
                            "start_time": start_time,
                            "end_time": end_time,
                            "shift_type": "regular"
                        }
                        shifts_data.append(shift_data)
        
        return girls_data, shifts_data
    
    def _parse_shift_time(self, time_text: str, default_start: str, default_end: str) -> Tuple[Optional[str], Optional[str]]:
        """シフト時間テキストをパース"""
        if not time_text:
            return None, None
        
        # "18:00-22:00" 形式
        if "-" in time_text:
            parts = time_text.split("-")
            if len(parts) == 2:
                start = parts[0].strip()
                end = parts[1].strip()
                return start, end
        
        # "18:00～22:00" 形式
        if "～" in time_text:
            parts = time_text.split("～")
            if len(parts) == 2:
                start = parts[0].strip()
                end = parts[1].strip()
                return start, end
        
        # デフォルト値を使用
        return default_start, default_end
    
    async def _save_scraped_data(self, store_id: str, girls_data: List[Dict], 
                               shifts_data: List[Dict]) -> Tuple[int, int]:
        """スクレイピングしたデータをデータベースに保存"""
        girls_found = 0
        shifts_found = 0
        
        with next(get_db()) as db:
            # 既存の嬢リストを取得（LEFT判定用）
            existing_girls = db.query(models.Girl).filter(
                models.Girl.store_id == store_id
            ).all()
            
            current_girl_names = set()
            
            # 嬢データを保存
            for girl_data in girls_data:
                girl_name = girl_data["name"]
                current_girl_names.add(girl_name)
                
                # 画像のアップロード処理
                image_url = girl_data.get("image_url")
                if image_url:
                    try:
                        image_url = await self.image_uploader.upload_image(
                            image_url, f"{store_id}_{girl_name}"
                        )
                    except Exception as e:
                        logger.warning(f"Failed to upload image for {girl_name}: {e}")
                
                girl = GirlRepository.create_or_update(
                    db, store_id, girl_name, image_url
                )
                girls_found += 1
            
            # 前回いたが今回いない嬢をLEFTに設定
            GirlRepository.mark_as_left(db, existing_girls, list(current_girl_names))
            
            # シフトデータを保存
            for shift_data in shifts_data:
                girl = GirlRepository.get_by_store_and_name(
                    db, store_id, shift_data["girl_name"]
                )
                
                if girl:
                    ShiftRepository.create_or_update(
                        db, store_id, girl.id, shift_data["date"],
                        shift_data["start_time"], shift_data["end_time"],
                        shift_data.get("shift_type", "regular")
                    )
                    shifts_found += 1
        
        return girls_found, shifts_found
    
    async def _get_cached_data_or_empty(self, store_id: str) -> Dict[str, Any]:
        """キャッシュからデータを取得、なければ空のデータを返す"""
        cache_key = f"store_shifts:{store_id}"
        cached_data = self.redis.get(cache_key)
        
        if cached_data:
            data = json.loads(cached_data)
            return {
                "store_id": store_id,
                "status": "cached",
                "girls_found": len(data.get("girls", [])),
                "shifts_found": len(data.get("shifts", []))
            }
        
        return {
            "store_id": store_id,
            "status": "failed",
            "girls_found": 0,
            "shifts_found": 0
        }