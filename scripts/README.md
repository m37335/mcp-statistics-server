# スクリプト（オプション）

ここにあるスクリプトは **MCPの本来の使い方ではありません**。

- **通常の利用**: Cursor などのチャットで「データを取得して」「グラフを描いて」と依頼し、MCP ツールが動く使い方が正しいです。  
  → [docs/MCP_USAGE.md](../docs/MCP_USAGE.md) を参照。

以下のスクリプトは、**開発・検証・バッチ用**の補助ツールです。  
**プロジェクトルートから** 実行してください。

```bash
# 例
node scripts/create-vacancy-charts.js
```

**入出力**: データ・チャート・レポートは **`output/`** に整理されます。  
- データ: `output/data/`  
- チャート: `output/charts/`  
- レポート類: `output/reports/`（手動で移動した試験用レポート）

| スクリプト | 用途 |
|------------|------|
| `create-vacancy-charts.js` | 空き家データ（output/data/）から円・棒・折れ線の SVG を一括生成 → output/charts/ |
| `fetch-vacancy-data.js` | e-Stat から空き家データを取得 → output/data/ に JSON 保存 |
| `fetch-vacancy-timeseries.js` | 空き家の年次推移データ取得（または公表値）→ output/data/ に JSON 保存 |
| `analyze-vacancy-data.js` | output/data/ の空き家 JSON を集計・分析表示 |
| `fetch-housing-data.js` | 新築・空き家・経済指標の検索と取得（コンソール出力） |
| `analyze-vacancy-population.js` | 空き家率と人口減少の関係を分析（コンソール出力） |
| `create-vacancy-population-chart.js` | 人口推移チャートを生成 → output/charts/ |
| `debug-estat.js` | e-Stat API レスポンス構造の確認 |
