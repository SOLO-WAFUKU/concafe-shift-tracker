"""
データベース接続とセッション管理
SQLAlchemyを使用したDB操作の基盤を提供する
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import redis
from .config import settings

# SQLAlchemy設定
if settings.postgres_url:
    engine = create_engine(
        settings.postgres_url,
        pool_pre_ping=True,
        echo=False
    )
else:
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
        poolclass=StaticPool if "sqlite" in settings.database_url else None,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis接続
redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def get_db() -> Generator[Session, None, None]:
    """
    データベースセッションを取得する依存性注入用関数
    
    Yields:
        Session: SQLAlchemyセッション
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis() -> redis.Redis:
    """
    Redisクライアントを取得する
    
    Returns:
        redis.Redis: Redisクライアント
    """
    return redis_client


def init_db() -> None:
    """
    データベースの初期化を行う
    テーブル作成とインデックス設定を実行する
    """
    Base.metadata.create_all(bind=engine)