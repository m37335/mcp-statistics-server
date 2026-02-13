# 統計量計算機能ガイド

基本的な統計量を計算する機能です。高度な分析は専門ツールに任せ、MCPサーバーでは基本的な記述統計を提供します。

## 概要

`calculate_statistics`ツールを使用すると、統計データから以下の統計量を計算できます：

- **平均値** (mean)
- **中央値** (median)
- **最頻値** (mode)
- **標準偏差** (std)
- **分散** (variance)
- **最小値** (min)
- **最大値** (max)
- **範囲** (range)
- **第1四分位数** (q1)
- **第3四分位数** (q3)
- **四分位範囲** (iqr)

## 基本的な使い方

### 全体の統計量を計算

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2000,
    "endYear": 2023
  },
  "statistics": ["mean", "median", "std", "min", "max"]
}
```

**出力例:**
```json
{
  "statistics": {
    "mean": 18500000000000,
    "median": 18000000000000,
    "std": 3500000000000,
    "min": 10289000000000,
    "max": 27280000000000,
    "count": 24,
    "sum": 444000000000000
  },
  "grouped": false,
  "dataPoints": 24
}
```

### グループ別の統計量を計算

国別や年別など、グループごとに統計量を計算できます。

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;CHN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2020,
    "endYear": 2023
  },
  "statistics": ["mean", "std", "min", "max"],
  "groupBy": "country_code"
}
```

**出力例:**
```json
{
  "statistics": [
    {
      "country_code": "USA",
      "mean": 24371375000000,
      "std": 2500000000000,
      "min": 21427700000000,
      "max": 27280000000000,
      "count": 4,
      "sum": 97485500000000
    },
    {
      "country_code": "JPN",
      "mean": 4567480000000,
      "std": 350000000000,
      "min": 4210300000000,
      "max": 4937420000000,
      "count": 4,
      "sum": 18269920000000
    },
    {
      "country_code": "CHN",
      "mean": 17063575000000,
      "std": 1500000000000,
      "min": 14722900000000,
      "max": 17963100000000,
      "count": 4,
      "sum": 68254300000000
    }
  ],
  "grouped": true,
  "groupBy": "country_code"
}
```

## 利用可能な統計量

### 基本統計量

- **mean**: 平均値
- **median**: 中央値
- **mode**: 最頻値（最も頻繁に出現する値）

### ばらつきの指標

- **std**: 標準偏差
- **variance**: 分散
- **range**: 範囲（最大値 - 最小値）
- **iqr**: 四分位範囲（第3四分位数 - 第1四分位数）

### 位置の指標

- **min**: 最小値
- **max**: 最大値
- **q1**: 第1四分位数（25パーセンタイル）
- **q3**: 第3四分位数（75パーセンタイル）

## 使用例

### G7諸国のGDP統計量を計算

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;DEU;GBR;FRA;ITA;CAN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2023
  },
  "statistics": ["mean", "median", "std", "min", "max"],
  "groupBy": "country_code"
}
```

### 年別の統計量を計算

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2000,
    "endYear": 2023
  },
  "statistics": ["mean", "std", "q1", "median", "q3"],
  "groupBy": "year"
}
```

### カスタム値列を使用

デフォルトでは`value`列が使用されますが、`valueColumn`で指定できます。

```json
{
  "dataSource": "estat",
  "dataParams": {
    "statsDataId": "0003410379"
  },
  "statistics": ["mean", "std"],
  "valueColumn": "amount"
}
```

## 統計量の意味

### 平均値 (mean)
データの合計をデータ数で割った値。一般的な「平均」を表します。

### 中央値 (median)
データを小さい順に並べたとき、中央に位置する値。外れ値の影響を受けにくい指標です。

### 標準偏差 (std)
データのばらつきを表す指標。値が大きいほど、データのばらつきが大きいことを意味します。

### 四分位数 (q1, q3)
データを4等分する値。第1四分位数（q1）は下位25%、第3四分位数（q3）は上位25%の境界値です。

### 四分位範囲 (iqr)
第3四分位数と第1四分位数の差。データの中央50%の範囲を表します。

## 注意事項

1. **データの品質**: 統計量の精度は入力データの品質に依存します。欠損値や異常値がある場合は注意が必要です。
2. **グループ化**: `groupBy`を使用する場合、指定した列の値が存在しないデータは除外されます。
3. **計算コスト**: 大量のデータに対して統計量を計算する場合、処理に時間がかかる可能性があります。

## 専門ツールとの連携

基本的な統計量はMCPサーバーで計算できますが、以下のような高度な分析は専門ツール（Python、R等）を使用することを推奨します：

- 相関分析
- 回帰分析
- 時系列分析
- 仮説検定
- 機械学習

MCPサーバーから`export_data`ツールを使用してデータをエクスポートし、専門ツールで分析してください。
