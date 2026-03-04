# 全国共通分類体系 v1（issue_type）

この文書は、市民参加データを全国で共通利用するための
分類タグ（issue_type）標準仕様を定義します。

本仕様は、
- 市民の声を見える化する
- 自治体内部の管理とは分離する
- 全国どこでも同じ分類体系で扱える
- AI による自動分類が可能
- 子どもでも理解できる
  という目的で設計されています。

------------------------------------------------------------

## 1. 基本構造

分類体系は階層構造（field → medium）で構成されます。

field（大分類）
└── medium（中分類）

issue_type には medium の tag_id を格納します。
field は parent_id から辿ることで取得できます。

------------------------------------------------------------

## 2. 大分類（field）

tag_id                | name               | 説明
----------------------|--------------------|--------------------------
field_childcare       | 子育て             | 保育・子育て支援など
field_education       | 教育               | 学校・教育環境など
field_welfare         | 福祉               | 高齢者・障害・医療など
field_transport       | 交通               | 道路・バス・鉄道など
field_disaster        | 防災               | 防災・消防・防犯など
field_tax             | 税金               | 税制度・手続きなど
field_environment     | 環境               | ごみ・自然・気候など
field_community       | 地域・コミュニティ | 地域活動・施設など

------------------------------------------------------------

## 3. 中分類（medium）

### 子育て（field_childcare）

tag_id                     | name
---------------------------|----------------
childcare_nursery          | 保育園
childcare_kodomoen         | 認定こども園
childcare_after_school     | 学童
childcare_support          | 子育て支援

------------------------------------------------------------

### 教育（field_education）

tag_id                     | name
---------------------------|----------------
edu_school_lunch           | 学校給食
edu_special_support        | 特別支援教育
edu_ict                    | ICT教育
edu_facilities             | 学校施設整備

------------------------------------------------------------

### 福祉（field_welfare）

tag_id                     | name
---------------------------|----------------
welfare_elderly            | 高齢者福祉
welfare_disability         | 障害福祉
welfare_medical            | 医療体制
welfare_child              | 子ども家庭支援

------------------------------------------------------------

### 交通（field_transport）

tag_id                     | name
---------------------------|----------------
transport_bus              | 地域バス交通
transport_road             | 道路整備
transport_rail             | 鉄道・駅
transport_bicycle          | 自転車インフラ

------------------------------------------------------------

### 防災（field_disaster）

tag_id                     | name
---------------------------|----------------
disaster_flood             | 水害対策
disaster_earthquake        | 耐震化
disaster_fire              | 消防・救急
disaster_crime             | 防犯

------------------------------------------------------------

### 税金（field_tax）

tag_id                     | name
---------------------------|----------------
tax_resident               | 住民税
tax_property               | 固定資産税
tax_corporate              | 法人税（市税）

------------------------------------------------------------

### 環境（field_environment）

tag_id                     | name
---------------------------|----------------
env_recycle                | ごみ・リサイクル
env_climate                | 気候変動対策
env_nature                 | 自然保全

------------------------------------------------------------

### 地域・コミュニティ（field_community）

tag_id                     | name
---------------------------|----------------
community_activities       | 地域活動
community_facilities       | 地域施設

------------------------------------------------------------

## 4. issue_type の格納方法

GeoJSON の properties.issue_type には
medium の tag_id を格納します。

例：

"issue_type": "childcare_nursery"

UI や分析では parent_id を辿ることで
大分類（field）を取得できます。

------------------------------------------------------------

## 5. 拡張方針

- medium の追加は自由
- field の追加は慎重に（全国共通性のため）
- small（小分類）は v2 以降で検討可能
- 自治体独自タグは tags/custom/ に追加可能

------------------------------------------------------------

## 6. AI との連携

Workers AI による分類は次の二段階で行います。

1. field（大分類）を推定
2. その field に属する medium の中から最適なものを選択

これにより分類精度が向上し、
全国共通分類として安定します。

------------------------------------------------------------