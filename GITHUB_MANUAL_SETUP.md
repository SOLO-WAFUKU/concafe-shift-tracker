# 📋 GitHub手動セットアップガイド

## 🌟 手順概要

GitHub CLIがない場合は、Web UIで簡単にリポジトリを作成できます。

## 📝 手順

### 1. GitHubでリポジトリ作成

1. **https://github.com** にアクセスしてログイン
2. 右上の **緑色の "New"** ボタンをクリック  
   または **"+"** → **"New repository"**
3. リポジトリ設定:
   ```
   Repository name: concafe-shift-tracker
   Description: 秋葉原コンカフェ出勤情報を自動集約するWebアプリ
   ✅ Public (または Private お好みで)
   ❌ Add a README file (チェックしない)
   ❌ Add .gitignore (チェックしない)  
   ❌ Choose a license (チェックしない)
   ```
4. **"Create repository"** をクリック

### 2. 作成後の画面で表示されるコマンドをコピー

GitHubが自動生成するコマンドが表示されます：

```bash
git remote add origin https://github.com/YOUR_USERNAME/concafe-shift-tracker.git
git branch -M main
git push -u origin main
```

### 3. ターミナルでコマンド実行

```bash
cd /Users/tamuratakeru/Desktop/claude-projects/vibe-coding-tool/concafe-shift-tracker

# GitHubで表示されたコマンドを実行
git remote add origin https://github.com/YOUR_USERNAME/concafe-shift-tracker.git
git branch -M main  
git push -u origin main
```

## 🚀 プッシュ完了後の次ステップ

### Vercel デプロイ

1. **https://vercel.com/dashboard** にアクセス
2. **"New Project"** をクリック
3. **"Import Git Repository"** で作成したリポジトリを選択
4. **Configure Project** で設定:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build  
   Output Directory: .next
   Install Command: npm install
   ```
5. **"Deploy"** をクリック

### Railway でバックエンドAPI デプロイ (オプション)

1. **https://railway.app** にアクセス
2. **"New Project"** → **"Deploy from GitHub repo"**
3. 作成したリポジトリを選択
4. **"Add variables"** で環境変数設定:
   ```
   PYTHONPATH=/app
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PLAYWRIGHT_HEADLESS=true
   ```

## 📱 完成確認

✅ **GitHub**: `https://github.com/YOUR_USERNAME/concafe-shift-tracker`  
✅ **Vercel**: `https://your-app.vercel.app`  
✅ **デモページ**: `https://your-app.vercel.app/demo`  

## 💡 ヒント

- リポジトリ名は後から変更可能
- Private リポジトリでもVercelデプロイ可能
- 初回プッシュ時にGitHub認証が求められる場合があります

---

**🎉 手動でも簡単に2-3分でデプロイ完了します！**