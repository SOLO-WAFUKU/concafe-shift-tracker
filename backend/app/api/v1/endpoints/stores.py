"""
店舗関連API エンドポイント
店舗一覧の取得とメタ情報を提供する
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ....database import get_db
from ....crud import StoreRepository
from ....schemas import StoreResponse
from .... import models

router = APIRouter()


@router.get("/", response_model=List[StoreResponse])
async def get_stores(db: Session = Depends(get_db)):
    """
    店舗一覧を取得する
    
    Returns:
        List[StoreResponse]: 店舗情報のリスト
    """
    stores = StoreRepository.get_all(db)
    
    # 各店舗の在籍嬢数を取得
    store_responses = []
    for store in stores:
        girls_count = db.query(models.Girl).filter(
            models.Girl.store_id == store.id,
            models.Girl.status.in_(["active", "new"])
        ).count()
        
        store_response = StoreResponse(
            id=store.id,
            name=store.name,
            area=store.area,
            open_time=store.open_time,
            close_time=store.close_time,
            url=store.url,
            is_active=store.is_active,
            girls_count=girls_count,
            last_updated=store.updated_at
        )
        store_responses.append(store_response)
    
    return store_responses


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str, db: Session = Depends(get_db)):
    """
    特定店舗の詳細情報を取得する
    
    Args:
        store_id: 店舗ID
        
    Returns:
        StoreResponse: 店舗詳細情報
    """
    store = StoreRepository.get_by_id(db, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # 在籍嬢数を取得
    girls_count = db.query(models.Girl).filter(
        models.Girl.store_id == store.id,
        models.Girl.status.in_(["active", "new"])
    ).count()
    
    return StoreResponse(
        id=store.id,
        name=store.name,
        area=store.area,
        open_time=store.open_time,
        close_time=store.close_time,
        url=store.url,
        is_active=store.is_active,
        girls_count=girls_count,
        last_updated=store.updated_at
    )