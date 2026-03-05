# spec

このディレクトリは、`report` データの JSON 仕様を管理します。  
基準スキーマは `spec/report/schema/report.schema.json` です。

## 対象スキーマ

- ファイル: `spec/report/schema/report.schema.json`
- JSON Schema バージョン: `draft/2020-12`
- タイトル: `Citizen Report Schema (PoC)`
- ルート型: `object`

## ルート構造

必須キー:

- `type`
- `geometry`
- `properties`

### 1. `type`

- 固定値: `"Feature"`

### 2. `geometry`

- 型: `object`
- 必須キー: `type`, `coordinates`

`geometry.type`:

- 固定値: `"Point"`

`geometry.coordinates`:

- 型: `number` の配列
- 要素数: ちょうど 2（`minItems: 2`, `maxItems: 2`）
- 意味: `[longitude, latitude]`（経度, 緯度）

### 3. `properties`

- 型: `object`
- 必須キー:
  - `report_id`
  - `municipality_code`
  - `tags`
  - `description`
  - `source`
  - `created_at`

`properties.report_id`:

- 型: `string`
- 説明: レポート一意 ID（UUID または `r-xxxx` 形式を想定）

`properties.municipality_code`:

- 型: `string`
- 説明: 自治体コード

`properties.tags`:

- 型: `string` 配列
- 説明: タグベースの分類情報

`properties.description`:

- 型: `object`
- 必須キー: `problems`, `solutions`

`properties.description.problems`:

- 型: `string` 配列
- 説明: 市民が報告した課題の一覧

`properties.description.solutions`:

- 型: `string` 配列
- 説明: 課題に対する解決案の一覧

`properties.source`:

- 型: `string`
- 許可値: `"citizen"` のみ（`enum`）

`properties.created_at`:

- 型: `string`
- フォーマット: `date-time`（ISO8601）

## サンプルとの対応

サンプルファイル: `spec/report/examples/report.sample.json`

- `type = "Feature"` でスキーマ一致
- `geometry.type = "Point"` でスキーマ一致
- `coordinates = [139.123, 35.678]` は 2 要素の数値配列で一致
- `source = "citizen"` は enum 制約に一致
- `created_at = "2026-02-03T06:20:00Z"` は `date-time` 形式に一致

## 注意点

- `coordinates` の順序は `[緯度, 経度]` ではなく `[経度, 緯度]`
- `source` は現時点 PoC で `"citizen"` 固定
- `tags` / `problems` / `solutions` の語彙はスキーマ上は自由文字列
