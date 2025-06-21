"""
Pydanticスキーマ定義
APIリクエスト・レスポンスの型定義を管理する
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class StoreBase(BaseModel):
    """店舗基本情報スキーマ"""
    id: str = Field(..., description="店舗ID")
    name: str = Field(..., description="店舗名")
    area: str = Field(..., description="エリア")
    open_time: str = Field(..., description="開店時間")
    close_time: str = Field(..., description="閉店時間")


class StoreResponse(StoreBase):
    """店舗情報レスポンススキーマ"""
    url: str = Field(..., description="店舗URL")
    is_active: bool = Field(..., description="営業状態")
    girls_count: int = Field(0, description="在籍嬢数")
    last_updated: Optional[datetime] = Field(None, description="最終更新時刻")
    
    model_config = ConfigDict(from_attributes=True)


class GirlBase(BaseModel):
    """嬢基本情報スキーマ"""
    name: str = Field(..., description="嬢名")
    store_id: str = Field(..., description="店舗ID")


class GirlResponse(GirlBase):
    """嬢情報レスポンススキーマ"""
    id: int = Field(..., description="嬢ID")
    image_url: Optional[str] = Field(None, description="画像URL")
    status: str = Field(..., description="ステータス (active/new/left)")
    first_seen: datetime = Field(..., description="初回発見日時")
    last_seen: datetime = Field(..., description="最終発見日時")
    
    model_config = ConfigDict(from_attributes=True)


class ShiftBase(BaseModel):
    """シフト基本情報スキーマ"""
    date: str = Field(..., description="勤務日 (YYYY-MM-DD)")
    start_time: str = Field(..., description="開始時刻 (HH:MM)")
    end_time: str = Field(..., description="終了時刻 (HH:MM)")


class ShiftResponse(ShiftBase):
    """シフト情報レスポンススキーマ"""
    id: int = Field(..., description="シフトID")
    store_id: str = Field(..., description="店舗ID")
    girl_id: int = Field(..., description="嬢ID")
    girl_name: str = Field(..., description="嬢名")
    girl_image_url: Optional[str] = Field(None, description="嬢の画像URL")
    shift_type: str = Field(..., description="シフト種別")
    notes: Optional[str] = Field(None, description="備考")
    
    model_config = ConfigDict(from_attributes=True)


class DayShiftsResponse(BaseModel):
    """日別シフト情報レスポンススキーマ"""
    date: str = Field(..., description="対象日")
    total_girls: int = Field(..., description="出勤嬢総数")
    stores: List[dict] = Field(..., description="店舗別シフト情報")


class StoreShiftsResponse(BaseModel):
    """店舗別シフト情報レスポンススキーマ"""
    store: StoreResponse = Field(..., description="店舗情報")
    shifts: List[ShiftResponse] = Field(..., description="シフト一覧")
    date_range: dict = Field(..., description="取得期間")


class GirlDetailResponse(GirlResponse):
    """嬢詳細情報レスポンススキーマ"""
    recent_shifts: List[ShiftResponse] = Field(..., description="直近のシフト履歴")
    work_days_count: int = Field(..., description="勤務日数")
    favorite_time_slots: List[str] = Field(..., description="よく入る時間帯")


class ScrapingStatus(BaseModel):
    """スクレイピング状況レスポンススキーマ"""
    store_id: str = Field(..., description="店舗ID")
    store_name: str = Field(..., description="店舗名")
    status: str = Field(..., description="実行状況")
    last_run: Optional[datetime] = Field(None, description="最終実行時刻")
    girls_found: int = Field(0, description="発見嬢数")
    shifts_found: int = Field(0, description="発見シフト数")
    error_message: Optional[str] = Field(None, description="エラーメッセージ")


class AdminStatsResponse(BaseModel):
    """管理者統計情報レスポンススキーマ"""
    total_stores: int = Field(..., description="総店舗数")
    total_girls: int = Field(..., description="総嬢数")
    total_shifts: int = Field(..., description="総シフト数")
    active_girls: int = Field(..., description="アクティブ嬢数")
    new_girls_today: int = Field(..., description="本日新規発見嬢数")
    scraping_status: List[ScrapingStatus] = Field(..., description="スクレイピング状況")
    cloudflare_usage: Optional[dict] = Field(None, description="Cloudflare使用量")


class ManualScrapeRequest(BaseModel):
    """手動スクレイピングリクエストスキーマ"""
    store_ids: Optional[List[str]] = Field(None, description="対象店舗ID（未指定時は全店舗）")
    force_update: bool = Field(False, description="強制更新フラグ")