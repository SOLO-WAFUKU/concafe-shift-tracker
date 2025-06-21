#!/bin/bash
# GitHub セットアップスクリプト

echo "🐙 GitHub リポジトリセットアップ"
echo ""
echo "1. https://github.com でリポジトリを作成してください:"
echo "   - Repository name: concafe-shift-tracker"
echo "   - Description: 秋葉原コンカフェ出勤情報を自動集約するWebアプリ"
echo "   - Public/Private: お好みで選択"
echo "   - Initialize this repository: チェックしない"
echo ""
echo "2. 作成後、あなたのGitHubユーザー名を入力してください:"
read -p "GitHubユーザー名: " USERNAME

if [ -z "$USERNAME" ]; then
    echo "❌ ユーザー名が入力されていません"
    exit 1
fi

echo ""
echo "🔗 リモートリポジトリを設定しています..."

# リモートリポジトリを追加
git remote add origin https://github.com/$USERNAME/concafe-shift-tracker.git

echo "📤 GitHubにプッシュしています..."

# メインブランチにプッシュ
git branch -M main
git push -u origin main

echo ""
echo "✅ GitHubプッシュ完了！"
echo ""
echo "🔗 リポジトリURL: https://github.com/$USERNAME/concafe-shift-tracker"
echo ""
echo "🚀 次のステップ:"
echo "1. https://vercel.com/dashboard にアクセス"
echo "2. 'New Project' をクリック"
echo "3. 作成したGitHubリポジトリを選択"
echo "4. Root Directory: frontend"
echo "5. Framework: Next.js"
echo "6. Deploy をクリック"