# ConCafe Shift Tracker

秋葉原エリアのコンカフェ嬢出勤情報を自動集約し、ホットペッパービューティー風UIで表示するフルスタックWebアプリケーションです。

## 🌟 主な機能

- **自動スクレイピング**: 5分間隔で店舗サイトから出勤情報を自動取得
- **リアルタイム表示**: 今日〜7日後までのシフト情報をリアルタイムで表示
- **NEW/LEFT判定**: 新人・退店嬢を自動検出してバッジ表示
- **画像管理**: Cloudflare Images対応の自動画像アップロード
- **管理者ダッシュボード**: Basic認証で保護された管理機能
- **レスポンシブUI**: スマホ・PC対応のモダンなUI

## 🛠 技術スタック

### バックエンド
- **Python 3.12** + **FastAPI**
- **Playwright** (ヘッドレスChromium) + **BeautifulSoup4**
- **SQLite** (開発) / **PostgreSQL** (本番)
- **Redis** (15分TTLキャッシュ)
- **APScheduler** (5分間隔スケジューリング)

### フロントエンド
- **Next.js 14** + **TypeScript**
- **React Query** (データフェッチング)
- **Chakra UI** (UIコンポーネント)

### インフラ
- **Docker Compose** (開発環境)
- **Fly.io** (本番デプロイ)
- **Cloudflare Images** (画像ストレージ)

## 🚀 クイックスタート

### 1. 環境構築

```bash
# リポジトリをクローン
git clone <repository-url>
cd concafe-shift-tracker

# 開発環境を起動
make dev
```

### 2. アクセス

- **フロントエンド**: http://localhost:3000
- **API**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs
- **管理者パネル**: http://localhost:3000/admin

### 3. 管理者ログイン

デフォルト認証情報:
- **ユーザー名**: `admin`
- **パスワード**: `concafe-admin-2024`

## 📁 プロジェクト構成

```
concafe-shift-tracker/
├── backend/                 # FastAPI バックエンド
│   ├── app/
│   │   ├── api/            # API エンドポイント
│   │   ├── scraper/        # スクレイピング機能
│   │   ├── models.py       # データベースモデル
│   │   ├── schemas.py      # Pydantic スキーマ
│   │   └── main.py         # FastAPI アプリ
│   └── tests/              # テストコード
├── frontend/               # Next.js フロントエンド
│   ├── src/
│   │   ├── app/           # App Router
│   │   ├── components/    # React コンポーネント
│   │   ├── hooks/         # カスタムフック
│   │   └── lib/           # ユーティリティ
├── stores.yaml            # 店舗設定ファイル
├── docker-compose.yml     # 開発環境設定
├── Makefile              # 便利コマンド
└── README.md
```

## 🏪 店舗追加方法

### 1. stores.yaml の編集

```yaml
stores:
  - id: "new-store-id"
    name: "新しい店舗名"
    url: "https://example.com/schedule/"
    area: "秋葉原"
    open_time: "11:00"
    close_time: "22:00"
    closed_days: ["monday"]  # 定休日
    selectors:
      schedule_container: ".schedule-wrapper"
      girl_name: ".cast-name"
      girl_image: ".cast-image img"
      shift_time: ".work-time"
      date_section: ".date-header"
    scraping_config:
      wait_time: 2000
      scroll_to_bottom: true
```

### 2. セレクタの設定方法

各店舗サイトのHTML構造に合わせてCSSセレクタを設定：

- `schedule_container`: スケジュール全体のコンテナ
- `girl_name`: 嬢の名前要素
- `girl_image`: 嬢の画像要素
- `shift_time`: シフト時間要素
- `date_section`: 日付セクション要素

### 3. 設定の反映

```bash
# 設定を反映して再起動
make restart

# 手動スクレイピングで動作確認
make scrape
```

## 🔧 開発コマンド

```bash
# 開発環境起動
make dev

# サービス状態確認  
make status

# ログ表示
make logs

# テスト実行
make test

# コード品質チェック
make lint

# コードフォーマット
make format

# 手動スクレイピング実行
make scrape

# 全サービス停止
make down

# クリーンアップ（全削除）
make clean
```

## 🌐 本番デプロイ

### Fly.io へのデプロイ

```bash
# Fly.io CLI インストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# アプリ作成
fly apps create concafe-shift-tracker

# デプロイ
make deploy-fly
```

