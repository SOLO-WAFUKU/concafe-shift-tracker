"""
CRUD操作関数
データベースの作成・読み取り・更新・削除操作を提供する
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, distinct
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json

from . import models, schemas


class StoreRepository:
    """店舗情報のCRUD操作"""
    
    @staticmethod
    def get_all(db: Session) -> List[models.Store]:
        """全店舗を取得"""
        return db.query(models.Store).filter(models.Store.is_active == True).all()
    
    @staticmethod
    def get_by_id(db: Session, store_id: str) -> Optional[models.Store]:
        """店舗IDで取得"""
        return db.query(models.Store).filter(models.Store.id == store_id).first()
    
    @staticmethod
    def create_or_update(db: Session, store_data: Dict[str, Any]) -> models.Store:
        """店舗情報を作成または更新"""
        store = db.query(models.Store).filter(models.Store.id == store_data["id"]).first()
        
        if store:
            for key, value in store_data.items():
                if key in ["selectors", "scraping_config", "closed_days"] and isinstance(value, (dict, list)):
                    value = json.dumps(value, ensure_ascii=False)
                setattr(store, key, value)
        else:
            # JSON データの変換
            for key in ["selectors", "scraping_config", "closed_days"]:
                if key in store_data and isinstance(store_data[key], (dict, list)):
                    store_data[key] = json.dumps(store_data[key], ensure_ascii=False)
            
            store = models.Store(**store_data)
            db.add(store)
        
        db.commit()
        db.refresh(store)
        return store


class GirlRepository:
    """嬢情報のCRUD操作"""
    
    @staticmethod
    def get_by_store_and_name(db: Session, store_id: str, name: str) -> Optional[models.Girl]:
        """店舗IDと名前で嬢を検索"""
        return db.query(models.Girl).filter(
            and_(models.Girl.store_id == store_id, models.Girl.name == name)
        ).first()
    
    @staticmethod
    def get_by_id(db: Session, girl_id: int) -> Optional[models.Girl]:
        """嬢IDで取得"""
        return db.query(models.Girl).filter(models.Girl.id == girl_id).first()
    
    @staticmethod
    def create_or_update(db: Session, store_id: str, name: str, 
                        image_url: Optional[str] = None, 
                        status: str = "active") -> models.Girl:
        """嬢情報を作成または更新"""
        girl = GirlRepository.get_by_store_and_name(db, store_id, name)
        now = datetime.utcnow()
        
        if girl:
            girl.last_seen = now
            if image_url:
                girl.image_url = image_url
            if girl.status == "left" and status == "active":
                girl.status = "active"  # 復帰した場合
        else:
            girl = models.Girl(
                store_id=store_id,
                name=name,
                image_url=image_url,
                status="new",  # 新規発見時は常にNEW
                first_seen=now,
                last_seen=now
            )
            db.add(girl)
        
        db.commit()
        db.refresh(girl)
        return girl
    
    @staticmethod
    def mark_as_left(db: Session, girls_to_check: List[models.Girl], 
                     current_girls: List[str]) -> None:
        """前回いたが今回いない嬢を「LEFT」に設定"""
        for girl in girls_to_check:
            if girl.name not in current_girls and girl.status != "left":
                girl.status = "left"
        db.commit()
    
    @staticmethod
    def get_recent_shifts(db: Session, girl_id: int, limit: int = 30) -> List[models.Shift]:
        """嬢の直近シフト履歴を取得"""
        return db.query(models.Shift).filter(
            models.Shift.girl_id == girl_id
        ).order_by(desc(models.Shift.date)).limit(limit).all()


class ShiftRepository:
    """シフト情報のCRUD操作"""
    
    @staticmethod
    def create_or_update(db: Session, store_id: str, girl_id: int, 
                        date: str, start_time: str, end_time: str,
                        shift_type: str = "regular", notes: Optional[str] = None) -> models.Shift:
        """シフト情報を作成または更新"""
        shift = db.query(models.Shift).filter(
            and_(
                models.Shift.store_id == store_id,
                models.Shift.girl_id == girl_id,
                models.Shift.date == date,
                models.Shift.start_time == start_time
            )
        ).first()
        
        if shift:
            shift.end_time = end_time
            shift.shift_type = shift_type
            shift.notes = notes
        else:
            shift = models.Shift(
                store_id=store_id,
                girl_id=girl_id,
                date=date,
                start_time=start_time,
                end_time=end_time,
                shift_type=shift_type,
                notes=notes
            )
            db.add(shift)
        
        db.commit()
        db.refresh(shift)
        return shift
    
    @staticmethod
    def get_by_date(db: Session, date: str) -> List[models.Shift]:
        """指定日の全シフトを取得"""
        return db.query(models.Shift).join(models.Girl).filter(
            models.Shift.date == date
        ).all()
    
    @staticmethod
    def get_by_store_and_date_range(db: Session, store_id: str, 
                                   start_date: str, end_date: str) -> List[models.Shift]:
        """店舗と期間指定でシフトを取得"""
        return db.query(models.Shift).join(models.Girl).filter(
            and_(
                models.Shift.store_id == store_id,
                models.Shift.date >= start_date,
                models.Shift.date <= end_date
            )
        ).order_by(models.Shift.date, models.Shift.start_time).all()


class AdminRepository:
    """管理者向けCRUD操作"""
    
    @staticmethod
    def get_stats(db: Session) -> Dict[str, Any]:
        """統計情報を取得"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        total_stores = db.query(func.count(models.Store.id)).filter(
            models.Store.is_active == True
        ).scalar()
        
        total_girls = db.query(func.count(models.Girl.id)).scalar()
        active_girls = db.query(func.count(models.Girl.id)).filter(
            models.Girl.status == "active"
        ).scalar()
        
        new_girls_today = db.query(func.count(models.Girl.id)).filter(
            and_(
                models.Girl.status == "new",
                func.date(models.Girl.first_seen) == today
            )
        ).scalar()
        
        total_shifts = db.query(func.count(models.Shift.id)).scalar()
        
        return {
            "total_stores": total_stores,
            "total_girls": total_girls,
            "total_shifts": total_shifts,
            "active_girls": active_girls,
            "new_girls_today": new_girls_today
        }
    
    @staticmethod
    def get_scraping_logs(db: Session, limit: int = 10) -> List[models.ScrapingLog]:
        """最新のスクレイピングログを取得"""
        return db.query(models.ScrapingLog).order_by(
            desc(models.ScrapingLog.started_at)
        ).limit(limit).all()
    
    @staticmethod
    def create_scraping_log(db: Session, store_id: str, status: str,
                           girls_found: int = 0, shifts_found: int = 0,
                           error_message: Optional[str] = None,
                           execution_time: Optional[int] = None) -> models.ScrapingLog:
        """スクレイピングログを作成"""
        log = models.ScrapingLog(
            store_id=store_id,
            status=status,
            girls_found=girls_found,
            shifts_found=shifts_found,
            error_message=error_message,
            execution_time=execution_time,
            completed_at=datetime.utcnow() if status != "running" else None
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log