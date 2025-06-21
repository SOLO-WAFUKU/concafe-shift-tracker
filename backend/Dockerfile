FROM python:3.12-slim

# システム依存パッケージのインストール
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Playwrightのブラウザ依存関係をインストール
RUN python -m pip install --upgrade pip
RUN pip install playwright==1.40.0
RUN playwright install chromium
RUN playwright install-deps chromium

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY app/ ./app/
COPY ../stores.yaml ./stores.yaml

# 非rootユーザーを作成
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# ポートを公開
EXPOSE 8000

# アプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]