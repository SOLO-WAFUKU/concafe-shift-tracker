# ConCafe Shift Tracker Makefile

.PHONY: help dev build clean test lint format install-deps down logs restart

# デフォルトターゲット
help:
	@echo "ConCafe Shift Tracker - 利用可能なコマンド:"
	@echo ""
	@echo "  make dev         - 開発環境を起動（ホットリロード付き）"
	@echo "  make build       - 全サービスをビルド"
	@echo "  make clean       - 全てのコンテナ・ボリューム・ネットワークを削除"
	@echo "  make test        - テストを実行"
	@echo "  make lint        - コード品質チェック"
	@echo "  make format      - コードフォーマット"
	@echo "  make install-deps - 依存関係をインストール"
	@echo "  make down        - 全サービスを停止"
	@echo "  make logs        - 全サービスのログを表示"
	@echo "  make restart     - 全サービスを再起動"
	@echo ""

# 開発環境起動
dev:
	@echo "🚀 開発環境を起動しています..."
	docker-compose up --build -d postgres redis
	@echo "⏳ データベースの準備を待っています..."
	sleep 10
	docker-compose up --build backend frontend
	@echo "✅ 開発環境が起動しました"
	@echo "🌐 フロントエンド: http://localhost:3000"
	@echo "🔧 API: http://localhost:8000"
	@echo "📚 API ドキュメント: http://localhost:8000/docs"

# 全サービスをビルド
build:
	@echo "🔨 全サービスをビルドしています..."
	docker-compose build --no-cache
	@echo "✅ ビルド完了"

# クリーンアップ
clean:
	@echo "🧹 全てのコンテナ、ボリューム、ネットワークを削除しています..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ クリーンアップ完了"

# テスト実行
test:
	@echo "🧪 テストを実行しています..."
	docker-compose exec backend python -m pytest app/tests/ -v
	@echo "✅ テスト完了"

# バックエンドのlint実行
lint:
	@echo "🔍 コード品質をチェックしています..."
	docker-compose exec backend black --check app/
	docker-compose exec backend ruff app/
	@echo "✅ コード品質チェック完了"

# バックエンドのフォーマット実行
format:
	@echo "🎨 コードをフォーマットしています..."
	docker-compose exec backend black app/
	docker-compose exec backend ruff --fix app/
	@echo "✅ コードフォーマット完了"

# 依存関係のインストール
install-deps:
	@echo "📦 依存関係をインストールしています..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✅ 依存関係のインストール完了"

# サービス停止
down:
	@echo "⏹️ 全サービスを停止しています..."
	docker-compose down
	@echo "✅ 全サービスが停止しました"

# ログ表示
logs:
	@echo "📋 全サービスのログを表示しています..."
	docker-compose logs -f

# サービス再起動
restart:
	@echo "🔄 全サービスを再起動しています..."
	docker-compose restart
	@echo "✅ 全サービスが再起動しました"

# データベースのマイグレーション実行
migrate:
	@echo "🗃️ データベースマイグレーションを実行しています..."
	docker-compose exec backend python -c "from app.database import init_db; init_db()"
	@echo "✅ マイグレーション完了"

# 手動スクレイピング実行
scrape:
	@echo "🕷️ 手動スクレイピングを実行しています..."
	docker-compose exec backend python -c "import asyncio; from app.scraper.base import ConCafeScraper; scraper = ConCafeScraper(); asyncio.run(scraper.scrape_all_stores())"
	@echo "✅ スクレイピング完了"

# プロダクション環境デプロイ準備
prod-prepare:
	@echo "🚀 プロダクション環境の準備をしています..."
	docker-compose --profile production build
	@echo "✅ プロダクション環境の準備完了"

# Fly.io デプロイ
deploy-fly:
	@echo "☁️ Fly.io にデプロイしています..."
	fly deploy --dockerfile Dockerfile.fly
	@echo "✅ Fly.io デプロイ完了"

# 開発環境の状態確認
status:
	@echo "📊 サービス状態を確認しています..."
	docker-compose ps
	@echo ""
	@echo "🔗 エンドポイント:"
	@echo "  フロントエンド: http://localhost:3000"
	@echo "  API: http://localhost:8000"
	@echo "  API ドキュメント: http://localhost:8000/docs"
	@echo "  管理者パネル: http://localhost:3000/admin"