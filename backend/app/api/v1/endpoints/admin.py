"""
管理者用API エンドポイント
Basic認証で保護された管理機能を提供する
"""

import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session
from typing import List

from ....database import get_db, get_redis
from ....crud import AdminRepository
from ....schemas import AdminStatsResponse, ScrapingStatus, ManualScrapeRequest
from ....config import settings
from ....scraper.scheduler import ScrapingScheduler
from ....scraper.image_uploader import ImageUploader
import json

router = APIRouter()
security = HTTPBasic()

# スケジューラーインスタンス（グローバル）
scraping_scheduler = None


def get_current_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Basic認証でユーザーを検証"""
    correct_username = secrets.compare_digest(credentials.username, settings.admin_username)
    correct_password = secrets.compare_digest(credentials.password, settings.admin_password)
    
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    """
    管理者統計情報を取得する
    
    Returns:
        AdminStatsResponse: 統計情報とスクレイピング状況
    """
    # 基本統計を取得
    stats = AdminRepository.get_stats(db)
    
    # スクレイピング状況を取得
    scraping_logs = AdminRepository.get_scraping_logs(db, limit=20)
    
    # 店舗別の最新ステータスを作成
    scraping_status_dict = {}
    for log in scraping_logs:
        if log.store_id not in scraping_status_dict:
            scraping_status_dict[log.store_id] = ScrapingStatus(
                store_id=log.store_id,
                store_name=log.store_id,  # 実際は店舗名を取得
                status=log.status,
                last_run=log.started_at,
                girls_found=log.girls_found,
                shifts_found=log.shifts_found,
                error_message=log.error_message
            )
    
    # 店舗名を取得して更新
    from ....crud import StoreRepository
    for status_obj in scraping_status_dict.values():
        store = StoreRepository.get_by_id(db, status_obj.store_id)
        if store:
            status_obj.store_name = store.name
    
    # Cloudflare使用量を取得
    image_uploader = ImageUploader()
    cloudflare_usage = image_uploader.get_cloudflare_usage()
    
    response = AdminStatsResponse(
        total_stores=stats["total_stores"],
        total_girls=stats["total_girls"],
        total_shifts=stats["total_shifts"],
        active_girls=stats["active_girls"],
        new_girls_today=stats["new_girls_today"],
        scraping_status=list(scraping_status_dict.values()),
        cloudflare_usage=cloudflare_usage
    )
    
    return response


@router.post("/scrape")
async def manual_scrape(
    request: ManualScrapeRequest,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    """
    手動スクレイピングを実行する
    
    Args:
        request: スクレイピングリクエスト
        
    Returns:
        dict: 実行結果
    """
    global scraping_scheduler
    
    if not scraping_scheduler:
        scraping_scheduler = ScrapingScheduler()
    
    try:
        # 手動スクレイピング実行
        result = await scraping_scheduler.run_manual_scrape(request.store_ids)
        
        return {
            "status": "completed",
            "message": "Manual scraping completed successfully",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scraping failed: {str(e)}"
        )


@router.get("/scheduler/status")
async def get_scheduler_status(
    _: str = Depends(get_current_admin)
):
    """
    スケジューラーの状態を取得する
    
    Returns:
        dict: スケジューラー状態情報
    """
    global scraping_scheduler
    
    if not scraping_scheduler:
        return {
            "scheduler_running": False,
            "jobs": [],
            "message": "Scheduler not initialized"
        }
    
    status = scraping_scheduler.get_job_status()
    
    # 最後の実行結果をRedisから取得
    redis_client = get_redis()
    last_execution = redis_client.get("scraping:last_execution")
    
    if last_execution:
        status["last_execution"] = json.loads(last_execution)
    
    return status


@router.post("/scheduler/start")
async def start_scheduler(
    _: str = Depends(get_current_admin)
):
    """
    スケジューラーを開始する
    
    Returns:
        dict: 開始結果
    """
    global scraping_scheduler
    
    try:
        if not scraping_scheduler:
            scraping_scheduler = ScrapingScheduler()
        
        scraping_scheduler.start()
        
        return {
            "status": "success",
            "message": "Scheduler started successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start scheduler: {str(e)}"
        )


@router.post("/scheduler/stop")
async def stop_scheduler(
    _: str = Depends(get_current_admin)
):
    """
    スケジューラーを停止する
    
    Returns:
        dict: 停止結果
    """
    global scraping_scheduler
    
    try:
        if scraping_scheduler:
            scraping_scheduler.shutdown()
            scraping_scheduler = None
        
        return {
            "status": "success",
            "message": "Scheduler stopped successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to stop scheduler: {str(e)}"
        )


@router.get("/logs")
async def get_scraping_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    _: str = Depends(get_current_admin)
):
    """
    スクレイピングログを取得する
    
    Args:
        limit: 取得件数
        
    Returns:
        List[dict]: ログエントリのリスト
    """
    logs = AdminRepository.get_scraping_logs(db, limit)
    
    # 店舗名を含むログ情報を構築
    log_entries = []
    for log in logs:
        from ....crud import StoreRepository
        store = StoreRepository.get_by_id(db, log.store_id)
        
        log_entry = {
            "id": log.id,
            "store_id": log.store_id,
            "store_name": store.name if store else "Unknown Store",
            "status": log.status,
            "girls_found": log.girls_found,
            "shifts_found": log.shifts_found,
            "error_message": log.error_message,
            "execution_time": log.execution_time,
            "started_at": log.started_at.isoformat(),
            "completed_at": log.completed_at.isoformat() if log.completed_at else None
        }
        log_entries.append(log_entry)
    
    return log_entries


@router.delete("/cache")
async def clear_cache(
    _: str = Depends(get_current_admin)
):
    """
    全てのキャッシュをクリアする
    
    Returns:
        dict: クリア結果
    """
    try:
        redis_client = get_redis()
        
        # 関連するキーパターンのキャッシュをクリア
        patterns = [
            "shifts_by_date:*",
            "store_shifts:*",
            "girl_detail:*",
            "new_girls_today:*",
            "scraping:*"
        ]
        
        cleared_count = 0
        for pattern in patterns:
            keys = redis_client.keys(pattern)
            if keys:
                redis_client.delete(*keys)
                cleared_count += len(keys)
        
        return {
            "status": "success",
            "message": f"Cleared {cleared_count} cache entries"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear cache: {str(e)}"
        )