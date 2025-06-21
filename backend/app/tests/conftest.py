"""
pytestの設定とフィクスチャ定義
テスト用の共通設定とモックデータを提供する
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import AsyncMock, Mock
import tempfile
import os

from ..main import app
from ..database import get_db, Base
from ..models import Store, Girl, Shift
from ..scraper.base import ConCafeScraper


# テスト用データベース設定
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def event_loop():
    """イベントループのフィクスチャ"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def db_session():
    """テスト用データベースセッション"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """FastAPIテストクライアント"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_store_data():
    """サンプル店舗データ"""
    return {
        "id": "test-store",
        "name": "テスト店舗",
        "url": "https://example.com/schedule/",
        "area": "秋葉原",
        "open_time": "11:00",
        "close_time": "22:00",
        "closed_days": "[]",
        "selectors": '{"schedule_container": ".schedule", "girl_name": ".girl", "girl_image": ".img"}',
        "scraping_config": '{"wait_time": 1000}',
        "is_active": True
    }


@pytest.fixture
def sample_girl_data():
    """サンプル嬢データ"""
    return {
        "name": "テスト嬢",
        "store_id": "test-store",
        "image_url": "https://example.com/image.jpg",
        "status": "active"
    }


@pytest.fixture
def sample_shift_data():
    """サンプルシフトデータ"""
    return {
        "date": "2024-01-15",
        "start_time": "18:00",
        "end_time": "22:00",
        "shift_type": "regular"
    }


@pytest.fixture
def mock_redis():
    """Redisモック"""
    mock = Mock()
    mock.get.return_value = None
    mock.setex.return_value = True
    mock.delete.return_value = 1
    mock.keys.return_value = []
    return mock


@pytest.fixture
def mock_playwright():
    """Playwrightモック"""
    mock_page = AsyncMock()
    mock_page.goto = AsyncMock()
    mock_page.content = AsyncMock(return_value="""
        <div class="schedule">
            <div class="girl">テスト嬢</div>
            <div class="time">18:00-22:00</div>
            <img class="img" src="https://example.com/image.jpg" />
        </div>
    """)
    mock_page.close = AsyncMock()
    
    mock_browser = AsyncMock()
    mock_browser.new_page = AsyncMock(return_value=mock_page)
    mock_browser.close = AsyncMock()
    
    return {
        "browser": mock_browser,
        "page": mock_page
    }


@pytest.fixture
def populated_db(db_session, sample_store_data, sample_girl_data, sample_shift_data):
    """データが投入されたテスト用データベース"""
    # 店舗データを作成
    store = Store(**sample_store_data)
    db_session.add(store)
    db_session.commit()
    
    # 嬢データを作成
    girl = Girl(**sample_girl_data)
    db_session.add(girl)
    db_session.commit()
    
    # シフトデータを作成
    shift = Shift(
        store_id=store.id,
        girl_id=girl.id,
        **sample_shift_data
    )
    db_session.add(shift)
    db_session.commit()
    
    return {
        "store": store,
        "girl": girl,
        "shift": shift
    }


@pytest.fixture
def mock_scraper():
    """スクレイパーモック"""
    scraper = Mock(spec=ConCafeScraper)
    scraper.scrape_all_stores = AsyncMock(return_value={
        "success": [
            {
                "store_id": "test-store",
                "store_name": "テスト店舗",
                "status": "success",
                "girls_found": 1,
                "shifts_found": 1
            }
        ],
        "failed": [],
        "total_girls": 1,
        "total_shifts": 1
    })
    return scraper


@pytest.fixture
def admin_credentials():
    """管理者認証情報"""
    return {
        "username": "admin",
        "password": "test-password"
    }


@pytest.fixture
def temp_image_file():
    """一時画像ファイル"""
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        # 1x1のJPEG画像データ（最小限）
        jpeg_data = bytes.fromhex('FFD8FFE000104A46494600010101006000600000FFDB004300080606070605080707070909080A0C140D0C0B0B0C1912130F141D1A1F1E1D1A1C1C20242E2720222C231C1C2837292C30313434341F27393D38323C2E333432FFDB0043010909090C0B0C180D0D1832211C213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232FFC00011080001000103012200021101031101FFC4001F0000010501010101010100000000000000000102030405060708090A0BFFC400B5100002010303020403050504040000017D01020300041105122131410613516107227114328191A1082342B1C11552D1F02433627282090A161718191A25262728292A3435363738393A434445464748494A535455565758595A636465666768696A737475767778797A838485868788898A92939495969798999AA2A3A4A5A6A7A8A9AAB2B3B4B5B6B7B8B9BAC2C3C4C5C6C7C8C9CAD2D3D4D5D6D7D8D9DAE1E2E3E4E5E6E7E8E9EAF1F2F3F4F5F6F7F8F9FAFFC4001F0100030101010101010101010000000000000102030405060708090A0BFFC400B51100020102040403040705040400010277000102031104052131061241510761711322328108144291A1B1C109233352F0156272D10A162434E125F11718191A262728292A35363738393A434445464748494A535455565758595A636465666768696A737475767778797A82838485868788898A92939495969798999AA2A3A4A5A6A7A8A9AAB2B3B4B5B6B7B8B9BAC2C3C4C5C6C7C8C9CAD2D3D4D5D6D7D8D9DAE2E3E4E5E6E7E8E9EAF2F3F4F5F6F7F8F9FAFFDA000C03010002110311003F00')
        f.write(jpeg_data)
        f.flush()
        
        yield f.name
        
    # クリーンアップ
    try:
        os.unlink(f.name)
    except FileNotFoundError:
        pass


class AsyncContextManager:
    """非同期コンテキストマネージャーのモック"""
    def __init__(self, return_value):
        self.return_value = return_value
        
    async def __aenter__(self):
        return self.return_value
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass