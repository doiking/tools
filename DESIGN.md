# 8hammer Tools — DESIGN.md

Design system for AI coding agents. Drop-in reference for building UI in this repo
(format: Google Stitch DESIGN.md, 9 sections).
運用ルール(PWA/SW・連携・テスト手順)は `CLAUDE.md` を参照。

---

## 1. Visual Theme & Atmosphere

- **性格**: 撮影現場・配信現場で使う実務ツール。装飾より視認性と即応性。「プロの道具箱」
- **トーン**: ダーク固定(ライトテーマなし)。現場・暗所での使用を想定し、まぶしい面を作らない
- **密度**: 中密度。1画面1目的。情報はパネル単位に分け、余白は詰めすぎない
- **アクセント哲学**: 黄色(ブランドカラー)は「今いちばん大事なもの」1〜2箇所だけ。画面が黄色だらけになったら失敗
- **質感**: フラット。影・グラデーション・ガラス表現は使わない。階層は背景色の明度差と1pxの罫線で作る

## 2. Color Palette & Roles

| トークン | HEX | 役割 |
| --- | --- | --- |
| `--bg` | `#0e0e11` | ページ背景(最下層) |
| `--panel` | `#1c1c22` | パネル・カード・ボタン地 |
| `--input` | `#16161b` | 入力欄の地(パネルより一段沈む) |
| `--chip` | `#24242c` | チップ・小ボタンの地(パネルより一段浮く) |
| `--line` | `#33333c` | 枠線・区切り(標準) |
| `--line-subtle` | `#26262c` | パネル内部の区切り(弱) |
| `--fg` | `#f2f2ee` | 本文テキスト |
| `--dim` | `#9a9aa4` | 補助テキスト・ラベル・プレースホルダー |
| `--accent` | `#f7c114` | 8hammerイエロー。主要アクション・選択中・強調数値 |
| `--accent-ink` | `#17130a` | 黄色地の上に置く文字色(黒に近い茶) |
| `--ok` | `#3ecf6e` | 成功・OK判定のみ |
| `--ng` | `#ff5a5a` | エラー・NG判定のみ |
| `--danger-text` | `#ff8484` | 破壊的操作のボタン文字 |

- 黄色の上の文字は必ず `--accent-ink`。白文字を置かない
- 緑・赤は状態表示専用。装飾に使わない
- **ロゴ**: カラーロゴ(黒地に黄帯)をbase64で埋め込み。**角丸をつけない・黄色背景の上に置かない**。印刷は白黒反転版(黒帯・白文字)

## 3. Typography Rules

- フォント: `-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif`(システムフォントのみ。Webフォント禁止=オフライン動作のため)

| 用途 | サイズ | ウェイト | 色 |
| --- | --- | --- | --- |
| ツールタイトル(ページ内) | 17px | 700 | fg |
| ランチャー見出し | 24px | 800 | fg |
| 本文・入力 | 13.5–14px | 400 | fg |
| ボタン | 13.5–14px | 600–700 | fg / accent-ink |
| 強調数値(合計秒数・結果) | 15–17px | 700–800 | accent |
| セクションラベル | 11–12px + `letter-spacing: .08em` | 400 | dim |
| 補足・注記 | 11–12.5px, `line-height: 1.7–1.8` | 400 | dim |

- タイムコード・数値の列は `font-variant-numeric: tabular-nums`
- 見出しは大文字化しない(日本語UI)。ラベルは字間を広げて小さく

## 4. Component Stylings

- **ボタン(標準)**: `background: var(--panel); border: 1px solid var(--line); border-radius: 9–12px; padding: 9px 12px;` ホバー/アクティブで `border-color: var(--accent)`
- **ボタン(主要 `.acc`)**: `background: var(--accent); color: var(--accent-ink); font-weight: 700–800;` 1画面に1〜2個まで
- **ボタン(破壊的 `.danger`)**: 標準の形で文字色 `--danger-text`。実行前に必ず `confirm()`
- **パネル**: `background: var(--panel); border: 1px solid var(--line); border-radius: 10–14px; padding: 10–14px;` 先頭に `.ptitle`(セクションラベル)
- **入力・textarea**: `background: var(--input); border: 1px solid var(--line); border-radius: 7–10px;` フォーカスで `outline: none; border-color: var(--accent);` `-webkit-user-select: text` を明示
- **チップ(選択可能な小要素)**: `background: var(--chip); border-radius: 7–8px; font-size: 11.5–12.5px;` 選択中は `border-color/color: var(--accent)`。無効は `opacity: .38` + 打ち消し線
- **リストの選択中項目**: チップと同じ**黄枠**(`border: 1px solid var(--accent)` + 地を一段明るく)。
  左端のアクセントバー(inset shadow)方式は使わない
