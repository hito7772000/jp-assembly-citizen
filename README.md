# report.schema.json — Citizen Report Schema (PoC)

このファイルは jp-assembly-civic プロジェクトの PoC における  
市民投稿データ（Report）を定義する JSON Schema です。

市民が投稿する「問題」と「改善策」を  
地図上の1点（GeoJSON Feature）として扱うための最小構成を定義しています。

---

## 設計方針

- GeoJSON Feature に準拠
- Point（座標）＋ properties の最小構成
- 固定分類ではなく tag 方式を採用
- 個人情報は保持しない
- 全国展開を見据えて municipality_code を必須化
- 問題（problems）と改善策（solutions）を中心に構造化
- PoC のため画像 evidence や行政・議会レイヤーは含めない

---

## データ構造（概要）

report.schema.json では以下の構造を定義しています。

### Top-level
- type: Feature
- geometry: Point（経度・緯度）
- properties: 投稿のメタ情報

### properties 内の必須項目
- report_id
- municipality_code
- tags（柔軟な分類）
- description.problems
- description.solutions
- source（PoC では citizen 固定）
- created_at（ISO8601）

---

## JSON Schema 本体

JSON Schema の全文は以下に格納されています。

- /schema/report.schema.json

---

## サンプルデータ

サンプルデータは以下に格納されています。

- /schema/examples/report.sample.json

---

## 今後の拡張（PoC 範囲外）

- 画像 evidence（R2）
  - 画像チェック、ぼかし、透かしなどの対応検討
- AI メタ情報（normalized text, nsfw_score, face_detected）
- 行政レイヤー（issue_type × 月 × status）
- 議会レイヤー（議事録とのマッチング）
  - フェーズ2 以降の想定

---

## ライセンス

Apache License 2.0

---

## コントリビューション

- PR / Issue は歓迎
- schema の変更は /schema ディレクトリで管理
- PoC の目的に沿った最小構成を維持することを推奨

---

## 利用している OSS / データソース

本プロジェクト（PoC）は以下の OSS およびデータソースを利用しています。

### Leaflet Color Markers
- Copyright (c) 2011-2017, Dominik Moritz
- License: BSD-2-Clause
- Repository: https://github.com/pointhi/leaflet-color-markers

### OpenStreetMap
- © OpenStreetMap contributors
- License: ODbL 1.0
- https://www.openstreetmap.org/copyright

地図タイルおよび地理データは OpenStreetMap コミュニティによって提供されています。

