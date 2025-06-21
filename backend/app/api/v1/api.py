"""
APIルーターの統合
各エンドポイントを統合してAPIルーターを構築する
"""

from fastapi import APIRouter

from .endpoints import stores, shifts, girls, admin

api_router = APIRouter()

# 各エンドポイントを登録
api_router.include_router(
    stores.router,
    prefix="/stores",
    tags=["stores"]
)

api_router.include_router(
    shifts.router,
    prefix="/shifts",
    tags=["shifts"]
)

api_router.include_router(
    girls.router,
    prefix="/girls",
    tags=["girls"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["admin"]
)