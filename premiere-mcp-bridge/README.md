# 8hammer Premiere MCPブリッジ 🔌

**ターミナルの Claude Code から、そのまま Adobe Premiere Pro を操作する**ための仕組みです。

VS Code の統合ターミナルで Claude Code がファイルを触るのと同じ感覚で、
Claude Code が「Premiere のタイムライン」を触れるようにします。
Claude Code は**あなたのサブスク(Pro/Max)ログインのまま**動くので、追加のAPIキー・API課金は不要です。

```
あなた → Claude Code(ターミナル・サブスク認証)
              ↕ MCP(公式の拡張口)
        Premiere MCPサーバ (mcp-server/)
              ↕ localhost
        Premiere内のブリッジパネル (com.8hammer.mcpbridge) → host.jsx → Premiere
```

- **ブリッジパネル**:Premiere の中で動く小さな窓口。localhost にだけ口を開き、`host.jsx` の操作(シーケンス作成・クリップ配置・マーカー等)を実行します。**パネル内にチャット欄**もあり、⚙ で mcp-server のパスを設定すれば、裏で Claude Code を起動して**このパネルだけで**Premiere を操作できます(下記「使い方B」)。
- **MCPサーバ**:Claude Code に Premiere 操作を「道具」として見せ、呼び出しをブリッジへ中継します。

### 2つの使い方

| | 操作場所 | 追加設定 |
| --- | --- | --- |
| **A. 外部ターミナル** | いつものターミナルの Claude Code | `claude mcp add`(下記4) |
| **B. パネル内チャット** | Premiere パネル内の入力欄 | ⚙ に mcp-server のパスを入れるだけ |

どちらも裏で動くのは Claude Code(サブスク認証)で、同じMCPブリッジを使います。

> なぜサブスクで動くのか:操作の窓口を **Claude Code(公式アプリ)+ MCP(公式の拡張機構)** にしているためです。サードパーティのパネルから直接APIを叩く [premiere-assistant](../premiere-assistant/) 版はAPIキー課金でしたが、こちらは Claude Code のサブスクをそのまま使えます(Claude Code の利用上限は当然かかります)。

## セットアップ(1台につき1回)

### 1. ブリッジパネルを入れる

**Mac**:`install-mac.command` をダブルクリック(ダメなら右クリック→開く、または `bash install-mac.command`)
**Windows**:`install-win.bat` をダブルクリック

やっていることは「未署名エクステンションの許可(PlayerDebugMode)」+「`com.8hammer.mcpbridge` を Adobe の CEP拡張フォルダへコピー」の2つだけです。

### 2. MCPサーバを準備する(Node.js 18以上が必要)

```bash
cd mcp-server
npm install
```

### 3. Premiere で窓口を起動する

Premiere Pro を再起動 → **ウィンドウ → エクステンション → 8hammer MCPブリッジ**。
パネルを開くと自動でローカル窓口が起動します(既定 `http://127.0.0.1:8722/call`)。「起動中」の緑ランプを確認。

### 4. Claude Code に接続を登録する(使い方A・外部ターミナルの場合のみ)

> パネル内チャット(使い方B)だけを使うなら、この手順4は不要です。⚙ で mcp-server のパスを入れれば動きます。

ターミナルで(パスは自分の環境に合わせて):

```bash
claude mcp add premiere -- node /絶対パス/premiere-mcp-bridge/mcp-server/server.js
```

または設定ファイル(`~/.claude.json` など)に直接:

```json
{
  "mcpServers": {
    "premiere": {
      "command": "node",
      "args": ["/絶対パス/premiere-mcp-bridge/mcp-server/server.js"]
    }
  }
}
```

ポートやトークンを変えた場合は環境変数で渡します:

```json
{
  "mcpServers": {
    "premiere": {
      "command": "node",
      "args": ["/絶対パス/premiere-mcp-bridge/mcp-server/server.js"],
      "env": {
        "PREMIERE_BRIDGE_PORT": "8722",
        "PREMIERE_BRIDGE_TOKEN": "8hammer-local"
      }
    }
  }
}
```

