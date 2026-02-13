# チャート・グラフ生成ガイド

## 概要

MCP Statistics Serverでは、統計データからチャートやグラフを自動生成できます。SVG形式で生成され、Cursorなどのクライアントで表示可能です。

## 使用方法

### `generate_chart` ツール

統計データからチャートを生成します。

#### パラメータ

```typescript
{
  chartType: 'line' | 'bar' | 'pie';  // チャートタイプ
  dataSource: 'worldbank' | 'estat';  // データソース
  dataParams: {                        // データソース固有のパラメータ
    // World Bank用
    countryCode?: string;              // 国コード（例: USA;JPN）
    indicatorCode?: string;            // 指標コード（例: NY.GDP.MKTP.CD）
    startYear?: number;                // 開始年
    endYear?: number;                  // 終了年
    
    // e-Stat用
    statsDataId?: string;              // 統計表ID
    limit?: number;                    // 取得件数
  },
  title?: string;                      // チャートタイトル
  xLabel?: string;                     // X軸ラベル
  yLabel?: string;                     // Y軸ラベル
  width?: number;                      // チャート幅（デフォルト: 800）
  height?: number;                     // チャート高さ（デフォルト: 400）
}
```

## 使用例

### 例1: 日米のGDPを折れ線グラフで比較

```json
{
  "chartType": "line",
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2020,
    "endYear": 2023
  },
  "title": "日米GDP比較（2020-2023年）",
  "xLabel": "年",
  "yLabel": "GDP（兆ドル）"
}
```

### 例2: 複数国のGDPを棒グラフで比較

```json
{
  "chartType": "bar",
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;CHN;DEU",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2023,
    "endYear": 2023
  },
  "title": "主要国のGDP比較（2023年）",
  "xLabel": "国",
  "yLabel": "GDP（兆ドル）"
}
```

### 例3: 円グラフで構成比を表示

```json
{
  "chartType": "pie",
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;CHN;DEU;GBR",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2023,
    "endYear": 2023
  },
  "title": "G5諸国のGDP構成比（2023年）"
}
```

### 例4: e-Statデータからチャート生成

```json
{
  "chartType": "line",
  "dataSource": "estat",
  "dataParams": {
    "statsDataId": "0000010106",
    "limit": 50
  },
  "title": "日本の労働力人口推移",
  "xLabel": "期間",
  "yLabel": "人口（千人）"
}
```

## チャートタイプ

### 折れ線グラフ（line）
- **用途**: 時系列データの推移を表示
- **特徴**: 複数の系列を同時に表示可能
- **例**: GDPの年次推移、人口の推移

### 棒グラフ（bar）
- **用途**: カテゴリ間の比較
- **特徴**: 複数の系列を並べて表示可能
- **例**: 国別GDP比較、年度別売上比較

### 円グラフ（pie）
- **用途**: 構成比の表示
- **特徴**: 全体に対する各要素の割合を視覚化
- **例**: 国別GDP構成比、カテゴリ別シェア

## 出典情報

**すべてのチャートには自動的に出典情報が追加されます。**

チャートの下部に以下の情報が表示されます：
- **データソース名**: World Bank、e-Stat等
- **指標コード/統計表ID**: 使用したデータの識別子
- **ライセンス情報**: データの利用条件
- **出典URL**: データソースのURL

### 出典情報の例

**World Bankデータの場合:**
```
出典: World Bank
Indicator: NY.GDP.MKTP.CD
ライセンス: CC BY 4.0 | https://data.worldbank.org
```

**e-Statデータの場合:**
```
出典: e-Stat（政府統計の総合窓口）
統計表ID: 0000010106
ライセンス: 政府標準利用規約（第2.0版）準拠 | https://www.e-stat.go.jp
```

## レスポンス形式

チャート生成ツールは以下の形式でレスポンスを返します：

```json
{
  "svg": "<svg>...</svg>",                    // SVG形式のチャート（出典情報含む）
  "dataUri": "data:image/svg+xml;base64,...", // Base64エンコードされたデータURI
  "format": "svg"                             // フォーマット（常に "svg"）
}
```

## SVGの表示方法

### Cursorでの表示

CursorはSVGを自動的にレンダリングします。`dataUri`を画像として表示することもできます。

### ブラウザでの表示

```html
<img src="data:image/svg+xml;base64,..." alt="Chart" />
```

または、SVGを直接埋め込み：

```html
<div id="chart-container"></div>
<script>
  document.getElementById('chart-container').innerHTML = svgString;
</script>
```

### ファイルとして保存

```javascript
const fs = require('fs');
fs.writeFileSync('chart.svg', svgString);
```

## カスタマイズ

### サイズの調整

```json
{
  "width": 1200,
  "height": 600
}
```

### ラベルの設定

```json
{
  "title": "カスタムタイトル",
  "xLabel": "X軸のラベル",
  "yLabel": "Y軸のラベル"
}
```

## 注意事項

1. **出典情報の表示**: すべてのチャートに自動的に出典情報が追加されます。これはデータの信頼性と透明性を確保するためです。
2. **データの可用性**: 指定した期間や国にデータが存在しない場合、空のチャートが生成される可能性があります
3. **パフォーマンス**: 大量のデータポイントを含むチャートは生成に時間がかかる場合があります
4. **SVGサイズ**: 非常に大きなチャートはファイルサイズが大きくなる可能性があります。出典情報の追加により、チャートの高さが約50px増加します。
5. **データソースの制限**: 各データソースのAPIレート制限が適用されます
6. **ライセンス遵守**: 生成されたチャートを使用する際は、表示されているライセンス情報に従ってください

## トラブルシューティング

### チャートが空になる
- データが存在するか確認してください
- 期間や国コードが正しいか確認してください

### エラーが発生する
- データソースが有効になっているか確認してください
- パラメータが正しい形式か確認してください

### チャートが表示されない
- SVG形式がサポートされているか確認してください
- Base64エンコードされたデータURIを使用してください
