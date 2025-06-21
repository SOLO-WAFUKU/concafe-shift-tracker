"""
FastAPIメインアプリケーション
CORS設定、ミドルウェア、ルーティングを統合管理する
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
from pathlib import Path

from .config import settings
from .database import init_db
from .api.v1.api import api_router
from .scraper.scheduler import ScrapingScheduler

# ログ設定
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# グローバルスケジューラー
scheduler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    global scheduler
    
    # 起動時処理
    logger.info("Starting ConCafe Shift Tracker API...")
    
    # データベース初期化
    init_db()
    logger.info("Database initialized")
    
    # スケジューラー起動
    try:
        scheduler = ScrapingScheduler()
        scheduler.start()
        logger.info("Scraping scheduler started")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
    
    # 初回スクレイピング実行（非同期）
    try:
        if scheduler:
            # バックグラウンドで実行
            import asyncio
            asyncio.create_task(scheduler.run_manual_scrape())
            logger.info("Initial scraping task created")
    except Exception as e:
        logger.warning(f"Failed to start initial scraping: {e}")
    
    yield
    
    # 終了時処理
    logger.info("Shutting down ConCafe Shift Tracker API...")
    
    if scheduler:
        scheduler.shutdown()
        logger.info("Scraping scheduler shut down")


# FastAPIアプリケーション作成
app = FastAPI(
    title="ConCafe Shift Tracker API",
    description="秋葉原エリアのコンカフェ嬢出勤情報を自動集約するAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# リクエスト処理時間ログ用ミドルウェア
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """リクエスト処理時間をログに記録"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.3f}s"
    )
    
    # レスポンスヘッダーに処理時間を追加
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# APIルーターを登録
app.include_router(api_router, prefix="/api/v1")

# 静的ファイル配信（開発用）
static_path = Path(__file__).parent.parent.parent / "frontend" / "public"
if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")


# ヘルスチェック
@app.get("/health")
async def health_check():
    """API稼働状況を確認"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "scheduler_running": scheduler.scheduler.running if scheduler else False
    }


# ルートエンドポイント
@app.get("/")
async def root():
    """API情報を返す"""
    return {
        "message": "ConCafe Shift Tracker API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# エラーハンドラー
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """404エラーハンドラー"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"Path {request.url.path} not found",
            "path": str(request.url.path)
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """500エラーハンドラー"""
    logger.error(f"Internal server error: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "path": str(request.url.path)
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )