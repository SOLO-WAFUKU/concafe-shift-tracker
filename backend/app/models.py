"""
データベースモデル定義
店舗、嬢、シフト情報を管理するSQLAlchemyモデル
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Store(Base):
    """店舗情報モデル"""
    __tablename__ = "stores"
    
    id = Column(String, primary_key=True)  # "maidreamin-akiba"
    name = Column(String(100), nullable=False)  # "めいどりーみん 秋葉原本店"
    url = Column(String(255), nullable=False)
    area = Column(String(50), nullable=False)  # "秋葉原"
    open_time = Column(String(5), nullable=False)  # "11:00"
    close_time = Column(String(5), nullable=False)  # "22:00"
    closed_days = Column(Text)  # JSON配列として保存 ["monday"]
    selectors = Column(Text, nullable=False)  # JSON形式でCSSセレクタ保存
    scraping_config = Column(Text)  # JSON形式でスクレイピング設定保存
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    girls = relationship("Girl", back_populates="store")
    shifts = relationship("Shift", back_populates="store")


class Girl(Base):
    """嬢情報モデル"""
    __tablename__ = "girls"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    name = Column(String(50), nullable=False)  # "ゆめか"
    image_url = Column(String(255))  # Cloudflare Images URL
    local_image_path = Column(String(255))  # ローカル画像パス（開発用）
    status = Column(String(10), default="active")  # active, new, left
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    profile_data = Column(Text)  # JSON形式で追加プロフィール情報
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    store = relationship("Store", back_populates="girls")
    shifts = relationship("Shift", back_populates="girl")
    
    # インデックス
    __table_args__ = (
        Index("idx_girls_store_name", "store_id", "name"),
        Index("idx_girls_status", "status"),
    )


class Shift(Base):
    """シフト情報モデル"""
    __tablename__ = "shifts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    girl_id = Column(Integer, ForeignKey("girls.id"), nullable=False)
    date = Column(String(10), nullable=False)  # "2024-01-15"
    start_time = Column(String(5), nullable=False)  # "18:00"
    end_time = Column(String(5), nullable=False)  # "22:00"
    shift_type = Column(String(20), default="regular")  # regular, special, event
    notes = Column(Text)  # 特記事項
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # リレーション
    store = relationship("Store", back_populates="shifts")
    girl = relationship("Girl", back_populates="shifts")
    
    # インデックス
    __table_args__ = (
        Index("idx_shifts_date", "date"),
        Index("idx_shifts_store_date", "store_id", "date"),
        Index("idx_shifts_girl_date", "girl_id", "date"),
    )


class ScrapingLog(Base):
    """スクレイピング実行ログモデル"""
    __tablename__ = "scraping_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    status = Column(String(20), nullable=False)  # success, failed, partial
    girls_found = Column(Integer, default=0)
    shifts_found = Column(Integer, default=0)
    error_message = Column(Text)
    execution_time = Column(Integer)  # ミリ秒
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # インデックス
    __table_args__ = (
        Index("idx_scraping_logs_store_date", "store_id", "started_at"),
    )