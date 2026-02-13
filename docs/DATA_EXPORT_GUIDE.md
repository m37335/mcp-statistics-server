# データエクスポート機能ガイド

専門ツール（Python、R、Excel等）で分析しやすい形式でデータを出力する機能です。

## 概要

`export_data`ツールを使用すると、統計データを以下の形式で出力できます：

- **CSV形式**: Excelやpandasで直接読み込める形式
- **JSON形式**: 配列形式のJSONデータ
- **JSON-structured形式**: メタデータを含む構造化JSON

## 基本的な使い方

### CSV形式で出力

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2020,
    "endYear": 2023
  },
  "format": "csv"
}
```

**出力例:**
```csv
country_code,country_name,year,value,indicator_id,indicator_name
USA,United States,2020,21427700000000,NY.GDP.MKTP.CD,GDP (current US$)
USA,United States,2021,23315000000000,NY.GDP.MKTP.CD,GDP (current US$)
JPN,Japan,2020,4881060000000,NY.GDP.MKTP.CD,GDP (current US$)
JPN,Japan,2021,4937420000000,NY.GDP.MKTP.CD,GDP (current US$)
```

### JSON形式で出力

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA",
    "indicatorCode": "NY.GDP.MKTP.CD"
  },
  "format": "json"
}
```

**出力例:**
```json
[
  {
    "country_code": "USA",
    "country_name": "United States",
    "year": "2020",
    "value": 21427700000000,
    "indicator_id": "NY.GDP.MKTP.CD",
    "indicator_name": "GDP (current US$)"
  },
  ...
]
```

### JSON-structured形式で出力

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA",
    "indicatorCode": "NY.GDP.MKTP.CD"
  },
  "format": "json-structured"
}
```

**出力例:**
```json
{
  "metadata": {
    "source": "worldbank",
    "exportedAt": "2026-02-13T10:30:00.000Z"
  },
  "data": [
    {
      "country_code": "USA",
      "country_name": "United States",
      "year": "2020",
      "value": 21427700000000,
      ...
    }
  ],
  "count": 64,
  "columns": ["country_code", "country_name", "year", "value", "indicator_id", "indicator_name"]
}
```

## データ変換オプション

### 時系列形式に変換

pandas等で時系列分析しやすい形式に変換します。

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN",
    "indicatorCode": "NY.GDP.MKTP.CD"
  },
  "format": "csv",
  "transform": {
    "asTimeSeries": {
      "dateColumn": "year",
      "valueColumn": "value",
      "groupColumn": "country_code"
    }
  }
}
```

**出力例:**
```csv
date,value,group,country_name,indicator_id,indicator_name
2020,21427700000000,USA,United States,NY.GDP.MKTP.CD,GDP (current US$)
2021,23315000000000,USA,United States,NY.GDP.MKTP.CD,GDP (current US$)
2020,4881060000000,JPN,Japan,NY.GDP.MKTP.CD,GDP (current US$)
2021,4937420000000,JPN,Japan,NY.GDP.MKTP.CD,GDP (current US$)
```

### ピボット形式に変換

国×年のマトリックス形式に変換します（Excelのピボットテーブルに似た形式）。

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;CHN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2020,
    "endYear": 2023
  },
  "format": "csv",
  "transform": {
    "asPivot": {
      "indexColumn": "country_code",
      "columnsColumn": "year",
      "valuesColumn": "value"
    }
  }
}
```

**出力例:**
```csv
country_code,2020,2021,2022,2023
USA,21427700000000,23315000000000,25462700000000,27280000000000
JPN,4881060000000,4937420000000,4231140000000,4210300000000
CHN,14722900000000,17734100000000,17963100000000,17734100000000
```

### フィルタリング

特定の条件でデータをフィルタリングします。

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN",
    "indicatorCode": "NY.GDP.MKTP.CD"
  },
  "format": "csv",
  "transform": {
    "filter": {
      "year": "2023"
    }
  }
}
```

### ソート

データをソートします。

```json
{
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;CHN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2023
  },
  "format": "csv",
  "transform": {
    "sort": [
      {
        "column": "value",
        "order": "desc"
      }
    ]
  }
}
```

## データソース別の出力形式

### World Bank

出力される列：
- `country_code`: 国コード（ISO3）
- `country_name`: 国名
- `year`: 年
- `value`: 値
- `indicator_id`: 指標ID
- `indicator_name`: 指標名

### e-Stat

出力される列は統計表によって異なります。基本的には統計表の構造に従います。

## 使用例

### Python (pandas) での使用

```python
import pandas as pd
import requests

# MCPサーバーからCSVデータを取得
response = requests.post('http://localhost:3000/mcp', json={
    "method": "tools/call",
    "params": {
        "name": "export_data",
        "arguments": {
            "dataSource": "worldbank",
            "dataParams": {
                "countryCode": "USA;JPN",
                "indicatorCode": "NY.GDP.MKTP.CD"
            },
            "format": "csv"
        }
    }
})

# CSVをDataFrameに変換
df = pd.read_csv(StringIO(response.json()['result']['data']))
print(df.head())
```

### R での使用

```r
library(httr)
library(readr)

# MCPサーバーからCSVデータを取得
response <- POST('http://localhost:3000/mcp', 
                 body = list(
                   method = "tools/call",
                   params = list(
                     name = "export_data",
                     arguments = list(
                       dataSource = "worldbank",
                       dataParams = list(
                         countryCode = "USA;JPN",
                         indicatorCode = "NY.GDP.MKTP.CD"
                       ),
                       format = "csv"
                     )
                   )
                 ))

# CSVをデータフレームに変換
df <- read_csv(content(response)$result$data)
head(df)
```

## 注意事項

1. **データ量**: 大量のデータをエクスポートする場合は、`limit`パラメータを使用して件数を制限してください。
2. **エンコーディング**: CSVはUTF-8で出力されます。Excelで開く場合は、適切なエンコーディング設定が必要な場合があります。
3. **NULL値**: データが存在しない場合は空文字列（CSV）または`null`（JSON）として出力されます。
