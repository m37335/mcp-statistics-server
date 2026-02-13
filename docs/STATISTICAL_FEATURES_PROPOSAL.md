# 統計処理機能の提案

## 現状の機能

### データ取得
- ✅ 複数のデータソースからデータを取得
- ✅ 複数国の横断比較
- ✅ 期間指定によるデータ取得

### 可視化
- ✅ チャート・グラフ生成（折れ線、棒、円）
- ✅ 出典情報の自動表示
- ✅ データに応じた自動レイアウト調整

## 提案する統計処理機能

### レベル1: 基本的な統計量（推奨・優先度高）

**実装すべき機能:**
1. **記述統計**
   - 平均値（mean）
   - 中央値（median）
   - 最頻値（mode）
   - 標準偏差（standard deviation）
   - 分散（variance）
   - 最小値・最大値（min/max）
   - 四分位数（quartiles）
   - 範囲（range）

2. **データの集計**
   - グループ別の集計（国別、年別など）
   - 合計、平均、カウント
   - ピボットテーブル的な集計

**使用例:**
```
「日米のGDPの平均値を計算してください」
「G7諸国の2023年のGDPの標準偏差を計算してください」
「各国のGDP成長率を年別に集計してください」
```

### レベル2: 比較・分析（推奨・優先度中）

**実装すべき機能:**
1. **比較分析**
   - 国間の比較（比率、差分）
   - 期間比較（前年比、前四半期比）
   - ランキング（上位N件、下位N件）

2. **トレンド分析**
   - 成長率の計算（CAGR、年次成長率）
   - トレンドの検出（増加傾向、減少傾向）
   - 移動平均の計算

**使用例:**
```
「日米のGDPの比率を計算してください」
「日本のGDPの前年比成長率を計算してください」
「G7諸国のGDP成長率をランキングで表示してください」
```

### レベル3: 相関・回帰（検討・優先度低）

**実装を検討する機能:**
1. **相関分析**
   - ピアソンの相関係数
   - スピアマンの順位相関係数
   - 散布図の生成

2. **簡単な回帰分析**
   - 線形回帰（単回帰）
   - トレンドラインの表示

**使用例:**
```
「GDPと人口の相関係数を計算してください」
「GDPの推移にトレンドラインを追加してください」
```

### レベル4: 高度な分析（非推奨）

**実装しない機能（他のツールに任せる）:**
- 多変量解析
- 時系列分析（ARIMA等）
- 機械学習
- 仮説検定
- ベイズ統計

## 推奨実装方針

### フェーズ1: 基本的な統計量（必須）

**ツール: `calculate_statistics`**
```typescript
{
  dataSource: 'worldbank' | 'estat';
  dataParams: { /* データ取得パラメータ */ };
  statistics: ('mean' | 'median' | 'std' | 'min' | 'max' | 'sum' | 'count')[];
  groupBy?: string; // 'country', 'year', etc.
}
```

**レスポンス例:**
```json
{
  "statistics": {
    "mean": 15.5,
    "median": 14.2,
    "std": 8.3,
    "min": 2.1,
    "max": 27.3
  },
  "grouped": [
    { "group": "USA", "mean": 25.6, "std": 2.1 },
    { "group": "JPN", "mean": 4.5, "std": 0.3 }
  ]
}
```

### フェーズ2: 比較・分析（推奨）

**ツール: `compare_data`**
```typescript
{
  dataSource: 'worldbank';
  dataParams: { /* データ取得パラメータ */ };
  comparisonType: 'ratio' | 'difference' | 'growth_rate' | 'ranking';
  reference?: string; // 比較基準（例: 'USA'）
}
```

**ツール: `calculate_trend`**
```typescript
{
  dataSource: 'worldbank';
  dataParams: { /* データ取得パラメータ */ };
  trendType: 'cagr' | 'year_over_year' | 'moving_average';
  period?: number; // 移動平均の期間など
}
```

### フェーズ3: 相関・回帰（オプション）

**ツール: `calculate_correlation`**
```typescript
{
  dataSource: 'worldbank';
  dataParams1: { /* 第1指標 */ };
  dataParams2: { /* 第2指標 */ };
  method: 'pearson' | 'spearman';
}
```

## 実装の優先順位

### 高優先度（必須）
1. ✅ 基本的な統計量の計算（mean, median, std, min, max）
2. ✅ データの集計（グループ別）
3. ✅ 比較分析（比率、差分）

### 中優先度（推奨）
4. 成長率の計算（CAGR、前年比）
5. ランキング機能
6. トレンド検出

### 低優先度（オプション）
7. 相関分析
8. 簡単な回帰分析
9. 散布図の生成

## 設計上の考慮事項

### MCPサーバーの役割
- **データ取得と基本的な処理**: MCPサーバーの責任範囲内
- **高度な分析**: 専門ツール（Python、R等）に任せる

### パフォーマンス
- 基本的な統計量は軽量で高速
- 大規模データの処理は避ける（サンプリングを検討）

### ユーザビリティ
- シンプルなAPI設計
- 明確なエラーメッセージ
- 結果の可視化オプション

## 実装例

### 基本的な統計量の計算

```typescript
// src/statistics/basicStats.ts
export function calculateMean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateStdDev(values: number[]): number {
  const mean = calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: calculateMean(values),
    median: sorted[Math.floor(sorted.length / 2)],
    std: calculateStdDev(values),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: values.length,
    sum: values.reduce((sum, v) => sum + v, 0),
  };
}
```

### 比較分析

```typescript
// src/statistics/comparison.ts
export function calculateRatio(value1: number, value2: number): number {
  return value2 !== 0 ? value1 / value2 : NaN;
}

export function calculateGrowthRate(current: number, previous: number): number {
  return previous !== 0 ? ((current - previous) / previous) * 100 : NaN;
}

export function calculateCAGR(values: number[], years: number): number {
  if (values.length < 2 || years <= 0) return NaN;
  const first = values[0];
  const last = values[values.length - 1];
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}
```

## まとめ

**推奨する実装範囲:**
- ✅ レベル1（基本的な統計量）: **必須**
- ✅ レベル2（比較・分析）: **推奨**
- ⚠️ レベル3（相関・回帰）: **オプション**
- ❌ レベル4（高度な分析）: **実装しない**

**MCPサーバーとしての役割:**
データ取得 → 基本的な統計処理 → 可視化 のパイプラインを提供し、高度な分析は専門ツールに任せる。
