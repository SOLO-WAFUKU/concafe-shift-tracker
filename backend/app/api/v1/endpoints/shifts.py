"""
シフト関連API エンドポイント
シフト情報の取得と検索を提供する
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ....database import get_db, get_redis
from ....crud import ShiftRepository, StoreRepository
from ....schemas import ShiftResponse, DayShiftsResponse, StoreShiftsResponse
from .... import models
import json

router = APIRouter()


@router.get("/", response_model=DayShiftsResponse)
async def get_shifts_by_date(
    date: str = Query(..., description="取得日付 (YYYY-MM-DD形式)"),
    store_id: Optional[str] = Query(None, description="特定店舗のみ取得"),
    db: Session = Depends(get_db)
):
    """
    指定日のシフト情報を取得する
    
    Args:
        date: 取得日付 (YYYY-MM-DD)
        store_id: 店舗ID (オプション)
        
    Returns:
        DayShiftsResponse: 日別シフト情報
    """
    # 日付フォーマットの検証
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # キャッシュをチェック
    redis_client = get_redis()
    cache_key = f"shifts_by_date:{date}:{store_id or 'all'}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # データベースからシフトを取得
    query = db.query(models.Shift).join(models.Girl).filter(
        models.Shift.date == date
    )
    
    if store_id:
        query = query.filter(models.Shift.store_id == store_id)
    
    shifts = query.order_by(
        models.Shift.store_id,
        models.Shift.start_time
    ).all()
    
    # 店舗別にグループ化
    stores_data = {}
    total_girls = 0
    
    for shift in shifts:
        if shift.store_id not in stores_data:
            store = StoreRepository.get_by_id(db, shift.store_id)
            stores_data[shift.store_id] = {
                "store_id": shift.store_id,
                "store_name": store.name if store else "Unknown Store",
                "shifts": []
            }
        
        shift_response = ShiftResponse(
            id=shift.id,
            store_id=shift.store_id,
            girl_id=shift.girl_id,
            girl_name=shift.girl.name,
            girl_image_url=shift.girl.image_url,
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            notes=shift.notes
        )
        
        stores_data[shift.store_id]["shifts"].append(shift_response.dict())
        total_girls += 1
    
    response = DayShiftsResponse(
        date=date,
        total_girls=total_girls,
        stores=list(stores_data.values())
    )
    
    # 結果をキャッシュ (5分間)
    redis_client.setex(cache_key, 300, json.dumps(response.dict()))
    
    return response


@router.get("/{store_id}", response_model=StoreShiftsResponse)
async def get_store_shifts(
    store_id: str,
    days: int = Query(7, description="取得日数 (1-14)", ge=1, le=14),
    start_date: Optional[str] = Query(None, description="開始日 (YYYY-MM-DD, 未指定時は今日)"),
    db: Session = Depends(get_db)
):
    """
    特定店舗のシフト情報を期間指定で取得する
    
    Args:
        store_id: 店舗ID
        days: 取得日数 (1-14日)
        start_date: 開始日 (未指定時は今日)
        
    Returns:
        StoreShiftsResponse: 店舗別シフト情報
    """
    # 店舗の存在確認
    store = StoreRepository.get_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # 開始日の設定
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
    else:
        start_dt = datetime.now()
    
    end_dt = start_dt + timedelta(days=days-1)
    start_date_str = start_dt.strftime("%Y-%m-%d")
    end_date_str = end_dt.strftime("%Y-%m-%d")
    
    # キャッシュをチェック
    redis_client = get_redis()
    cache_key = f"store_shifts:{store_id}:{start_date_str}:{end_date_str}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # シフトデータを取得
    shifts = ShiftRepository.get_by_store_and_date_range(
        db, store_id, start_date_str, end_date_str
    )
    
    # レスポンス形式に変換
    shift_responses = []
    for shift in shifts:
        shift_response = ShiftResponse(
            id=shift.id,
            store_id=shift.store_id,
            girl_id=shift.girl_id,
            girl_name=shift.girl.name,
            girl_image_url=shift.girl.image_url,
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            notes=shift.notes
        )
        shift_responses.append(shift_response)
    
    # 店舗情報
    from ....schemas import StoreResponse
    store_response = StoreResponse(
        id=store.id,
        name=store.name,
        area=store.area,
        open_time=store.open_time,
        close_time=store.close_time,
        url=store.url,
        is_active=store.is_active,
        girls_count=len(set(shift.girl_id for shift in shifts)),
        last_updated=store.updated_at
    )
    
    response = StoreShiftsResponse(
        store=store_response,
        shifts=shift_responses,
        date_range={
            "start_date": start_date_str,
            "end_date": end_date_str,
            "days": days
        }
    )
    
    # 結果をキャッシュ (10分間)
    redis_client.setex(cache_key, 600, json.dumps(response.dict()))
    
    return response


@router.get("/search/")
async def search_shifts(
    girl_name: Optional[str] = Query(None, description="嬢名で検索"),
    store_name: Optional[str] = Query(None, description="店舗名で検索"), 
    date_from: Optional[str] = Query(None, description="検索開始日 (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="検索終了日 (YYYY-MM-DD)"),
    limit: int = Query(50, description="取得件数", ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    シフト情報を条件検索する
    
    Args:
        girl_name: 嬢名（部分一致）
        store_name: 店舗名（部分一致）
        date_from: 検索開始日
        date_to: 検索終了日
        limit: 最大取得件数
        
    Returns:
        List[ShiftResponse]: 検索結果
    """
    query = db.query(models.Shift).join(models.Girl).join(models.Store)
    
    # 検索条件を適用
    if girl_name:
        query = query.filter(models.Girl.name.ilike(f"%{girl_name}%"))
    
    if store_name:
        query = query.filter(models.Store.name.ilike(f"%{store_name}%"))
    
    if date_from:
        try:
            datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(models.Shift.date >= date_from)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format")
    
    if date_to:
        try:
            datetime.strptime(date_to, "%Y-%m-%d")
            query = query.filter(models.Shift.date <= date_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format")
    
    # 結果取得
    shifts = query.order_by(
        models.Shift.date.desc(),
        models.Shift.start_time
    ).limit(limit).all()
    
    # レスポンス形式に変換
    results = []
    for shift in shifts:
        shift_response = ShiftResponse(
            id=shift.id,
            store_id=shift.store_id,
            girl_id=shift.girl_id,
            girl_name=shift.girl.name,
            girl_image_url=shift.girl.image_url,
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            notes=shift.notes
        )
        results.append(shift_response)
    
    return results