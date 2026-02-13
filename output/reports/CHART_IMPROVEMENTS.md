# チャート生成の改善点

## 実装済みの改善

### 1. データに応じた凡例の位置調整 ✅

**実装内容:**
- 系列数が5より多い場合、または凡例の幅が180pxより大きい場合は下部に横並びで配置
- それ以外の場合は右上に縦並びで配置
- 複数行対応（下部配置時）

**動作例:**
- 2-5系列: 右上に縦並び
- 6系列以上: 下部に横並び（必要に応じて複数行）

### 2. X軸とY軸の数値ラベル表示 ✅

**X軸の数値ラベル:**
- すべてのデータポイントのラベルをX軸に表示
- ラベルが長い場合やデータポイントが多い場合は自動的に回転（-45度）
- フォントサイズと色を調整

**Y軸の数値ラベル:**
- グリッドラインに沿ってY軸の数値を表示
- 値のフォーマット（T=兆、B=十億、M=百万、K=千）
- Y軸の数値の幅に応じて左パディングを自動調整

### 3. 全体のサイズ調整 ✅

**実装内容:**
- `width`と`height`パラメータでチャートサイズを指定可能
- データに応じてパディングを自動調整：
  - **左パディング**: Y軸の数値ラベルの幅に応じて調整
  - **右パディング**: 凡例の幅に応じて調整
  - **下パディング**: X軸のラベルの数と長さに応じて調整

**デフォルト値:**
- width: 800px
- height: 400px
- 出典情報がある場合、高さが自動的に+50px

### 4. Y軸のラベル表示 ✅

**実装内容:**
- `yLabel`パラメータでY軸のラベルを指定可能
- Y軸の左側に回転して表示（-90度）
- Y軸の数値ラベルとY軸のラベル（yLabel）の両方が表示される

**表示例:**
```
Y軸ラベル（yLabel）: "GDP（兆ドル）"
Y軸の数値ラベル: 27.29T, 22.68T, 18.06T, ...
```

## 改善の詳細

### パディングの自動調整

```typescript
// Y軸の数値の幅に応じて左パディングを調整
const yAxisLabelWidth = calculateYAxisLabelWidth(maxValue, minValue);
const leftPadding = Math.max(80, yAxisLabelWidth + 20);

// X軸の数値の高さに応じて下パディングを調整
const xAxisLabelHeight = allLabels.length > 10 ? 100 : 80;
const bottomPadding = xAxisLabelHeight;

// 凡例の位置に応じて右パディングを調整
const legendWidth = calculateLegendWidth(series);
const rightPadding = series.length > 3 ? Math.max(60, legendWidth + 20) : 60;
```

### 凡例の配置ロジック

```typescript
// 系列数が多い場合や凡例が長い場合は下部に配置
const shouldPlaceBottom = series.length > 5 || legendWidth > 180;

if (shouldPlaceBottom) {
    // 下部に配置（横並び、複数行対応）
    // 右端を超える場合は自動的に次の行へ
} else {
    // 右上に配置（縦並び）
}
```

### X軸ラベルの回転

```typescript
// ラベルが長い場合やデータポイントが多い場合は回転
const avgLabelLength = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
const shouldRotate = avgLabelLength > 6 || labels.length > 10;
const rotation = shouldRotate ? -45 : 0;
```

## 使用例

### カスタムサイズのチャート

```json
{
  "chartType": "line",
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "USA;JPN;DEU;GBR;FRA;ITA;CAN",
    "indicatorCode": "NY.GDP.MKTP.CD",
    "startYear": 2020,
    "endYear": 2023
  },
  "title": "G7諸国のGDP比較",
  "xLabel": "年",
  "yLabel": "GDP（兆ドル）",
  "width": 1200,
  "height": 600
}
```

### 多くのデータポイント

```json
{
  "chartType": "line",
  "dataSource": "worldbank",
  "dataParams": {
    "countryCode": "JPN;CHN;IND",
    "indicatorCode": "SP.POP.TOTL",
    "startYear": 2010,
    "endYear": 2023
  },
  "title": "アジア主要国の人口推移",
  "xLabel": "年",
  "yLabel": "人口（人）",
  "width": 1000,
  "height": 600
}
```

## テスト結果

✅ X軸の数値ラベルが正しく表示される
✅ Y軸の数値ラベルが正しく表示される
✅ Y軸のラベル（yLabel）が表示される
✅ 凡例がデータに応じて適切な位置に配置される
✅ パディングがデータに応じて自動調整される
✅ 出典情報が表示される
