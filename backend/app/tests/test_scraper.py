"""
スクレイピング機能のテスト
ConCafeScraperクラスの各機能をテストする
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from bs4 import BeautifulSoup

from ..scraper.base import ConCafeScraper
from ..scraper.image_uploader import ImageUploader
from ..models import Store, Girl, Shift


class TestConCafeScraper:
    """ConCafeScraperクラスのテスト"""

    @pytest.fixture
    def scraper(self, mock_redis):
        """スクレイパーインスタンス"""
        with patch('app.scraper.base.get_redis', return_value=mock_redis):
            scraper = ConCafeScraper()
            scraper.stores_config = {
                "stores": [
                    {
                        "id": "test-store",
                        "name": "テスト店舗",
                        "url": "https://example.com/schedule/",
                        "selectors": {
                            "schedule_container": ".schedule",
                            "girl_name": ".girl",
                            "girl_image": ".img",
                            "shift_time": ".time",
                            "date_section": ".date"
                        },
                        "scraping_config": {
                            "wait_time": 1000
                        }
                    }
                ]
            }
            return scraper

    @pytest.mark.asyncio
    async def test_scrape_all_stores_success(self, scraper, mock_playwright):
        """全店舗スクレイピング成功のテスト"""
        with patch('playwright.async_api.async_playwright') as mock_pw:
            mock_pw.return_value.__aenter__.return_value.chromium.launch.return_value = mock_playwright["browser"]
            
            with patch.object(scraper, '_scrape_store_safe') as mock_scrape:
                mock_scrape.return_value = {
                    "store_id": "test-store",
                    "store_name": "テスト店舗",
                    "status": "success",
                    "girls_found": 2,
                    "shifts_found": 3
                }
                
                result = await scraper.scrape_all_stores()
                
                assert result["total_girls"] == 2
                assert result["total_shifts"] == 3
                assert len(result["success"]) == 1
                assert len(result["failed"]) == 0

    @pytest.mark.asyncio
    async def test_extract_schedule_data(self, scraper):
        """スケジュールデータ抽出のテスト"""
        html = """
        <div class="schedule">
            <div class="date">今日</div>
            <div class="girl">テスト嬢1</div>
            <div class="time">18:00-22:00</div>
            <img class="img" src="https://example.com/image1.jpg" />
            
            <div class="girl">テスト嬢2</div>
            <div class="time">19:00-23:00</div>
            <img class="img" src="https://example.com/image2.jpg" />
        </div>
        """
        
        soup = BeautifulSoup(html, 'html.parser')
        store_config = scraper.stores_config["stores"][0]
        
        girls_data, shifts_data = await scraper._extract_schedule_data(soup, store_config)
        
        assert len(girls_data) >= 2
        assert len(shifts_data) >= 2
        
        # 最初の嬢のデータをチェック
        first_girl = next((g for g in girls_data if g["name"] == "テスト嬢1"), None)
        assert first_girl is not None
        assert first_girl["image_url"] == "https://example.com/image1.jpg"
        
        # 最初のシフトのデータをチェック
        first_shift = next((s for s in shifts_data if s["girl_name"] == "テスト嬢1"), None)
        assert first_shift is not None
        assert first_shift["start_time"] == "18:00"
        assert first_shift["end_time"] == "22:00"

    def test_parse_shift_time(self, scraper):
        """シフト時間パースのテスト"""
        # ハイフン区切り
        start, end = scraper._parse_shift_time("18:00-22:00", "11:00", "23:00")
        assert start == "18:00"
        assert end == "22:00"
        
        # 波ダッシュ区切り
        start, end = scraper._parse_shift_time("19:00～23:00", "11:00", "23:00")
        assert start == "19:00"
        assert end == "23:00"
        
        # 無効な形式
        start, end = scraper._parse_shift_time("無効", "11:00", "23:00")
        assert start == "11:00"
        assert end == "23:00"

    @pytest.mark.asyncio
    async def test_save_scraped_data(self, scraper, db_session, sample_store_data):
        """スクレイピングデータ保存のテスト"""
        # 店舗を事前に作成
        store = Store(**sample_store_data)
        db_session.add(store)
        db_session.commit()
        
        girls_data = [
            {
                "name": "新嬢1",
                "image_url": "https://example.com/image1.jpg",
                "date": "2024-01-15"
            },
            {
                "name": "新嬢2", 
                "image_url": "https://example.com/image2.jpg",
                "date": "2024-01-15"
            }
        ]
        
        shifts_data = [
            {
                "girl_name": "新嬢1",
                "date": "2024-01-15",
                "start_time": "18:00",
                "end_time": "22:00",
                "shift_type": "regular"
            },
            {
                "girl_name": "新嬢2",
                "date": "2024-01-15", 
                "start_time": "19:00",
                "end_time": "23:00",
                "shift_type": "regular"
            }
        ]
        
        with patch('app.scraper.base.get_db') as mock_get_db:
            mock_get_db.return_value.__next__.return_value = db_session
            
            with patch.object(scraper.image_uploader, 'upload_image', return_value="uploaded_url"):
                girls_found, shifts_found = await scraper._save_scraped_data(
                    store.id, girls_data, shifts_data
                )
                
                assert girls_found == 2
                assert shifts_found == 2
                
                # データベースに保存されているかチェック
                girls = db_session.query(Girl).filter(Girl.store_id == store.id).all()
                assert len(girls) == 2
                assert all(girl.status == "new" for girl in girls)
                
                shifts = db_session.query(Shift).filter(Shift.store_id == store.id).all()
                assert len(shifts) == 2

    @pytest.mark.asyncio
    async def test_get_cached_data_or_empty(self, scraper, mock_redis):
        """キャッシュデータ取得のテスト"""
        # キャッシュがない場合
        mock_redis.get.return_value = None
        result = await scraper._get_cached_data_or_empty("test-store")
        
        assert result["status"] == "failed"
        assert result["girls_found"] == 0
        assert result["shifts_found"] == 0
        
        # キャッシュがある場合
        import json
        cached_data = {
            "girls": [{"name": "テスト嬢"}],
            "shifts": [{"girl_name": "テスト嬢", "date": "2024-01-15"}]
        }
        mock_redis.get.return_value = json.dumps(cached_data)
        
        result = await scraper._get_cached_data_or_empty("test-store")
        
        assert result["status"] == "cached"
        assert result["girls_found"] == 1
        assert result["shifts_found"] == 1


class TestImageUploader:
    """ImageUploaderクラスのテスト"""

    @pytest.fixture
    def uploader(self):
        """アップローダーインスタンス"""
        return ImageUploader()

    @pytest.mark.asyncio
    async def test_download_image_success(self, uploader):
        """画像ダウンロード成功のテスト"""
        mock_response = AsyncMock()
        mock_response.status = 200
        mock_response.read.return_value = b'fake_image_data'
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value = mock_response
            
            result = await uploader._download_image("https://example.com/image.jpg")
            
            assert result == b'fake_image_data'

    @pytest.mark.asyncio
    async def test_download_image_failure(self, uploader):
        """画像ダウンロード失敗のテスト"""
        mock_response = AsyncMock()
        mock_response.status = 404
        
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.return_value.__aenter__.return_value = mock_response
            
            result = await uploader._download_image("https://example.com/notfound.jpg")
            
            assert result is None

    @pytest.mark.asyncio 
    async def test_save_locally(self, uploader, temp_image_file):
        """ローカル保存のテスト"""
        image_data = b'fake_image_data'
        
        result = await uploader._save_locally(
            image_data, 
            "https://example.com/test.jpg", 
            "test_girl"
        )
        
        assert result is not None
        assert result.startswith("/images/")
        assert "test_girl" in result

    def test_cloudflare_configured(self, uploader):
        """Cloudflare設定チェックのテスト"""
        # 設定なしの場合
        assert not uploader._is_cloudflare_configured()
        
        # 設定ありの場合（モック）
        with patch('app.scraper.image_uploader.settings') as mock_settings:
            mock_settings.cloudflare_account_id = "test_account"
            mock_settings.cloudflare_api_token = "test_token" 
            mock_settings.cloudflare_images_url = "https://example.com"
            
            assert uploader._is_cloudflare_configured()

    @pytest.mark.asyncio
    async def test_upload_image_local_fallback(self, uploader):
        """Cloudflare未設定時のローカル保存テスト"""
        with patch.object(uploader, '_download_image', return_value=b'fake_data') as mock_download:
            with patch.object(uploader, '_save_locally', return_value="/images/test.jpg") as mock_save:
                
                result = await uploader.upload_image(
                    "https://example.com/test.jpg",
                    "test_identifier"
                )
                
                assert result == "/images/test.jpg"
                mock_download.assert_called_once()
                mock_save.assert_called_once()


class TestScheduler:
    """スケジューラーのテスト"""

    @pytest.mark.asyncio
    async def test_manual_scrape(self, mock_scraper):
        """手動スクレイピングのテスト"""
        from ..scraper.scheduler import ScrapingScheduler
        
        scheduler = ScrapingScheduler()
        scheduler.scraper = mock_scraper
        
        result = await scheduler.run_manual_scrape()
        
        assert result["total_girls"] == 1
        assert result["total_shifts"] == 1
        mock_scraper.scrape_all_stores.assert_called_once()

    def test_job_status(self):
        """ジョブ状態取得のテスト"""
        from ..scraper.scheduler import ScrapingScheduler
        
        scheduler = ScrapingScheduler()
        status = scheduler.get_job_status()
        
        assert "scheduler_running" in status
        assert "jobs" in status
        assert isinstance(status["jobs"], list)