### 環境変数設定

```bash
# 本番用環境変数を設定
fly secrets set DATABASE_URL="postgresql://user:pass@host:5432/db"
fly secrets set REDIS_URL="redis://host:6379"
fly secrets set CLOUDFLARE_ACCOUNT_ID="your-account-id"
fly secrets set CLOUDFLARE_API_TOKEN="your-api-token"
fly secrets set ADMIN_PASSWORD="secure-password"
```

## 🧪 テスト

### テスト実行

```bash
# 全テスト実行
make test

# 特定のテストファイル実行
docker-compose exec backend python -m pytest app/tests/test_scraper.py -v

# カバレッジ付きテスト
docker-compose exec backend python -m pytest --cov=app app/tests/
```

### テストの種類

- **スクレイピング機能テスト**: `test_scraper.py`
- **API エンドポイントテスト**: `test_api.py`
- **データベースCRUDテスト**: `test_crud.py`
- **画像アップロードテスト**: 画像処理機能
- **認証テスト**: Basic認証機能

## 📊 アーキテクチャ

```mermaid
graph TB
    A[Next.js Frontend] --> B[FastAPI Backend]
    B --> C[PostgreSQL/SQLite]
    B --> D[Redis Cache]
    B --> E[Playwright Scraper]
    E --> F[店舗サイト]
    B --> G[Cloudflare Images]
    H[APScheduler] --> E
    I[管理者] --> J[Admin Dashboard]
    J --> B
```

### データフロー

1. **スケジューラー** が5分間隔でスクレイピングを実行
2. **Playwright** で店舗サイトにアクセス
3. **BeautifulSoup** でHTML解析
4. 嬢の画像を **Cloudflare Images** にアップロード
5. データを **PostgreSQL** に保存
6. **Redis** でAPIレスポンスをキャッシュ
7. **Next.js** でユーザーに表示

## ⚙️ 設定オプション

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `DATABASE_URL` | データベース接続URL | `sqlite:///./concafe.db` |
| `REDIS_URL` | Redis接続URL | `redis://localhost:6379` |
| `PLAYWRIGHT_HEADLESS` | ヘッドレスモード | `true` |
| `SCRAPING_INTERVAL` | スクレイピング間隔(秒) | `300` |
| `CACHE_TTL` | キャッシュ保持時間(秒) | `900` |
| `ADMIN_USERNAME` | 管理者ユーザー名 | `admin` |
| `ADMIN_PASSWORD` | 管理者パスワード | `concafe-admin-2024` |

### Cloudflare Images設定

```bash
# Cloudflare Images を有効化
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"  
export CLOUDFLARE_IMAGES_URL="https://imagedelivery.net/your-hash"
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. スクレイピングが失敗する

```bash
# ログを確認
make logs

# 手動スクレイピングでテスト
make scrape

# 店舗サイトのHTML構造変更を確認
# stores.yaml のセレクタを更新
```

#### 2. 画像が表示されない

```bash
# Cloudflare設定を確認
docker-compose exec backend python -c "from app.config import settings; print(settings.cloudflare_account_id)"

# ローカル画像パスを確認
ls -la frontend/public/images/
```

#### 3. データベース接続エラー

```bash
# PostgreSQL の状態確認
docker-compose ps postgres

# 接続テスト
docker-compose exec postgres psql -U concafe_user -d concafe_tracker -c "SELECT 1;"
```

#### 4. メモリ不足

```bash
# メモリ使用量確認
docker stats

# 不要なコンテナ削除
make clean
```

### ログの確認

```bash
# 全サービスのログ
make logs

# 特定サービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Forkしてください
2. フィーチャーブランチを作成してください (`git checkout -b feature/amazing-feature`)
3. 変更をコミットしてください (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュしてください (`git push origin feature/amazing-feature`)
5. Pull Requestを作成してください

## 📞 サポート

- **Issue報告**: [GitHub Issues](https://github.com/your-repo/issues)
- **機能要望**: [GitHub Discussions](https://github.com/your-repo/discussions)

## ⚠️ 注意事項

- このツールは教育・学習目的で開発されています
- 店舗サイトのスクレイピングは利用規約を確認の上、適切に実施してください
- 個人情報の取り扱いには十分注意してください
- 商用利用前にライセンスをご確認ください

---

**Built with ❤️ for the ConCafe community**