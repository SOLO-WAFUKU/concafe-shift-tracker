# Vercel Setup Instructions

To deploy this project correctly on Vercel:

## Option 1: Set Root Directory in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings > General
3. Set **Root Directory** to: `frontend`
4. Click "Save"
5. Redeploy the project

## Option 2: Use Git Submodule (Alternative)

If the above doesn't work, you can create a separate repository for just the frontend:

```bash
# Create new repository for frontend only
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin <NEW_FRONTEND_REPO_URL>
git push -u origin main
```

Then deploy this new repository directly to Vercel.

## Current Issue

The build is failing because Vercel is looking for `frontend` directory from the root, but we need Vercel to treat the `frontend` directory as the root for the Next.js application.