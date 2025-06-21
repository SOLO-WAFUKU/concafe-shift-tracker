"""
ConCafe Shift Tracker - デモ版
スクレイピング機能を無効化した簡易版
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
import json

# FastAPIアプリケーション作成
app = FastAPI(
    title="ConCafe Shift Tracker API (Demo)",
    description="秋葉原エリアのコンカフェ嬢出勤情報API - デモ版",
    version="1.0.0-demo",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# デモデータ
demo_stores = [
    {
        "id": "maidreamin-akiba",
        "name": "めいどりーみん 秋葉原本店",
        "area": "秋葉原",
        "open_time": "11:00",
        "close_time": "22:00",
        "url": "https://maidreamin.com/schedule/",
        "is_active": True,
        "girls_count": 12,
        "last_updated": datetime.now().isoformat()
    },
    {
        "id": "hanagatami-akiba", 
        "name": "花魁茶屋 秋葉原店",
        "area": "秋葉原",
        "open_time": "17:00", 
        "close_time": "23:00",
        "url": "https://hanagatami.jp/akihabara/schedule/",
        "is_active": True,
        "girls_count": 8,
        "last_updated": datetime.now().isoformat()
    },
    {
        "id": "cure-maid-akiba",
        "name": "CURE MAID CAFE", 
        "area": "秋葉原",
        "open_time": "11:30",
        "close_time": "20:00",
        "url": "https://www.curemaid.jp/schedule/",
        "is_active": True,
        "girls_count": 15,
        "last_updated": datetime.now().isoformat()
    }
]

demo_girls = [
    {"id": 1, "name": "ゆめか", "store_id": "maidreamin-akiba", "status": "active", "image_url": "/images/placeholder1.jpg"},
    {"id": 2, "name": "ひまり", "store_id": "maidreamin-akiba", "status": "new", "image_url": "/images/placeholder2.jpg"},
    {"id": 3, "name": "あかね", "store_id": "hanagatami-akiba", "status": "active", "image_url": "/images/placeholder3.jpg"},
    {"id": 4, "name": "みお", "store_id": "cure-maid-akiba", "status": "active", "image_url": "/images/placeholder4.jpg"},
    {"id": 5, "name": "さくら", "store_id": "cure-maid-akiba", "status": "new", "image_url": "/images/placeholder5.jpg"},
]

# 今日から7日分のシフトデータを生成
def generate_demo_shifts():
    shifts = []
    shift_id = 1
    
    for day_offset in range(7):
        date = (datetime.now() + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        
        for girl in demo_girls:
            # ランダムにシフトを生成（70%の確率で出勤）
            import random
            if random.random() < 0.7:
                start_hour = random.choice([17, 18, 19, 20])
                end_hour = start_hour + random.choice([3, 4, 5])
                
                shifts.append({
                    "id": shift_id,
                    "store_id": girl["store_id"],
                    "girl_id": girl["id"],
                    "girl_name": girl["name"],
                    "girl_image_url": girl["image_url"],
                    "date": date,
                    "start_time": f"{start_hour:02d}:00",
                    "end_time": f"{end_hour:02d}:00",
                    "shift_type": "regular",
                    "notes": None
                })
                shift_id += 1
    
    return shifts

demo_shifts = generate_demo_shifts()

@app.get("/")
async def root():
    return {
        "message": "ConCafe Shift Tracker API - Demo Version",
        "version": "1.0.0-demo",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "mode": "demo"
    }

@app.get("/api/v1/stores")
async def get_stores():
    return demo_stores

@app.get("/api/v1/shifts")
async def get_shifts(date: str = None):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    
    today_shifts = [s for s in demo_shifts if s["date"] == date]
    
    # 店舗別にグループ化
    stores_data = {}
    for shift in today_shifts:
        store_id = shift["store_id"]
        if store_id not in stores_data:
            store = next(s for s in demo_stores if s["id"] == store_id)
            stores_data[store_id] = {
                "store_id": store_id,
                "store_name": store["name"],
                "shifts": []
            }
        stores_data[store_id]["shifts"].append(shift)
    
    return {
        "date": date,
        "total_girls": len(today_shifts),
        "stores": list(stores_data.values())
    }

@app.get("/api/v1/girls")
async def get_girls():
    return demo_girls

@app.get("/api/v1/girls/{girl_id}")
async def get_girl_detail(girl_id: int):
    girl = next((g for g in demo_girls if g["id"] == girl_id), None)
    if not girl:
        return JSONResponse(status_code=404, content={"detail": "Girl not found"})
    
    girl_shifts = [s for s in demo_shifts if s["girl_id"] == girl_id][:10]
    
    return {
        **girl,
        "first_seen": datetime.now().isoformat(),
        "last_seen": datetime.now().isoformat(),
        "recent_shifts": girl_shifts,
        "work_days_count": len(girl_shifts),
        "favorite_time_slots": ["夜間"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
