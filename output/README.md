# output/ — 試験的に作成した成果物

試験的に作成したグラフ・チャート・取得データ・レポートを格納するフォルダです。

## 構成

| フォルダ | 内容 |
|----------|------|
| **charts/** | 生成した SVG チャート（test-chart-*.svg, vacancy-*.svg など） |
| **data/**   | 取得したデータ（vacancy-data-*.json, vacancy-timeseries-data.json） |
| **reports/**| 分析レポート・テスト結果などの Markdown（VACANCY_POPULATION_ANALYSIS.md など） |

## 使い方

- **scripts/** 内のスクリプトを実行すると、データは `output/data/` に、チャートは `output/charts/` に出力されます。
- 通常の利用では MCP ツールをチャットから呼び出すため、このフォルダは主に開発・検証時に参照します。

必要に応じて `.gitignore` に `output/` を追加してバージョン管理対象外にすることもできます。