## 使い方A:外部ターミナル

Premiere でブリッジパネルを開いた状態で、ターミナルの Claude Code に日本語で指示するだけ:

- 「いま開いている Premiere プロジェクトの中身を教えて」
- 「選択中の素材を新しいシーケンスに順番に並べて」
- 「アクティブシーケンスのクリップの切れ目にマーカーを打って」
- 「10秒地点に『確認』というマーカーを追加して」

## 使い方B:パネル内チャット(ターミナル不要)

Premⅰere だけで完結させたい場合はこちら。

1. パネル上部の **⚙** を開く
2. **mcp-server** に `…/premiere-mcp-bridge/mcp-server/server.js` の絶対パスを入力
3. 必要なら `claude`/`node` のパス(PATHが通っていない場合)、モデル(空欄=既定)を設定
4. 下の入力欄に指示を打って送信(Cmd/Ctrl+Enter でも送信)

裏で `claude`(サブスク認証)が起動し、Premiere を操作します。会話の文脈は保持され、「クリア」で新規セッションに戻ります。

> 事前に、一度ターミナルで `claude` にログイン(サブスク)しておく必要があります。`ANTHROPIC_API_KEY` はパネル起動時に自動で環境から外します。
> **権限**:既定では MCP の8ツールだけを許可して非対話実行します。うまく実行されない場合は ⚙ の「権限プロンプトを完全スキップ」を試してください(自分のPC・自分のPremiere限定で)。

いずれの使い方でも、Premiere のツールが呼ばれるとパネルに記録・反映されます。

## Claude が使えるツール

| ツール | 内容 |
| --- | --- |
| `get_project_overview` | プロジェクト名・シーケンス一覧・素材(nodeId/名前/bin/メディア有無) |
| `get_active_sequence` | アクティブシーケンスの fps・尺・再生ヘッド・各トラックのクリップ(秒) |
| `get_selection` | プロジェクトパネルで選択中の素材 |
| `create_sequence` | 新規シーケンス作成 |
| `place_clip` | 素材をトラックに配置(in/out・挿入/上書き指定可) |
| `add_marker` | シーケンスマーカー追加(名前・コメント・長さ) |
| `set_playhead` | 再生ヘッド移動 |
| `import_files` | 絶対パス指定でメディアをインポート |

## セキュリティ / プライバシー

- ブリッジは **127.0.0.1(自分の端末)のみ** で待ち受けます。外部からは接続できません。
- 簡易トークン(`x-8h-token`)で同一端末内の他プロセスからの誤接続も弾きます。共有端末では既定トークンを変更してください。
- Premiere の操作情報のみが Claude Code を通じて処理されます。映像・音声そのものは送信されません。

## うまく動かないとき

| 症状 | 対処 |
| --- | --- |
| Claude が「ブリッジに接続できません」と言う | Premiereでパネルを開き「起動中」か確認。ポート/トークンが Claude Code 設定と一致しているか確認 |
| メニューにパネルが出ない | Premiere を完全に再起動。インストーラを再実行(PlayerDebugMode確認) |
| `claude mcp` が見つからない | Claude Code(CLI)がインストール済みか、`claude` にPATharが通っているか確認 |
| クリップを配置できない | 対象トラック(V1/A1)のロック解除。シーケンスを1つ開いた状態で実行 |
| ポート競合 | パネルのポート番号を変更し、Claude Code 設定の `PREMIERE_BRIDGE_PORT` も合わせる |

## 技術メモ

- ブリッジパネルは CEP(HTML/JS + ExtendScript)。`--enable-nodejs` で Node の `http` サーバを localhost に立て、`evalScript` で `host.jsx` を実行しJSON応答。ビルド不要。
- MCPサーバは `@modelcontextprotocol/sdk` の stdio サーバ。各ツールを `fetch` でブリッジへ中継。
- `host.jsx` は [premiere-assistant](../premiere-assistant/) と同一ロジック(共通の Premiere 操作関数群)。
- 社外配布時は ZXPSignCmd でパネルを自己署名(.zxp)推奨。
