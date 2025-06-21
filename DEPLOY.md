# 🚀 ConCafe Shift Tracker - Vercel デプロイガイド

## 📋 概要

このガイドでは、ConCafe Shift Tracker を **Vercel (フロントエンド)** + **Railway (バックエンド)** でデプロイする方法を説明します。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │
│   (Frontend)    │────│   (Backend)     │ 
│   Next.js       │    │   FastAPI       │
│   React         │    │   Python        │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Railway       │
                       │   (Database)    │
                       │   PostgreSQL    │
                       └─────────────────┘
```

## 🔧 1. バックエンド (Railway) のデプロイ

### 1.1 Railway CLI のインストール
```bash
npm install -g @railway/cli
```

### 1.2 Railway にログイン
```bash
railway login
```

### 1.3 プロジェクト作成とデプロイ
```bash
# プロジェクト作成
railway new concafe-api

# バックエンドディレクトリに移動
cd backend

# デプロイ
railway up

# 環境変数設定
railway add postgresql
railway variables set PLAYWRIGHT_HEADLESS=true
railway variables set LOG_LEVEL=INFO
```

### 1.4 デプロイ後の確認
```bash
# URL取得
railway status

# ログ確認  
railway logs

# 例: https://concafe-api-production.up.railway.app
```

## 🎨 2. フロントエンド (Vercel) のデプロイ

### 2.1 GitHub リポジトリの作成

```bash
# ローカルでGitリポジトリ初期化
git init
git add .
git commit -m "Initial commit: ConCafe Shift Tracker"

# GitHubでリポジトリ作成後
git remote add origin https://github.com/YOUR_USERNAME/concafe-shift-tracker.git
git branch -M main  
git push -u origin main
```

### 2.2 Vercel でのデプロイ

1. https://vercel.com/dashboard にアクセス
2. **"New Project"** をクリック
3. **GitHub** から作成したリポジトリを選択
4. **Project Settings** で以下を設定:

```
Project Name: concafe-shift-tracker
Framework: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. **Environment Variables** を設定:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-railway-api-url.up.railway.app
```

6. **"Deploy"** をクリック

### 2.3 カスタムドメイン設定 (オプション)

1. Vercel Dashboard → Project → Settings → Domains
2. Add Domain → `your-domain.com`
3. DNS設定でCNAMEレコードを追加

## 🔄 3. API接続の設定

### 3.1 Railway API URLの確認
```bash
railway status
# 出力例: https://concafe-api-production.up.railway.app
```

### 3.2 Vercel の環境変数更新
```
NEXT_PUBLIC_API_URL=https://concafe-api-production.up.railway.app
```

### 3.3 next.config.js の確認
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: process.env.NODE_ENV === 'production' 
        ? 'https://concafe-api-production.up.railway.app/api/:path*'
        : 'http://localhost:8001/api/:path*'
    }
  ]
}
```

## 🎯 4. デプロイ後の確認

### 4.1 フロントエンド確認
```
✅ https://your-app.vercel.app
✅ レスポンシブデザイン表示
✅ 店舗フィルター動作
✅ 日付タブ動作
```

### 4.2 バックエンド確認
```
✅ https://your-api.railway.app/health
✅ https://your-api.railway.app/docs
✅ https://your-api.railway.app/api/v1/stores
```

### 4.3 API連携確認
```
✅ 店舗データ表示
✅ シフト情報表示  
✅ 嬢情報表示
✅ 管理者ページアクセス
```

## 📊 5. 監視とメンテナンス

### 5.1 ログ確認
```bash
# Railway (バックエンド)
railway logs --tail

# Vercel (フロントエンド)  
vercel logs https://your-app.vercel.app --tail
```

### 5.2 パフォーマンス監視
- Vercel Analytics 有効化
- Railway Metrics 確認
- API レスポンス時間監視

### 5.3 アップデート手順
```bash
# コード更新
git add .
git commit -m "Update: feature description"
git push origin main

# 自動デプロイ実行される
# Vercel: 自動デプロイ
# Railway: 自動デプロイ
```

## 🚨 6. トラブルシューティング

### 6.1 CORS エラー
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.vercel.app"],  # Vercel URLを追加
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.2 API接続エラー
```javascript
// 環境変数の確認
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)

// ネットワークタブでAPI呼び出し確認
```

### 6.3 ビルドエラー
```bash
# ローカルでビルドテスト
cd frontend
npm run build

# 依存関係の確認
npm audit fix
```

## 💰 7. 費用について

### Railway (バックエンド)
- 無料プラン: $0/month (500時間まで)
- Hobby: $5/month
- Pro: $20/month

### Vercel (フロントエンド) 
- 無料プラン: 十分な機能
- Pro: $20/month (チーム利用時)

## 🎉 8. デプロイ完了！

✅ **フロントエンド**: https://your-app.vercel.app  
✅ **バックエンド**: https://your-api.railway.app  
✅ **API ドキュメント**: https://your-api.railway.app/docs  
✅ **完全なコンカフェシフト管理アプリ完成！**

---

## 📞 サポート

- デプロイに関する質問: GitHub Issues
- 機能追加要望: GitHub Discussions
- 緊急の問題: メール連絡

**お疲れ様でした！ConCafe Shift Tracker が本番稼働中です！** 🚀✨