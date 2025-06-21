"""
画像アップロード処理
Cloudflare ImagesまたはローカルStorageへの画像保存を管理する
"""

import aiohttp
import hashlib
import logging
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse
import os

from ..config import settings

logger = logging.getLogger(__name__)


class ImageUploader:
    """画像アップロード管理クラス"""
    
    def __init__(self):
        self.local_storage_path = Path(__file__).parent.parent.parent.parent / "frontend" / "public" / "images"
        self.local_storage_path.mkdir(parents=True, exist_ok=True)
    
    async def upload_image(self, image_url: str, identifier: str) -> Optional[str]:
        """
        画像をアップロードして保存先URLを返す
        
        Args:
            image_url: 元画像のURL
            identifier: 画像識別子（店舗ID_嬢名など）
            
        Returns:
            str: 保存先URL（Cloudflare ImagesまたはローカルURL）
        """
        if not image_url:
            return None
        
        try:
            # 画像をダウンロード
            image_data = await self._download_image(image_url)
            if not image_data:
                return None
            
            # Cloudflare Imagesが設定されている場合
            if self._is_cloudflare_configured():
                return await self._upload_to_cloudflare(image_data, identifier)
            else:
                # ローカル保存
                return await self._save_locally(image_data, image_url, identifier)
                
        except Exception as e:
            logger.error(f"Failed to upload image {image_url}: {e}")
            return None
    
    async def _download_image(self, image_url: str) -> Optional[bytes]:
        """画像URLから画像データをダウンロード"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        logger.warning(f"Failed to download image: HTTP {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error downloading image {image_url}: {e}")
            return None
    
    def _is_cloudflare_configured(self) -> bool:
        """Cloudflare Imagesの設定が有効かチェック"""
        return bool(
            settings.cloudflare_account_id and 
            settings.cloudflare_api_token and 
            settings.cloudflare_images_url
        )
    
    async def _upload_to_cloudflare(self, image_data: bytes, identifier: str) -> Optional[str]:
        """Cloudflare Imagesにアップロード"""
        try:
            # ファイル名を生成（ハッシュベース）
            image_hash = hashlib.md5(image_data).hexdigest()
            filename = f"{identifier}_{image_hash[:8]}"
            
            # Cloudflare Images API endpoint
            url = f"https://api.cloudflare.com/client/v4/accounts/{settings.cloudflare_account_id}/images/v1"
            
            headers = {
                "Authorization": f"Bearer {settings.cloudflare_api_token}"
            }
            
            # マルチパートフォームデータを作成
            data = aiohttp.FormData()
            data.add_field('file', image_data, filename=f"{filename}.jpg", content_type='image/jpeg')
            data.add_field('id', filename)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, data=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("success"):
                            # Cloudflare Images URLを返す
                            image_id = result["result"]["id"]
                            return f"{settings.cloudflare_images_url}/{image_id}/public"
                        else:
                            logger.error(f"Cloudflare upload failed: {result}")
                            return None
                    else:
                        logger.error(f"Cloudflare upload HTTP error: {response.status}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error uploading to Cloudflare: {e}")
            return None
    
    async def _save_locally(self, image_data: bytes, original_url: str, identifier: str) -> Optional[str]:
        """画像をローカルに保存"""
        try:
            # ファイル拡張子を取得
            parsed_url = urlparse(original_url)
            path = parsed_url.path
            ext = Path(path).suffix.lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                ext = '.jpg'  # デフォルト
            
            # ファイル名を生成
            image_hash = hashlib.md5(image_data).hexdigest()
            filename = f"{identifier}_{image_hash[:8]}{ext}"
            
            # ファイルパスを作成
            file_path = self.local_storage_path / filename
            
            # ファイルが既に存在する場合はスキップ
            if file_path.exists():
                return f"/images/{filename}"
            
            # ファイルを保存
            with open(file_path, 'wb') as f:
                f.write(image_data)
            
            logger.info(f"Image saved locally: {filename}")
            return f"/images/{filename}"
            
        except Exception as e:
            logger.error(f"Error saving image locally: {e}")
            return None
    
    def get_cloudflare_usage(self) -> Optional[dict]:
        """
        Cloudflare Images使用量を取得
        
        Returns:
            dict: 使用量情報（実装は簡易版）
        """
        if not self._is_cloudflare_configured():
            return None
        
        # 実際の実装では Cloudflare API を呼び出して使用量を取得
        # ここでは仮の値を返す
        return {
            "total_images": 0,
            "storage_used": "0 MB",
            "bandwidth_used": "0 MB",
            "free_tier_limit": "100,000 images/month"
        }