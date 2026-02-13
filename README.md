# MCP Statistics Server

国内外の統計データソースにアクセスするためのMCP（Model Context Protocol）サーバーです。LLMから統計データを直接取得できます。

## MCPの使い方（推奨）

**通常の利用では、Cursor や Claude Desktop のチャットで「データを取得して」「グラフを描いて」と依頼し、AI がこのサーバーのツール（`estat_get_data` や `generate_chart` など）を呼び出す形が正しい使い方です。** 毎回スクリプトを書いたり `node xxx.js` を手で実行する必要はありません。

詳しくは [docs/MCP_USAGE.md](docs/MCP_USAGE.md) を参照してください。

## 概要

このMCPサーバーは、以下のデータソースへのアクセスを提供します：

- **e-Stat**（日本政府統計）- 国勢調査、労働力調査等の横断検索・取得
- **World Bank Data** - 世界銀行の開発指標（WDI等）
- **OECD Data** - OECD加盟国の経済・社会統計（SDMX形式）
- **Eurostat** - EU統計局のデータ（JSON-stat形式）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 設定ファイルの作成

サンプル設定ファイルをコピーして、APIキーを設定します：

```bash
cp config.example.json config.json
```

次に `config.json` を編集して、e-Stat APIキーを設定します：

```json
{
  "dataSources": {
    "estat": {
      "apiKey": "YOUR_ESTAT_API_KEY"
    }
  }
}
```

> **重要**: `config.json` は `.gitignore` に含まれており、GitHubにプッシュされません。APIキーは安全に保管されます。

**環境変数を使用する場合（推奨）**:

環境変数を使用すると、より安全に設定を管理できます：

```bash
# .envファイルを作成
cp .env.example .env

# .envファイルを編集してAPIキーを設定
ESTAT_API_KEY=your_actual_api_key_here
```

環境変数は `config.json` より優先されます。利用可能な環境変数：

- `ESTAT_API_KEY` - e-Stat APIキー
- `ESTAT_BASE_URL` - e-Stat ベースURL（オプション）
- `ESTAT_ENABLED` - e-Statを有効化（true/false）
- `WORLDBANK_BASE_URL` - World Bank ベースURL（オプション）
- `WORLDBANK_ENABLED` - World Bankを有効化（true/false）
- `OECD_BASE_URL` - OECD ベースURL（オプション）
- `OECD_ENABLED` - OECDを有効化（true/false）
- `EUROSTAT_BASE_URL` - Eurostat ベースURL（オプション）
- `EUROSTAT_ENABLED` - Eurostatを有効化（true/false）

> **Note**: `.env` ファイルも `.gitignore` に含まれており、GitHubにプッシュされません。

**APIキーの取得方法：**

- **e-Stat**: https://www.e-stat.go.jp/api/ でアカウント登録後、APIキーを取得
- **World Bank, OECD, Eurostat**: APIキー不要（公開API）

### 3. ビルド

```bash
npm run build
```

### 4. サーバーの起動

```bash
npm start
```

## MCP設定

