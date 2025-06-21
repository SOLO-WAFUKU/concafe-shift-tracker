"""
スケジューラー設定
APSchedulerを使用した定期スクレイピング実行を管理する
"""

import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from .base import ConCafeScraper
from ..config import settings

logger = logging.getLogger(__name__)


class ScrapingScheduler:
    """スクレイピング スケジューラー"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scraper = ConCafeScraper()
        self._setup_jobs()
    
    def _setup_jobs(self):
        """定期実行ジョブをセットアップ"""
        
        # メインスクレイピングジョブ（5分間隔）
        self.scheduler.add_job(
            func=self._scheduled_scrape,
            trigger=IntervalTrigger(seconds=settings.scraping_interval),
            id="main_scraping",
            name="Main scraping job",
            replace_existing=True,
            max_instances=1,
            coalesce=True
        )
        
        # 日次クリーンアップジョブ（毎日3:00に実行）
        self.scheduler.add_job(
            func=self._daily_cleanup,
            trigger=CronTrigger(hour=3, minute=0),
            id="daily_cleanup",
            name="Daily cleanup job",
            replace_existing=True
        )
        
        # 週次統計更新ジョブ（毎週月曜日4:00に実行）
        self.scheduler.add_job(
            func=self._weekly_stats_update,
            trigger=CronTrigger(day_of_week='mon', hour=4, minute=0),
            id="weekly_stats",
            name="Weekly statistics update",
            replace_existing=True
        )
    
    async def _scheduled_scrape(self):
        """定期実行されるスクレイピング処理"""
        try:
            logger.info("Starting scheduled scraping...")
            start_time = datetime.utcnow()
            
            results = await self.scraper.scrape_all_stores()
            
            end_time = datetime.utcnow()
            duration = (end_time - start_time).total_seconds()
            
            logger.info(
                f"Scheduled scraping completed in {duration:.2f}s. "
                f"Success: {len(results['success'])}, "
                f"Failed: {len(results['failed'])}, "
                f"Total girls: {results['total_girls']}, "
                f"Total shifts: {results['total_shifts']}"
            )
            
            # Redis に最新実行結果を保存
            from ..database import get_redis
            import json
            redis_client = get_redis()
            
            summary = {
                "executed_at": end_time.isoformat(),
                "duration_seconds": duration,
                "success_count": len(results['success']),
                "failed_count": len(results['failed']),
                "total_girls": results['total_girls'],
                "total_shifts": results['total_shifts']
            }
            
            redis_client.setex("scraping:last_execution", 3600, json.dumps(summary))
            
        except Exception as e:
            logger.error(f"Error in scheduled scraping: {e}", exc_info=True)
    
    async def _daily_cleanup(self):
        """日次クリーンアップ処理"""
        try:
            logger.info("Starting daily cleanup...")
            
            from ..database import get_db
            from ..models import ScrapingLog, Shift
            from datetime import timedelta
            
            # 30日以前のスクレイピングログを削除
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            with next(get_db()) as db:
                old_logs_count = db.query(ScrapingLog).filter(
                    ScrapingLog.started_at < cutoff_date
                ).count()
                
                db.query(ScrapingLog).filter(
                    ScrapingLog.started_at < cutoff_date
                ).delete()
                
                # 90日以前のシフトデータを削除
                old_shift_cutoff = datetime.utcnow() - timedelta(days=90)
                old_shifts_count = db.query(Shift).filter(
                    Shift.scraped_at < old_shift_cutoff
                ).count()
                
                db.query(Shift).filter(
                    Shift.scraped_at < old_shift_cutoff
                ).delete()
                
                db.commit()
                
                logger.info(
                    f"Daily cleanup completed. "
                    f"Deleted {old_logs_count} old logs and {old_shifts_count} old shifts."
                )
                
        except Exception as e:
            logger.error(f"Error in daily cleanup: {e}", exc_info=True)
    
    async def _weekly_stats_update(self):
        """週次統計更新処理"""
        try:
            logger.info("Starting weekly stats update...")
            
            from ..database import get_db, get_redis
            from ..crud import AdminRepository
            import json
            
            with next(get_db()) as db:
                stats = AdminRepository.get_stats(db)
                
                # Redis に統計情報を保存
                redis_client = get_redis()
                weekly_stats = {
                    "updated_at": datetime.utcnow().isoformat(),
                    "stats": stats
                }
                
                redis_client.setex("stats:weekly", 604800, json.dumps(weekly_stats))  # 1週間保持
                
                logger.info(f"Weekly stats updated: {stats}")
                
        except Exception as e:
            logger.error(f"Error in weekly stats update: {e}", exc_info=True)
    
    def start(self):
        """スケジューラーを開始"""
        try:
            self.scheduler.start()
            logger.info("Scraping scheduler started successfully")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}")
    
    def shutdown(self):
        """スケジューラーを停止"""
        try:
            self.scheduler.shutdown(wait=True)
            logger.info("Scraping scheduler shut down")
        except Exception as e:
            logger.error(f"Error shutting down scheduler: {e}")
    
    def get_job_status(self) -> dict:
        """実行中ジョブの状態を取得"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        
        return {
            "scheduler_running": self.scheduler.running,
            "jobs": jobs
        }
    
    async def run_manual_scrape(self, store_ids: list = None) -> dict:
        """手動スクレイピングを実行"""
        try:
            logger.info(f"Starting manual scraping for stores: {store_ids or 'all'}")
            
            if store_ids:
                # 特定店舗のみスクレイピング
                results = {"success": [], "failed": [], "total_girls": 0, "total_shifts": 0}
                
                # 店舗設定を取得
                target_stores = [
                    store for store in self.scraper.stores_config.get("stores", [])
                    if store["id"] in store_ids
                ]
                
                if not target_stores:
                    return {"error": "No valid store IDs provided"}
                
                # 個別にスクレイピング実行
                from playwright.async_api import async_playwright
                
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=settings.playwright_headless)
                    
                    try:
                        for store_config in target_stores:
                            result = await self.scraper._scrape_store_safe(browser, store_config)
                            
                            if result["status"] == "success":
                                results["success"].append(result)
                                results["total_girls"] += result["girls_found"]
                                results["total_shifts"] += result["shifts_found"]
                            else:
                                results["failed"].append(result)
                    finally:
                        await browser.close()
                
                return results
            else:
                # 全店舗スクレイピング
                return await self.scraper.scrape_all_stores()
                
        except Exception as e:
            logger.error(f"Error in manual scraping: {e}")
            return {"error": str(e)}