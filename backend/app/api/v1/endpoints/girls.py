"""
嬢情報関連API エンドポイント
嬢のプロフィールとシフト履歴を提供する
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from collections import Counter

from ....database import get_db, get_redis
from ....crud import GirlRepository
from ....schemas import GirlResponse, GirlDetailResponse, ShiftResponse
from .... import models
import json

router = APIRouter()


@router.get("/", response_model=List[GirlResponse])
async def get_girls(
    store_id: Optional[str] = Query(None, description="店舗IDでフィルター"),
    status: Optional[str] = Query(None, description="ステータスでフィルター (active/new/left)"),
    limit: int = Query(100, description="取得件数", ge=1, le=200),
    offset: int = Query(0, description="オフセット", ge=0),
    db: Session = Depends(get_db)
):
    """
    嬢一覧を取得する
    
    Args:
        store_id: 店舗ID (オプション)
        status: ステータス (オプション)
        limit: 最大取得件数
        offset: オフセット
        
    Returns:
        List[GirlResponse]: 嬢情報のリスト
    """
    query = db.query(models.Girl)
    
    # フィルター条件を適用
    if store_id:
        query = query.filter(models.Girl.store_id == store_id)
    
    if status:
        if status not in ["active", "new", "left"]:
            raise HTTPException(status_code=400, detail="Invalid status. Use: active, new, left")
        query = query.filter(models.Girl.status == status)
    
    # 結果取得
    girls = query.order_by(
        models.Girl.last_seen.desc()
    ).offset(offset).limit(limit).all()
    
    # レスポンス形式に変換
    girl_responses = []
    for girl in girls:
        girl_response = GirlResponse(
            id=girl.id,
            name=girl.name,
            store_id=girl.store_id,
            image_url=girl.image_url,
            status=girl.status,
            first_seen=girl.first_seen,
            last_seen=girl.last_seen
        )
        girl_responses.append(girl_response)
    
    return girl_responses


@router.get("/{girl_id}", response_model=GirlDetailResponse)
async def get_girl_detail(
    girl_id: int,
    db: Session = Depends(get_db)
):
    """
    嬢の詳細情報を取得する
    
    Args:
        girl_id: 嬢ID
        
    Returns:
        GirlDetailResponse: 嬢の詳細情報（シフト履歴含む）
    """
    # キャッシュをチェック
    redis_client = get_redis()
    cache_key = f"girl_detail:{girl_id}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 嬢情報を取得
    girl = GirlRepository.get_by_id(db, girl_id)
    if not girl:
        raise HTTPException(status_code=404, detail="Girl not found")
    
    # 直近のシフト履歴を取得
    recent_shifts = GirlRepository.get_recent_shifts(db, girl_id, limit=30)
    
    # シフト履歴をレスポンス形式に変換
    shift_responses = []
    for shift in recent_shifts:
        shift_response = ShiftResponse(
            id=shift.id,
            store_id=shift.store_id,
            girl_id=shift.girl_id,
            girl_name=girl.name,
            girl_image_url=girl.image_url,
            date=shift.date,
            start_time=shift.start_time,
            end_time=shift.end_time,
            shift_type=shift.shift_type,
            notes=shift.notes
        )
        shift_responses.append(shift_response)
    
    # 統計情報を計算
    work_days_count = len(recent_shifts)
    
    # よく入る時間帯を分析
    time_slots = []
    for shift in recent_shifts:
        start_hour = int(shift.start_time.split(':')[0])
        if start_hour < 12:
            time_slots.append("morning")
        elif start_hour < 17:
            time_slots.append("afternoon")
        else:
            time_slots.append("evening")
    
    # 頻度の高い時間帯を取得
    time_counter = Counter(time_slots)
    favorite_time_slots = [slot for slot, _ in time_counter.most_common(3)]
    
    # 時間帯名を日本語に変換
    time_slot_names = {
        "morning": "午前",
        "afternoon": "午後",
        "evening": "夜間"
    }
    favorite_time_slots = [time_slot_names.get(slot, slot) for slot in favorite_time_slots]
    
    response = GirlDetailResponse(
        id=girl.id,
        name=girl.name,
        store_id=girl.store_id,
        image_url=girl.image_url,
        status=girl.status,
        first_seen=girl.first_seen,
        last_seen=girl.last_seen,
        recent_shifts=shift_responses,
        work_days_count=work_days_count,
        favorite_time_slots=favorite_time_slots
    )
    
    # 結果をキャッシュ (30分間)
    redis_client.setex(cache_key, 1800, json.dumps(response.dict()))
    
    return response


@router.get("/search/")
async def search_girls(
    name: Optional[str] = Query(None, description="嬢名で検索（部分一致）"),
    store_id: Optional[str] = Query(None, description="店舗IDで検索"),
    status: Optional[str] = Query(None, description="ステータスで検索"),
    limit: int = Query(50, description="取得件数", ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    嬢情報を条件検索する
    
    Args:
        name: 嬢名（部分一致）
        store_id: 店舗ID
        status: ステータス
        limit: 最大取得件数
        
    Returns:
        List[GirlResponse]: 検索結果
    """
    query = db.query(models.Girl)
    
    # 検索条件を適用
    if name:
        query = query.filter(models.Girl.name.ilike(f"%{name}%"))
    
    if store_id:
        query = query.filter(models.Girl.store_id == store_id)
    
    if status:
        if status not in ["active", "new", "left"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        query = query.filter(models.Girl.status == status)
    
    # 結果取得
    girls = query.order_by(
        models.Girl.last_seen.desc()
    ).limit(limit).all()
    
    # レスポンス形式に変換
    results = []
    for girl in girls:
        girl_response = GirlResponse(
            id=girl.id,
            name=girl.name,
            store_id=girl.store_id,
            image_url=girl.image_url,
            status=girl.status,
            first_seen=girl.first_seen,
            last_seen=girl.last_seen
        )
        results.append(girl_response)
    
    return results


@router.get("/new-today/", response_model=List[GirlResponse])
async def get_new_girls_today(
    db: Session = Depends(get_db)
):
    """
    本日新規発見された嬢一覧を取得する
    
    Returns:
        List[GirlResponse]: 本日新規発見された嬢のリスト
    """
    from datetime import datetime
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # キャッシュをチェック
    redis_client = get_redis()
    cache_key = f"new_girls_today:{today}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return json.loads(cached_data)
    
    # 本日NEW状態になった嬢を取得
    from sqlalchemy import func, and_
    
    new_girls = db.query(models.Girl).filter(
        and_(
            models.Girl.status == "new",
            func.date(models.Girl.first_seen) == today
        )
    ).order_by(models.Girl.first_seen.desc()).all()
    
    # レスポンス形式に変換
    results = []
    for girl in new_girls:
        girl_response = GirlResponse(
            id=girl.id,
            name=girl.name,
            store_id=girl.store_id,
            image_url=girl.image_url,
            status=girl.status,
            first_seen=girl.first_seen,
            last_seen=girl.last_seen
        )
        results.append(girl_response)
    
    # 結果をキャッシュ (1時間)
    redis_client.setex(cache_key, 3600, json.dumps([r.dict() for r in results]))
    
    return results