Claude DesktopやCursorなどのMCPクライアントで使用する場合、設定ファイルに以下を追加します：

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "statistics": {
      "command": "node",
      "args": ["/Volumes/OWC Express 1M2/Documents/MCP_statistics/dist/index.js"]
    }
  }
}
```

### Cursor (`.cursor/mcp_config.json`)

```json
{
  "mcpServers": {
    "statistics": {
      "command": "node",
      "args": ["/Volumes/OWC Express 1M2/Documents/MCP_statistics/dist/index.js"]
    }
  }
}
```

## 利用可能なツール

設定で有効にしたデータソースおよび共通機能に対応する、次のツールを提供します。

| ツール名 | 説明 | 備考 |
|----------|------|------|
| `estat_search_stats` | e-Statで統計表を検索 | e-Stat有効時 |
| `estat_get_data` | e-Statから統計データを取得 | e-Stat有効時 |
| `worldbank_get_indicator` | World Bankの指標データを取得 | World Bank有効時。複数国はセミコロン区切り |
| `worldbank_search_indicators` | World Bankの指標を検索 | World Bank有効時 |
| `oecd_get_data` | OECDのデータを取得（SDMX形式） | OECD有効時 |
| `eurostat_get_data` | Eurostatのデータを取得（JSON-stat形式） | Eurostat有効時 |
| `export_data` | データをCSV/JSONで出力（専門ツール用） | worldbank または estat |
| `calculate_statistics` | 基本統計量（平均・中央値・標準偏差等）を計算 | worldbank または estat |
| `generate_chart` | チャート・グラフを生成（SVG） | worldbank または estat |

---

### e-Stat

#### `estat_search_stats`
統計表を検索します。

```typescript
{
  searchWord: string;  // 検索キーワード
  limit?: number;      // 取得件数（デフォルト: 10）
}
```

#### `estat_get_data`
統計データを取得します。

```typescript
{
  statsDataId: string;  // 統計表ID
  limit?: number;       // 取得件数（デフォルト: 100）
}
```

### World Bank

#### `worldbank_get_indicator`
指標データを取得します。**複数国の横断比較が可能**です。

```typescript
{
  countryCode: string;    // 国コード（例: JP, US, CN。複数国はセミコロン区切り: USA;JPN;CHN）
  indicatorCode: string;  // 指標コード（例: NY.GDP.MKTP.CD）
  startYear?: number;     // 開始年
  endYear?: number;       // 終了年
}
```

**複数国比較の例:**
- `countryCode: "USA;JPN"` - アメリカと日本のデータを同時取得
- `countryCode: "USA;JPN;CHN"` - アメリカ、日本、中国のデータを同時取得

#### `worldbank_search_indicators`
指標を検索します。

```typescript
{
  search?: string;  // 検索キーワード
}
```

### OECD

#### `oecd_get_data`
データを取得します（SDMX形式）。

```typescript
{
  datasetId: string;     // データセットID（例: QNA）
  filter?: string;       // フィルター（例: JPN.GDP.....）
  startPeriod?: string;  // 開始期間（例: 2020-Q1）
  endPeriod?: string;    // 終了期間（例: 2024-Q4）
}
```

### Eurostat

#### `eurostat_get_data`
データを取得します（JSON-stat形式）。

```typescript
{
  datasetCode: string;           // データセットコード（例: nama_10_gdp）
  filters?: Record<string, string>;  // フィルター
  lang?: string;                 // 言語（EN, DE, FR等）
}
```

### チャート生成

#### `generate_chart`
統計データからチャートやグラフを生成します（SVG形式）。

```typescript
{
  chartType: 'line' | 'bar' | 'pie';  // チャートタイプ
  dataSource: 'worldbank' | 'estat';  // データソース
  dataParams: {                        // データソース固有のパラメータ
    countryCode?: string;              // 国コード（World Bank用、例: USA;JPN）
    indicatorCode?: string;            // 指標コード（World Bank用、例: NY.GDP.MKTP.CD）
    startYear?: number;                // 開始年（World Bank用）
    endYear?: number;                  // 終了年（World Bank用）
    statsDataId?: string;              // 統計表ID（e-Stat用）
    limit?: number;                     // 取得件数（e-Stat用）
  },
  title?: string;                      // チャートタイトル
  xLabel?: string;                     // X軸ラベル
  yLabel?: string;                     // Y軸ラベル
  width?: number;                      // チャート幅（デフォルト: 800）
  height?: number;                     // チャート高さ（デフォルト: 400）
}
```

詳細は [docs/CHART_GUIDE.md](docs/CHART_GUIDE.md) を参照してください。

### データエクスポート

#### `export_data`
専門ツール（Python、R、Excel等）で分析しやすい形式（CSV/JSON）でデータを出力します。

```typescript
{
  dataSource: 'worldbank' | 'estat';  // データソース
  dataParams: {                        // データソース固有のパラメータ
    countryCode?: string;              // 国コード（World Bank用、例: USA;JPN）
    indicatorCode?: string;            // 指標コード（World Bank用、例: NY.GDP.MKTP.CD）
    startYear?: number;                // 開始年（World Bank用）
    endYear?: number;                  // 終了年（World Bank用）
    statsDataId?: string;              // 統計表ID（e-Stat用）
    limit?: number;                     // 取得件数（e-Stat用）
  },
  format: 'csv' | 'json' | 'json-structured';  // 出力形式
  transform?: {                        // データ変換オプション
    asTimeSeries?: {                   // 時系列形式に変換
      dateColumn: string;
      valueColumn: string;
      groupColumn?: string;
    };
    asPivot?: {                        // ピボット形式に変換
      indexColumn: string;
      columnsColumn: string;
      valuesColumn: string;
    };
    filter?: Record<string, unknown>;  // フィルタリング条件
    sort?: Array<{                     // ソート条件
      column: string;
      order: 'asc' | 'desc';
    }>;
  };
}
```

詳細は [docs/DATA_EXPORT_GUIDE.md](docs/DATA_EXPORT_GUIDE.md) を参照してください。

### 統計量計算

#### `calculate_statistics`
統計データから基本的な統計量（平均、中央値、標準偏差など）を計算します。

```typescript
{
  dataSource: 'worldbank' | 'estat';  // データソース
  dataParams: {                        // データソース固有のパラメータ
    countryCode?: string;              // 国コード（World Bank用、例: USA;JPN）
    indicatorCode?: string;            // 指標コード（World Bank用、例: NY.GDP.MKTP.CD）
    startYear?: number;                // 開始年（World Bank用）
    endYear?: number;                  // 終了年（World Bank用）
    statsDataId?: string;              // 統計表ID（e-Stat用）
    limit?: number;                     // 取得件数（e-Stat用）
  },
  statistics: Array<                  // 計算する統計量
    'mean' | 'median' | 'mode' | 'std' | 'variance' |
    'min' | 'max' | 'range' | 'q1' | 'q3' | 'iqr'
  >;
  groupBy?: string;                    // グループ化する列（例: country_code, year）
  valueColumn?: string;                 // 値の列名（デフォルト: value）
}
```

詳細は [docs/STATISTICS_GUIDE.md](docs/STATISTICS_GUIDE.md) を参照してください。

## 使用例

### e-Statで人口統計を検索

```
e-Statで「人口」に関する統計を検索してください
```

### World BankでGDPデータを取得（単一国）

### World Bankで複数国のGDPを比較（横断比較）

```
日本の2020年から2023年のGDPデータを取得してください
（国コード: JP, 指標コード: NY.GDP.MKTP.CD）
```

### OECDで四半期GDPを取得

```
OECDから日本の四半期GDPデータを取得してください
（データセットID: QNA）
```

### チャート・グラフの生成

```
日米のGDPを折れ線グラフで比較してください
（国コード: USA;JPN, 指標コード: NY.GDP.MKTP.CD, 期間: 2020-2023年）
```

詳細は [docs/CHART_GUIDE.md](docs/CHART_GUIDE.md) を参照してください。

## ライセンス情報

各データソースのライセンス：

- **e-Stat**: 政府標準利用規約（第2.0版）準拠
- **World Bank**: CC BY 4.0
- **OECD**: 利用条件あり（更新・停止リスクに注意）
- **Eurostat**: 商用/非商用再利用可（出所表示必須）

詳細は各データソースの公式サイトをご確認ください。

## トラブルシューティング

### コミットできない場合

「Please tell me who you are」などと出る場合は、Git の `user.name` と `user.email` が未設定です。リポジトリで `git config user.name "名前"` と `git config user.email "メール"` を設定してください。詳しくは [docs/GITHUB_AUTH_CURSOR.md](docs/GITHUB_AUTH_CURSOR.md) の冒頭を参照。

### Git プッシュで認証エラーになる場合

Cursor やターミナルで `git push` が「could not read Username」などで失敗する場合の対処は [docs/GITHUB_AUTH_CURSOR.md](docs/GITHUB_AUTH_CURSOR.md) を参照してください（GitHub 拡張のサインイン・PAT・SSH の3通り）。

### APIキーエラー

e-Statで「API key error」が出る場合：
1. `config.json` の `apiKey` が正しく設定されているか確認
2. e-Statのアカウントでキーが有効か確認

### ビルドエラー

TypeScriptのコンパイルエラーが出る場合：
```bash
npm install
npm run build
```

### 接続エラー

データソースに接続できない場合：
1. インターネット接続を確認
2. データソースのAPIエンドポイントが変更されていないか確認
3. ログを確認して詳細なエラー情報を確認

### GitHub Actions（CI）が失敗する場合

- **`npm ci` で "Missing from lock file"** → ローカルで `npm install` してから `package-lock.json` をコミット・プッシュする。
- **ビルド・テスト・リント** → ローカルで `npm ci && npm run build && npm test && npm run lint` を実行し、同じエラーが出ないか確認する。  
  Actions のログでどのステップで失敗しているかを確認すると原因を特定しやすい。

### テストエラー

テストが失敗する場合：
```bash
# 依存関係を再インストール
npm install

