# 8hammer Tools — DESIGN.md

このリポジトリのツールを追加・改修するときの設計ルール。
新しいツールを作るときは、このファイルと既存ツール(構成が近いもの)を参照すること。

## 1. 基本方針

- **ビルド不要・単一HTML**: 各ツールは `ツール名/index.html` 1ファイルにHTML/CSS/JSをすべて含める。フレームワーク・バンドラは使わない(例外: shot/ の Three.js は `vendor/` に同梱)
- **オフラインファースト**: 現場(電波なし)で動くこと。外部CDN・外部フォント・外部APIに依存しない。例外はAI機能のみ(明示し、なくても本体が成立すること)
- **データは端末内のみ**: localStorage に保存。外部送信しない。この旨をUIに明記する
- **iPad/スマホ対応**: PWA(ホーム画面に追加)で全画面動作。タッチ操作前提で当たり判定を大きく

## 2. ディレクトリ構成(1ツール)

```
toolname/
  index.html            # 本体(単一ファイル)
  manifest.webmanifest  # PWAマニフェスト
  sw.js                 # Service Worker(cache-first)
  icons/
    icon-512.png
    icon-192.png
    apple-touch-icon.png
  README.md             # 使い方・技術メモ
```

追加したら **ルートの `index.html`(ランチャー)にカードを追加**し、**ルート `README.md` の表に行を追加**する。

## 3. カラー・ブランド

CSS変数(全ツール共通):

```css
:root {
  --bg: #0e0e11;      /* 背景 */
  --panel: #1c1c22;   /* パネル */
  --line: #33333c;    /* 罫線・ボーダー */
  --fg: #f2f2ee;      /* 文字 */
  --dim: #9a9aa4;     /* 補助文字 */
  --accent: #f7c114;  /* 8hammerイエロー(アクセント) */
}
```

- 基本はダークテーマ。アクセントは黄色1色に絞る(OK/NG系のみ緑 `#3ecf6e` / 赤 `#ff5a5a` を許可)
- アクセント背景のボタン文字色は `#17130a`
- **ロゴ**: カラーロゴ(横長、黄帯)をbase64 data URIで `<img>` 埋め込み。角丸をつけない。黄色背景の上にロゴを置かない(見えないため)
- **印刷用ロゴ**: 白黒反転版(黒帯に白文字)`PRINT_LOGO` を使う(storyboard/index.html にbase64あり)

## 4. タイポグラフィ・UI部品

- フォント: `-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif`
- ボタン: `border-radius: 9〜12px`、パネル色+`--line`枠。主要アクションのみ `.acc`(黄背景・太字)
- パネル: `background: var(--panel); border: 1px solid var(--line); border-radius: 10〜14px`
- トースト通知: 画面下中央、黄背景、2.6〜3.2秒で自動消滅(`#toast` パターン)
- 破壊的操作(削除など)は `confirm()` を挟み、文字色 `#ff8484`
- 入力欄は `-webkit-user-select: text` を明示(iOSでの選択問題対策)
- grid列にtextareaを置くときはセルに `min-width: 0` (固有幅で列がズレるのを防ぐ)

## 5. スマホ対応

- `viewport-fit=cover` + `env(safe-area-inset-*)` でノッチ回避
- ブレークポイントは `@media (max-width: 600〜700px)` を目安に1段階
- タップターゲットは最低 32×30px

## 6. PWA / Service Worker

- `sw.js` は cache-first + バックグラウンド更新(既存ツールからコピー)
- **`CACHE` 名は `"ツール名-vN"` とし、ツールに変更を入れたら必ずNを+1する**(これを忘れると利用者に更新が届かない)
- 外部APIを叩くツールは、SWの `fetch` ハンドラで `origin !== location.origin` をスキップ(roughcut/sw.js 参照)

## 7. アイコン

- 純Pythonの生成スクリプト(PIL不使用)で作る。scratchpadの `make_*_icon.py` 群がテンプレート(リポジトリ外。ベースは各ツールのアイコンから再現可能)
- 構図: ダーク地(22,22,27)+ツールのモチーフ+下部に黄帯ロゴ(幅84%、y=60%)
- 512 / 192 / 180(apple-touch-icon)の3サイズ

## 8. 印刷 / PDF(帳票系ツール)

- `@page { size: A4 portrait; margin: 12mm 12mm 14mm; }`
- ページはブラウザの自動改ページに任せず、**A4実寸で高さを計測して `.psheet`(1ページ=268mm)に明示的に割り付ける**(storyboard参照)
- 全ページにタイトルヘッダー+白黒ロゴ+表見出し、欄外にページ番号(`n / 総数`)と機密表記。**表紙には欄外表記を入れない**
- 機密表記: `CONFIDENTIAL / 社外秘 — 本資料の無断転載・複製・第三者への開示を禁じます ・ © 8hammer`
- 表は `width: calc(100% - 1mm)` (右罫線がページ端で切れる対策)
- 行は `break-inside: avoid`

## 9. ツール間連携(同一オリジンlocalStorage IPC)

| キー | 方向 | 内容 |
| --- | --- | --- |
| `storyboard.inbox.v1` | shot → storyboard | 送るカット(画像+情報)。storyboardが起動時に取り込んで削除 |
| `shot.request.v1` | storyboard → shot | 「このカットを3Dで作る」リクエスト。shotが起動時に処理 |
| `storyboard.v1` | storyboard本体 | boards/cuts/cols/colOrder/colNames |
| その他 | 各ツール | `ツール名.v1` 形式で統一 |

- 連携キーは**受信側が読んだら削除**(1回限りの受け渡し)
- スキーマを変えるときは後方互換の移行コードを入れる(storyboardの `fixBoard()` 参照)

## 10. AI機能(任意機能として)

- Claude API を**利用者自身のAPIキー**で直接叩く(`anthropic-dangerous-direct-browser-access: true`)
- キーはlocalStorageにのみ保存し、その旨と「共有PCでは注意」を明記
- 送信するデータの範囲(例: 文字起こしテキストのみ)を明記
- モデルは選択式: `claude-sonnet-5`(推奨)/ `claude-haiku-4-5-20251001` / `claude-opus-4-8`
- AI機能はオフライン時に本体機能を阻害しないこと

## 11. コード規約

- vanilla JS、`"use strict"`、`const $ = (id) => document.getElementById(id)`
- 状態は単一の `state` / `pref` オブジェクト+ `save()` でlocalStorageへ
- DOMは `createElement` で組む(innerHTMLへのユーザー入力混入禁止。textContentを使う)
- ID生成: `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)`
- 日本語UI。プレースホルダーに具体例を書く(「例: Aが振り返る。ドリーで寄り」)

## 12. テスト・リリース手順

1. Playwright(chromium: `/opt/pw-browsers/chromium`)で主要フローをE2E確認
   - 印刷は `window.print` をスタブして `#printView` をDOM検証+`page.pdf()` でページ数確認
   - ダイアログ(prompt/confirm)は `page.on('dialog')` で応答
2. sw.js のCACHEバージョンを上げたか確認
3. ランチャー/READMEへの反映(新ツール時)
4. コミット(日本語メッセージ)→ ブランチにpush → mainへff-onlyマージ(GitHub Pagesが自動反映)
