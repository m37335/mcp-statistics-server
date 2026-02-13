# 複数国横断比較の使用例

## 概要

MCP Statistics Serverでは、World Bank APIを使用して複数の国の指標を同時に取得し、横断的に比較することができます。

## 使用方法

### World Bank APIでの複数国指定

`worldbank_get_indicator`ツールの`countryCode`パラメータに、セミコロン（`;`）で区切って複数の国コードを指定します。

**形式:**
```
countryCode: "国コード1;国コード2;国コード3"
```

**例:**
- `"USA;JPN"` - アメリカと日本
- `"USA;JPN;CHN"` - アメリカ、日本、中国
- `"USA;JPN;CHN;DEU"` - アメリカ、日本、中国、ドイツ

## 実演例

### 例1: 日米のGDP比較

```json
{
  "countryCode": "USA;JPN",
  "indicatorCode": "NY.GDP.MKTP.CD",
  "startYear": 2020,
  "endYear": 2023
}
```

**結果:**
- アメリカと日本のGDPデータを同時に取得
- 年ごとの比較が可能
- 比率計算なども容易

**出力例:**
```
🇺🇸 アメリカのGDP:
   2023年: 27.29兆ドル
   2022年: 25.60兆ドル
   2021年: 23.32兆ドル
   2020年: 21.06兆ドル

🇯🇵 日本のGDP:
   2023年: 4.21兆ドル
   2022年: 4.26兆ドル
   2021年: 5.04兆ドル
   2020年: 5.05兆ドル

📈 比較分析:
2023年: アメリカ(27.29兆) / 日本(4.21兆) = 6.48倍
```

### 例2: G7諸国のGDP比較

```json
{
  "countryCode": "USA;JPN;DEU;GBR;FRA;ITA;CAN",
  "indicatorCode": "NY.GDP.MKTP.CD",
  "startYear": 2023,
  "endYear": 2023
}
```

### 例3: アジア主要国の人口比較

```json
{
  "countryCode": "CHN;IND;JPN;KOR;IDN",
  "indicatorCode": "SP.POP.TOTL",
  "startYear": 2020,
  "endYear": 2023
}
```

## 国コード一覧（主要国）

| 国名 | コード |
|------|--------|
| アメリカ | USA |
| 日本 | JPN |
| 中国 | CHN |
| ドイツ | DEU |
| イギリス | GBR |
| フランス | FRA |
| イタリア | ITA |
| カナダ | CAN |
| 韓国 | KOR |
| インド | IND |
| ブラジル | BRA |
| ロシア | RUS |
| オーストラリア | AUS |

完全な国コード一覧は [World Bank API ドキュメント](https://datahelpdesk.worldbank.org/knowledgebase/articles/201175) を参照してください。

## よく使われる指標コード

| 指標名 | コード |
|--------|--------|
| GDP（現行価格、USドル） | NY.GDP.MKTP.CD |
| GDP成長率 | NY.GDP.MKTP.KD.ZG |
| 人口 | SP.POP.TOTL |
| 一人当たりGDP | NY.GDP.PCAP.CD |
| インフレ率 | FP.CPI.TOTL.ZG |
| 失業率 | SL.UEM.TOTL.ZS |
| 貿易額 | NE.TRD.GNFS.ZS |

完全な指標コード一覧は `worldbank_search_indicators` ツールで検索できます。

## 注意事項

1. **国コードは3文字のISOコード**を使用します（例: `USA`, `JPN`）
2. **セミコロン区切り**で複数国を指定します
3. 指定したすべての国のデータが返されます
4. データが存在しない国は結果に含まれません（エラーにはなりません）

## 活用例

- 経済規模の比較
- 成長率の比較
- 人口動態の比較
- 複数年のトレンド分析
- 地域別の比較分析
