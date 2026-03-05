# frontend

`jp-assembly-citizen` のフロントエンドアプリケーションです。  
React + Vite + TypeScript で実装されており、地図上で地点を選択して市民の声を投稿・閲覧する PoC UI を提供します。

## 技術スタック

- React 19
- TypeScript
- Vite
- React Router
- Zustand（選択状態の保持）
- Leaflet / react-leaflet（地図表示）

## 主な機能

- 都道府県・市区町村を選択して地図画面へ遷移
- 地図上クリックで座標を選択し、意見投稿画面へ遷移
- `/voice/summary` へ投稿文を送信し、要約（課題・解決案）を取得
- 確認後に `/report` へ投稿内容を保存
- `/reports/nearby` で周辺投稿を取得してマーカー表示
- 選択した地域・座標は Zustand Persist（`localStorage`）で保持

## 画面とルート

- `/` または `/areaPage`: 都道府県選択
- `/municipalityPage`: 市区町村選択
- `/mapPage`: 地図表示、地点選択、周辺投稿の表示
- `/voicePage`: 投稿文入力、要約確認、投稿確定

## API 接続

- API ベース URL は `src/lib/api.ts` の `API_BASE` で定義
- 主要 API
  - `POST {API_BASE}/voice/summary`
  - `POST {API_BASE}/report`
  - `GET {API_BASE}/reports/nearby?lat=...&lng=...&radius=...&municipality_code=...`
- `vite.config.ts` では `/voice` と `/report` のローカルプロキシ設定があります（必要に応じて調整）

## セットアップ

`frontend` ディレクトリで実行してください。

```bash
# npm
npm install
npm run dev

# または pnpm
pnpm install
pnpm dev
```

## 利用可能なスクリプト

- `npm run dev`: 開発サーバー起動
- `npm run build`: TypeScript ビルド + 本番ビルド
- `npm run preview`: ビルド成果物のローカル確認
- `npm run lint`: ESLint 実行

## ディレクトリ構成（抜粋）

```text
frontend/
  public/
    marker/            # Leaflet 用マーカー画像
  src/
    components/        # 画面部品（VoiceSummary など）
    data/              # 地点マスタ（city-centers）
    lib/               # API 基底 URL、マーカー定義
    pages/             # 各ページ
    store/             # Zustand ストア
    App.tsx            # ルーティング定義
    main.tsx           # エントリーポイント
```

## 補足

- 現在は PoC 実装のため、対象地域データは `src/data/city-centers.ts` / 各ページ内定義に限定されています。
