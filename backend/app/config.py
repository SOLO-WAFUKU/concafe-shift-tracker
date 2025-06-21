"""
アプリケーション設定管理
環境変数とデフォルト値を統合管理する
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """アプリケーション設定クラス"""
    
    # データベース設定
    database_url: str = "sqlite:///./concafe.db"
    postgres_url: Optional[str] = None
    
    # Redis設定
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 900  # 15分
    
    # スクレイピング設定
    scraping_interval: int = 300  # 5分
    playwright_headless: bool = True
    max_concurrent_scrapers: int = 3
    
    # Cloudflare Images設定
    cloudflare_account_id: Optional[str] = None
    cloudflare_api_token: Optional[str] = None
    cloudflare_images_url: Optional[str] = None
    
    # 認証設定
    admin_username: str = "admin"
    admin_password: str = "concafe-admin-2024"
    secret_key: str = "your-secret-key-change-in-production"
    
    # CORS設定
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # ログ設定
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"


settings = Settings()