#!/bin/bash
# ローカル開発環境起動スクリプト

set -e

echo "🚀 ConCafe Shift Tracker - ローカル開発環境を起動しています..."

# プロジェクトルートに移動
cd "$(dirname "$0")"

# バックエンドの準備
echo "📦 バックエンド環境をセットアップしています..."
cd backend

# 仮想環境の作成
if [ ! -d "venv" ]; then
    echo "🐍 Python仮想環境を作成しています..."
    python3 -m venv venv
fi

# 仮想環境の有効化
source venv/bin/activate

# 依存関係のインストール
echo "📚 Python依存関係をインストールしています..."
pip install --upgrade pip
pip install -r requirements.txt

# Playwrightブラウザのインストール
echo "🌐 Playwrightブラウザをインストールしています..."
playwright install chromium || echo "⚠️ Playwright installation failed, continuing..."

# データベースの初期化
echo "🗄️ データベースを初期化しています..."
python -c "
import sys
sys.path.append('.')
from app.database import init_db
init_db()
print('✅ Database initialized')
"

cd ..

# フロントエンドの準備
echo "🎨 フロントエンド環境をセットアップしています..."
cd frontend

# 依存関係のインストール
echo "📦 Node.js依存関係をインストールしています..."
npm install

cd ..

echo "✅ 環境セットアップ完了！"
echo ""
echo "🌐 アプリケーションを起動するには:"
echo "  ターミナル1: cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  ターミナル2: cd frontend && npm run dev"
echo ""
echo "📱 アクセス先:"
echo "  フロントエンド: http://localhost:3000"
echo "  API: http://localhost:8000"
echo "  API ドキュメント: http://localhost:8000/docs"
echo ""