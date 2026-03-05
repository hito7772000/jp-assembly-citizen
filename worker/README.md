# jp-assembly-citizen — Worker Backend

市民投稿の要約（AI）と保存（D1）、周辺投稿の取得を提供する Cloudflare Workers バックエンドです。

- Cloudflare Workers (TypeScript)
- Cloudflare D1
- Cloudflare AI (`@cf/meta/llama-3.1-8b-instruct`)
- Wrangler
- Vitest（Cloudflare test pool）

## API

### GET /voice/summary
- クエリ: `text`（string）
- 内部で `POST /voice/summary` と同等処理を実行

### POST /voice/summary
- 入力: `{ text: string }`
- `src/prompt.ts` の `SYSTEM_PROMPT` とユーザー入力を Cloudflare AI に渡す
- AI 応答から JSON 部分を抽出して返却
- 正常時: AI 生成 JSON をそのまま返却
- 異常時: `500 AI inference failed`

### POST /report
- 入力:
	- `municipality_code: string`
	- `geometry: { lat: number, lng: number }`
	- `problems: any[]`
	- `solutions: any[]`
	- `tags: any[]`
- バリデーション後、D1 `reports` テーブルへ INSERT
- `report_id` は `municipality_code-yyyymmdd-<10桁ランダム>` 形式
- `source` は `"citizen"` 固定
- 返却: `{ status: "ok", id: lastInsertRowId }`

### GET /reports/nearby
- クエリ:
	- `lat`, `lng`, `municipality_code`
	- `radius`（50〜2000m、既定 500）
	- `limit`（1〜100、既定 20）
- D1 上で距離計算（球面余弦）して半径内を抽出
- 対象は `created_at >= datetime('now', '-14 days')`
- `created_at DESC` で返却
- JSON カラム（`geometry`, `problems`, `solutions`, `tags`）は復元して返却

## データベース（D1）

マイグレーション:
- `migrations/0001_init.sql`
- `migrations/0002_add_report_id.sql`

カラム:

| カラム名 | 型 | 説明 |
| --- | --- | --- |
| id | INTEGER (PK) | レポートの内部 ID |
| municipality_code | TEXT | 自治体コード（市区町村コード） |
| geometry | TEXT (JSON) | 位置情報（GeoJSON 形式の Point） |
| problems | TEXT (JSON) | 市民が投稿した問題点のリスト |
| solutions | TEXT (JSON) | 市民が投稿した改善案のリスト |
| tags | TEXT (JSON) | タグベースの分類情報 |
| source | TEXT | 投稿者区分（citizen / admin / system） |
| image_public_url | TEXT | 公開可能な画像 URL |
| image_private_key | TEXT | マスク処理などが必要な画像の非公開キー |
| created_at | TEXT | 作成日時（ISO8601） |
| report_id | TEXT | 外部公開用のレポート ID（UUID 推奨） |


## ローカル開発環境の前提条件（重要）

この Worker は Cloudflare の以下のサービスを利用しているため、
**ローカルで動作させるには Cloudflare アカウントが必須です。**

- Workers
- D1
- Cloudflare AI
- Wrangler CLI

### 必要な準備

1. Cloudflare アカウント作成
2. Wrangler ログイン
```bash
npx wrangler login
```
3. D1 データベース作成（Dashboard または CLI）
4. `wrangler.toml` のバインディング設定
- `DB`（D1）
- `AI`（Cloudflare AI）
5. マイグレーション適用
```bash
npx wrangler d1 migrations apply civic-db
```
Cloudflare AI は無料枠がありますが、推論量が多いと課金が発生する可能性があります。

## 公開環境について（アクセス制御のため非公開）

現時点では、**誰でもアクセスできる公開 API は提供していません。**

理由:
- AI 推論コストの増加
- D1 データの汚染
- Worker 実行回数の増加による課金リスク
- 開発中 API の安定性確保

将来的には、読み取り専用の公開 API や
AI Gateway 経由のレート制御を導入し、安全に公開できる形を検討しています。

## Cloudflare AI Gateway（導入予定）

AI 推論の安定性・可観測性・コスト最適化のため、
`/voice/summary` の AI 呼び出しを **Cloudflare AI Gateway 経由に切り替える予定**です。

導入後に期待できる改善:
- レート制御（大量アクセスでも安定）
- タイムアウト・リトライによる安定性向上
- モデル別の使用量可視化
- ログ・可観測性の向上
- 公開 API の安全性向上

`wrangler.toml` に Gateway のエンドポイントを追加し、AI 呼び出し部分を Gateway URL に変更する予定です。

## 開発手順
```bash
npm install npm run dev
```
主なスクリプト:
- `npm run dev` / `npm run start`: `wrangler dev`
- `npm run deploy`: `wrangler deploy`
- `npm run test`: `vitest`
- `npm run cf-typegen`: `wrangler types`

## 補足

- `test/index.spec.ts` は Wrangler 初期テンプレートのままで、現行 API とは一致していません。
- `src/prompt.ts` および一部文字列は文字化けしているため、運用前に UTF-8 で整備が必要です。
- Cloudflare AI Gateway の導入を前提に、AI 推論部分の構造を今後整理予定です。
