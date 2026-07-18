# 8hammer AI編集アシスタント — Premiere Pro パネル版 🤖

Premiere Pro のパネル内に **Claude チャット** を置いたものです。
「選択中の素材を新しいシーケンスに並べて」「切れ目にマーカーを打って」のように
**自然言語で指示すると、Claude がプロジェクトを読み取り・編集します。**

内部では Claude の tool use(道具呼び出し)が Premiere 操作関数(`jsx/host.jsx`)にマッピングされ、
必要に応じて何度もツールを呼びながら指示を実行します。

## インストール(1台につき1回)

### Mac
1. このフォルダ(`premiere-assistant`)をダウンロード
2. `install-mac.command` をダブルクリック
   - 「開発元を確認できない」と出たら: 右クリック → 開く。それでもだめなら ターミナルで `bash install-mac.command`
3. Premiere Pro を再起動

### Windows
1. このフォルダ(`premiere-assistant`)をダウンロード
2. `install-win.bat` をダブルクリック
3. Premiere Pro を再起動

どちらも中身は「未署名エクステンションの許可(PlayerDebugMode)」と「`com.8hammer.assistant` フォルダを AdobeのCEP拡張フォルダへコピー」の2つだけです。手動でも同じことができます:

- Mac: `~/Library/Application Support/Adobe/CEP/extensions/`
- Win: `%APPDATA%\Adobe\CEP\extensions\`

## 使い方

1. Premiere Pro → **ウィンドウ → エクステンション → 8hammer AI編集アシスタント**
2. **⚙(設定)**を開いて **Anthropic APIキー** を入力(この端末にのみ保存)。モデルは Sonnet 5 / Haiku 4.5 / Opus 4.8 から選択
3. 下の入力欄に指示を書いて送信(Cmd/Ctrl+Enter でも送信)

### 指示の例

- 「いま開いているプロジェクトの中身を教えて」
- 「選択中の素材を新しいシーケンスに順番に並べて」
- 「アクティブシーケンスのクリップの切れ目にマーカーを打って」
- 「10秒地点に『確認』というマーカーを追加して」
- 「再生ヘッドを30秒に移動して」

## Claudeができる操作(ツール)

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

## プライバシー

- 指示文と、Claudeがツールで取得した**プロジェクトの構成情報(素材名・シーケンス内容など)のみ**が Anthropic に送信されます
- **映像・音声そのものは送信されません**
- APIキーはこの端末の localStorage に保存されます。共有PCでは取り扱いに注意してください

## うまく動かないとき

| 症状 | 対処 |
| --- | --- |
| メニューにパネルが出ない | Premiereを完全に再起動。インストーラを再実行(PlayerDebugModeの設定を確認) |
| 「選択の取得に未対応」 | Premiere Pro 13(2019)以降が必要です |
| クリップを配置できない | 対象トラック(V1/A1等)のロックを解除。シーケンスを1つ開いた状態で実行 |
| パネルが真っ白 | `%APPDATA%\Adobe\CEP\extensions\com.8hammer.assistant`(Macは `~/Library/Application Support/Adobe/CEP/extensions/`)に `index.html` があるか確認 |
| API 401/403エラー | APIキーが正しいか、クレジット残高があるかを確認 |

## 技術メモ

- CEP エクステンション(HTML/JS + ExtendScript)。ビルド不要
- パネル(`index.html`)が Anthropic Messages API を tool use 付きで直接呼び出し(`anthropic-dangerous-direct-browser-access: true`)、`stop_reason: "tool_use"` の間はツールを実行して結果を返すエージェントループ(最大16ステップ)
- Premiere操作は `jsx/host.jsx` の関数を `evalScript` 経由で実行。すべてJSON文字列で応答(ExtendScriptはES3のため最小JSONシリアライザを同梱)
- 社外配布する場合は ZXPSignCmd で自己署名パッケージ(.zxp)にしてください(社内利用はこのままでOK)
