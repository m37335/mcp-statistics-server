# MCP Statistics Server

国内外の統計データソースにアクセスするためのMCP（Model Context Protocol）サーバーです。LLMから統計データを直接取得できます。

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
指標データを取得します。

```typescript
{
  countryCode: string;    // 国コード（例: JP, US, CN）
  indicatorCode: string;  // 指標コード（例: NY.GDP.MKTP.CD）
  startYear?: number;     // 開始年
  endYear?: number;       // 終了年
}
```

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

## 使用例

### e-Statで人口統計を検索

```
e-Statで「人口」に関する統計を検索してください
```

### World BankでGDPデータを取得

```
日本の2020年から2023年のGDPデータを取得してください
（国コード: JP, 指標コード: NY.GDP.MKTP.CD）
```

### OECDで四半期GDPを取得

```
OECDから日本の四半期GDPデータを取得してください
（データセットID: QNA）
```

## ライセンス情報

各データソースのライセンス：

- **e-Stat**: 政府標準利用規約（第2.0版）準拠
- **World Bank**: CC BY 4.0
- **OECD**: 利用条件あり（更新・停止リスクに注意）
- **Eurostat**: 商用/非商用再利用可（出所表示必須）

詳細は各データソースの公式サイトをご確認ください。

## トラブルシューティング

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

## 開発

### ディレクトリ構成

```
MCP_statistics/
├── src/
│   ├── index.ts           # メインサーバー
│   └── sources/
│       ├── estat.ts       # e-Statクライアント
│       ├── worldbank.ts   # World Bankクライアント
│       ├── oecd.ts        # OECDクライアント
│       └── eurostat.ts    # Eurostatクライアント
├── config.json            # 設定ファイル
├── package.json
└── tsconfig.json
```

### 開発モード

```bash
npm run dev  # TypeScriptの変更を監視
```

## 参考資料

- [e-Stat API仕様](https://www.e-stat.go.jp/api/)
- [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/topics/125589)
- [OECD SDMX API](https://data.oecd.org/api/sdmx-json-documentation/)
- [Eurostat API](https://ec.europa.eu/eurostat/web/main/data/web-services)
- [MCP Protocol](https://modelcontextprotocol.io/)
