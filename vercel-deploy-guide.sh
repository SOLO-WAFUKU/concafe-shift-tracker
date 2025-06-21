#!/bin/bash
# Vercel デプロイ用セットアップスクリプト

echo "🚀 ConCafe Shift Tracker - Vercel デプロイ準備"

cd "$(dirname "$0")"

# 1. GitHubリポジトリの初期化
echo "📁 Git リポジトリを初期化しています..."

git init
git add .
git commit -m "Initial commit: ConCafe Shift Tracker for Vercel"

echo "✅ Git リポジトリが初期化されました"
echo ""
echo "🔗 次のステップ:"
echo "1. GitHubで新しいリポジトリを作成"
echo "2. 以下のコマンドを実行:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/concafe-shift-tracker.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. https://vercel.com/dashboard にアクセス"
echo "4. 'New Project' → GitHubリポジトリを選択"
echo "5. 設定:"
echo "   - Root Directory: frontend"
echo "   - Framework: Next.js"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo ""
echo "6. Deploy をクリック"
echo ""
echo "🌐 デプロイ後のアクセス先:"
echo "   - フロントエンド: https://your-app.vercel.app"
echo "   - (バックエンドは別途Railwayなどでデプロイが必要)"