# テストを再実行
npm test
```

## 機能

### 型安全性
- すべてのツール引数にTypeScript型定義を実装
- コンパイル時の型チェックにより、実行時エラーを防止

### 入力バリデーション
- 各ツールの引数に対して必須パラメータチェックと値の検証を実装
- 不正な入力値に対して明確なエラーメッセージを提供

### エラーハンドリング
- 詳細なAPIエラー情報（ステータスコード、レスポンス本文）を含むエラーメッセージ
- 各データソースのレスポンス形式を検証し、予期しない形式の場合に適切に処理

### ログ機能
- 構造化ログ（リクエスト/レスポンス、エラー）を実装
- デバッグとモニタリングを容易にする

### リトライ機能
- ネットワークエラーや一時的なサーバーエラー（429, 500, 502, 503, 504）で自動リトライ
- 指数バックオフによる待機時間の調整（デフォルト: 最大3回、初期待機1秒）

### レート制限
- データソースごとのレート制限管理
- APIレート制限を超えないよう、リクエスト間隔を自動制御

## 開発

このリポジトリには **MCP サーバー本体のみ** を含めています。`.cursor/`（IDE設定）、`output/`（生成チャート・データ）、`scripts/`（開発用スクリプト）は `.gitignore` で除外しており、必要に応じてローカルで作成・利用してください。

### ディレクトリ構成（リポジトリに含まれるもの）

```
MCP_statistics/
├── docs/                  # ドキュメント
│   ├── README.md          # ドキュメント一覧
│   ├── MCP_USAGE.md       # MCPの正しい使い方
│   ├── CHART_GUIDE.md     # チャート生成の使い方
│   ├── GITHUB_AUTH_CURSOR.md
│   ├── DATA_EXPORT_GUIDE.md
│   ├── STATISTICS_GUIDE.md
│   ├── COMPARISON_EXAMPLES.md
│   ├── PROMPT_EXAMPLES.md
│   ├── SETUP.md
│   └── STATISTICAL_FEATURES_PROPOSAL.md
├── src/
│   ├── index.ts           # メインサーバー
│   ├── config.ts          # 設定読み込み
│   ├── types.ts           # 型定義
│   ├── validation.ts      # 入力バリデーション
│   ├── errors.ts          # エラーハンドリング
│   ├── logger.ts          # ログ機能
│   ├── retry.ts           # リトライ機能
│   ├── rateLimiter.ts     # レート制限
│   ├── __tests__/         # テストファイル
│   └── sources/
│       ├── estat.ts       # e-Statクライアント
│       ├── worldbank.ts   # World Bankクライアント
│       ├── oecd.ts        # OECDクライアント
│       └── eurostat.ts    # Eurostatクライアント
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CDパイプライン
├── config.json            # 設定ファイル
├── package.json
├── tsconfig.json
├── jest.config.js         # Jest設定
└── .eslintrc.json         # ESLint設定
```

### 開発モード

```bash
npm run dev  # TypeScriptの変更を監視
```

### テスト

```bash
# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

### リント

```bash
# リントを実行
npm run lint

# 自動修正
npm run lint:fix
```

### CI/CD

GitHub Actionsを使用して、プッシュ時に自動的に以下を実行します：

- ビルド（TypeScriptコンパイル）
- テスト（Jest）
- リント（ESLint）

ワークフローファイル: `.github/workflows/ci.yml`

## 参考資料

- [e-Stat API仕様](https://www.e-stat.go.jp/api/)
- [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589)
- [OECD SDMX API](https://data.oecd.org/api/sdmx-json-documentation/)
- [Eurostat API](https://ec.europa.eu/eurostat/web/main/data/web-services)
- [MCP Protocol](https://modelcontextprotocol.io/)