- **スライダー**: ネイティブ `input[type=range]` + `accent-color: var(--accent)`
- **追加ボタン(リスト末尾)**: `border: 2px dashed var(--line);` 地は透明、アクティブで黄色
- **トースト**: 画面下中央固定、黄背景・accent-ink文字、radius 12px、2.6–3.2秒で自動消滅
- **ダイアログ**: ネイティブ `prompt()/confirm()` を使う(自作モーダルは作らない)

## 5. Layout Principles

- ページ余白: `padding: calc(10px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) …`(セーフエリア必須)
- コンテンツ幅: 表・リスト系はブラウザ幅いっぱい。文章系は max-width 860–980px 中央寄せ
- 間隔スケール: 4 / 6 / 8 / 10 / 12 / 14px。パネル間 gap は 10–14px
- ツールバー: 上部に flex + wrap で1行(ロゴ→タイトル→操作→スペーサー→集計/主要ボタン)
- 表形式は CSS Grid + `--sbcols` 変数で列定義を一元化(ヘッダ行とデータ行が同じ変数を参照)
- **grid列にtextareaを置くセルは `min-width: 0`**(固有幅で列がズレる)

## 6. Depth & Elevation

- 影は使わない。階層は背景明度: `--bg`(最下)→ `--panel` → `--chip`(最上)、沈める時は `--input`
- 境界は1px罫線(`--line` / `--line-subtle`)。強調は罫線を黄色に
- 重なり要素(トースト・メニュー)は `z-index: 20` 前後 + 単色地。ぼかし・半透明背景は最小限

## 7. Do's and Don'ts

**Do**
- 黄色は「選択中・主要アクション・重要数値」だけに使う
- 破壊的操作は confirm + 赤文字
- 具体例入りプレースホルダー(「例: Aが振り返る。ドリーで寄り」)
- データが端末外に出ないことをUIに明記
- DOMは `createElement` + `textContent` で組む

**Don't**
- ロゴに角丸・黄色背景の上にロゴ
- 外部CDN・Webフォント・外部画像(オフライン動作が壊れる)
- 立体感を出す影・装飾グラデーション・ガラス表現
  (機能的なものは可: 文字可読性のためのスクリム、カチンコ縞などのモチーフ表現)
- 選択中を示す左端のアクセントバー(`box-shadow: inset 3px 0 0`)— 黄枠方式に統一
- ライトテーマ・テーマ切替
- 黄色地に白文字 / 3色以上のアクセント
- innerHTMLへのユーザー入力混入

## 8. Responsive Behavior

- ブレークポイントは1段階: `@media (max-width: 600–700px)`
- スマホでは: 表のヘッダ行を隠し各セルに `.lbl` ラベルを表示 / 複数列grid → 1列 / ツールバーはコンパクト化
- タップターゲット最低 32×30px、`touch-action: manipulation`、`-webkit-tap-highlight-color: transparent`
- 3D・キャンバス系はタッチジェスチャ(ドラッグ・ピンチ)を必ず併設
- 印刷/PDF(帳票系)はA4縦固定。実装ルールは `CLAUDE.md` 参照

## 9. Agent Prompt Guide

新しいUIを作るときの指定例:

> 8hammer Toolsのデザインで。ダーク(#0e0e11地・#1c1c22パネル)、アクセントは#f7c114を選択中と主要ボタンだけ、
> システムフォント、フラット(影なし・1px罫線)、単一HTML・オフライン動作、iPadタッチ対応。
> 主要アクションは黄色ボタン1個、破壊的操作はconfirm+赤文字。

色の指示は必ずトークン名(`--accent` 等)で。新しい色を足す前に既存トークンで表現できないか検討すること。
実装・テスト・リリースの手順は `CLAUDE.md` に従う。
