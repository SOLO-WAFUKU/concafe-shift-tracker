# ConCafe Shift Tracker - Vercel デプロイガイド

## 🚀 Vercel への簡単デプロイ

### 1. リポジトリの準備

```bash
# GitHubリポジトリを作成してプッシュ
git init
git add .
git commit -m "Initial commit: ConCafe Shift Tracker"
git branch -M main
git remote add origin https://github.com/your-username/concafe-shift-tracker.git
git push -u origin main
```

### 2. Vercel でのデプロイ

#### オプション A: Vercel CLI
```bash
# Vercel CLI をインストール
npm i -g vercel

# ログイン
vercel login

# デプロイ
vercel --cwd frontend

# 設定時の回答例:
# ? Set up and deploy "./frontend"? [Y/n] Y
# ? Which scope? your-team
# ? What's your project's name? concafe-shift-tracker
# ? In which directory is your code located? ./
```

#### オプション B: Vercel Dashboard
1. https://vercel.com/dashboard にアクセス
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. **Root Directory** を `frontend` に設定
5. **Framework Preset** を `Next.js` に設定
6. Deploy をクリック

### 3. 環境変数の設定

Vercel Dashboard で以下の環境変数を設定:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### 4. バックエンド API の準備

#### オプション A: Railway でバックエンドをデプロイ

```bash
# Railway CLI をインストール
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト作成
railway new concafe-api

# バックエンドディレクトリに移動
cd backend

# デプロイ
railway up
```

#### オプション B: Render でバックエンドをデプロイ

1. https://render.com にアクセス
2. "New Web Service" を選択
3. GitHub リポジトリを連携
4. 設定:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### オプション C: Fly.io でバックエンドをデプロイ

```bash
# Fly.io CLI をインストール
curl -L https://fly.io/install.sh | sh

# ログイン
fly auth login

# バックエンドディレクトリでアプリ作成
cd backend
fly apps create concafe-api

# デプロイ
fly deploy --dockerfile ../Dockerfile.fly

# データベース用ボリューム作成
fly volumes create concafe_data --size 1
```

### 5. API URL の更新

バックエンドがデプロイされたら、フロントエンドの設定を更新:

```javascript
// frontend/src/lib/api.ts
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api/v1'  // vercel.json のrewriteで処理
    : 'http://localhost:8001/api/v1',
  // ...
})
```

```json
// vercel.json - API URLを更新
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-backend-url.com/api/$1"
    }
  ]
}
```

### 6. 完全なローカル テスト

```bash
# バックエンド起動
cd backend
source venv/bin/activate
python app/main_demo.py &

# フロントエンド起動
cd ../frontend
npm run dev

# アクセス確認
open http://localhost:3000
```

### 7. Vercel 用の最適化

#### package.json の確認
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### next.config.js の最適化
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    appDir: true,
  },
  images: {
    unoptimized: true, // Vercel 用
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/:path*'
      }
    ]
  }
}
```

### 8. ドメインの設定

Vercel Dashboard で:
1. Project Settings → Domains
2. カスタムドメインを追加
3. DNS設定でCNAMEレコードを設定

### 9. 監視とログ

```bash
# Vercel でのログ確認
vercel logs https://your-app.vercel.app

# リアルタイムログ
vercel logs --follow
```

### 10. 環境別設定

#### development (ローカル)
- API: http://localhost:8001
- Frontend: http://localhost:3000

#### preview (Vercel Preview)
- API: staging バックエンド URL
- Frontend: auto-generated preview URL

#### production (Vercel)
- API: 本番バックエンド URL  
- Frontend: your-domain.com

## 🔧 トラブルシューティング

### Build エラー
```bash
# 依存関係の確認
npm ls

# キャッシュクリア
npm run build && rm -rf .next
```

### API 接続エラー
```bash
# CORS設定確認
# バックエンドの CORS origins に Vercel ドメインを追加
```

### 画像が表示されない
```javascript
// next.config.js
images: {
  domains: ['your-backend-domain.com'],
  unoptimized: true
}
```

## 📱 デプロイ完了後の確認

✅ フロントエンド: https://your-app.vercel.app  
✅ API ドキュメント: https://your-backend.com/docs  
✅ ヘルスチェック: https://your-backend.com/health  
✅ 店舗一覧: https://your-app.vercel.app (データ表示確認)  

## 🎯 推奨デプロイ構成

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │
│   (Frontend)    │────│   (Backend)     │
│   Next.js       │    │   FastAPI       │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │   Neon/Railway  │
         └──────────────│   (Database)    │
                        │   PostgreSQL    │
                        └─────────────────┘
```

これで **ConCafe Shift Tracker** が Vercel + Railway で本格運用可能です！🚀