# Cursor で GitHub にプッシュする（認証エラーを防ぐ）

## コミットできない場合（「Please tell me who you are」など）

Git はコミット時に **誰がコミットしたか** が必要です。未設定だとコミットできません。

**対処（このリポジトリだけに設定）：**
```bash
git config user.name "あなたの名前"
git config user.email "your-email@example.com"
```

**全リポジトリに設定する場合：** 上記の `git config` に `--global` を付けて実行します。

---

拡張機能をインストールしたあと、**やることは2つだけ**です。

---

## ステップ1: GitHub にサインインする

1. **コマンドパレットを開く**  
   `Cmd + Shift + P`（Mac）または `Ctrl + Shift + P`（Windows）

2. **「GitHub」と打ち込む**  
   一覧に **「GitHub: Sign In」** または **「GitHub にサインイン」** が出ます。

3. **それを選んで Enter**  
   ブラウザが開くので、GitHub にログインして「Authorize」などで許可します。  
   終わったら Cursor に戻ってください。

4. **サインインできたか確認**  
   左下の **人型アイコン（アカウント）** をクリックすると、GitHub アカウントが表示されていれば OK です。

---

## ステップ2: プッシュする

1. **左サイドバーの「ソース管理」アイコン**（分岐マーク）をクリック  
   または `Cmd + Shift + G`

2. 上に **「変更」「main」** などと出ているところの **「↑ プッシュ」** をクリック  
   初回だけ「GitHub で認証」のようなポップアップが出たら、許可を選びます。

3. エラーが出なければプッシュ完了です。

**別のやり方:** `Cmd + Shift + P` → 「**Git: Push**」と入力して実行しても同じです。

---

## それでも「Username」「パスワード」で止まる場合

Cursor 内ではなく、**ターミナル**やエージェントから `git push` していると、拡張の認証が効かないことがあります。そのときは下の「方法2: PAT」を使います。

## 方法2: Personal Access Token (PAT) で HTTPS

Git が「Username for 'https://github.com'」で止まる場合に有効です。

1. **GitHub でトークンを作成**
   - GitHub → Settings → Developer settings → Personal access tokens → Generate new token
   - スコープで **repo** にチェック
   - トークンをコピー（再表示できないので保管）

2. **リモート URL をトークン付きに変更（1回だけ）**
   ```bash
   git remote set-url origin https://YOUR_GITHUB_USERNAME:YOUR_TOKEN@github.com/m37335/mcp-statistics-server.git
   ```
   その後は `git push origin main` でパスワード入力なしでプッシュできます。

3. **セキュリティ**
   - トークンは他人に見せない・リポジトリにコミットしない
   - 必要なら `git remote set-url origin https://github.com/m37335/mcp-statistics-server.git` で元の URL に戻せる（次回プッシュでまた認証が求められます）

## 方法3: SSH 鍵

すでに SSH 鍵を GitHub に登録している場合：

```bash
git remote set-url origin git@github.com:m37335/mcp-statistics-server.git
git push origin main
```

---

**まとめ:** まずは **方法1（GitHub 拡張 + 左下アイコンからサインイン）** を試し、それでもターミナルから `git push` が失敗する場合は **方法2（PAT をリモート URL に含める）** を使うと確実です。
