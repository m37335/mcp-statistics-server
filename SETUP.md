# MCP Statistics Server セットアップガイド

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ビルド

```bash
npm run build
```

### 3. 設定ファイルの確認

`config.json`が正しく設定されているか確認してください。e-Statを使用する場合は、APIキーが設定されている必要があります。

### 4. Cursorでの設定

#### 方法1: プロジェクトローカルの設定（推奨）

プロジェクトの`.cursor/mcp.json`ファイルが既に作成されています。Cursorを再起動すると自動的に認識されます。

#### 方法2: グローバル設定

ホームディレクトリに`.cursor/mcp.json`を作成または編集：

```bash
mkdir -p ~/.cursor
```

`~/.cursor/mcp.json`の内容：

```json
{
  "mcpServers": {
    "statistics": {
      "command": "node",
      "args": [
        "/Volumes/OWC Express 1M2/Documents/MCP_statistics/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

### 5. Cursorの再起動

設定を反映するために、Cursorを再起動してください。

### 6. 動作確認

Cursorのチャットで以下のように試してみてください：

```
e-Statで「人口」に関する統計を検索してください
```

または

```
World Bankから日本のGDPデータを取得してください（国コード: JP, 指標コード: NY.GDP.MKTP.CD）
```

## トラブルシューティング

### MCPサーバーが認識されない場合

1. Cursorを完全に再起動
2. `dist/index.js`が存在するか確認：`ls -la dist/index.js`
3. Node.jsのパスが正しいか確認：`which node`
4. 設定ファイルのパスが正しいか確認（絶対パスを使用）

### エラーが発生する場合

1. ログを確認（MCPサーバーのログはstderrに出力されます）
2. `config.json`の設定を確認
3. ネットワーク接続を確認

## テスト実行

サーバーが正常に動作するかテスト：

```bash
# ビルドが完了しているか確認
npm run build

# サーバーファイルが存在するか確認
test -f dist/index.js && echo "OK" || echo "NG"
```
