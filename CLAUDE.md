# 8hammer Tools — 開発ルール(CLAUDE.md)

見た目のルール(色・タイポ・コンポーネント)は **`DESIGN.md`** を必ず参照。
このファイルは構成・運用・テストのルール。

## 基本方針

- **ビルド不要・単一HTML**: 各ツールは `ツール名/index.html` 1ファイル(例外: shot/ のThree.jsは `vendor/` に同梱)
- **オフラインファースト**: 外部CDN・外部フォント・外部API禁止。例外はAI機能のみ(なくても本体が成立すること)
- **データは端末内のみ**: localStorageに保存、外部送信しない(UIに明記)
- 日本語UI

## 1ツールの構成

```
toolname/
  index.html            # 本体(単一ファイル)
  manifest.webmanifest
  sw.js                 # cache-first
  icons/                # 512 / 192 / apple-touch-icon(180)
  README.md             # 使い方・技術メモ
```

新ツール追加時は **ルート `index.html`(ランチャー)にカード追加** + **ルート `README.md` の表に行追加**。

## Service Worker

- 既存ツールの `sw.js` をコピー(cache-first + バックグラウンド更新)
- **`CACHE` 名は `"ツール名-vN"`。ツールに変更を入れたら必ずNを+1**(忘れると利用者に更新が届かない)
- 外部APIを叩くツールは fetchハンドラで `origin !== location.origin` をスキップ(roughcut/sw.js 参照)

## アイコン

- 純Python(zlib/struct、PIL不使用)で生成。構図: ダーク地(22,22,27)+ツールのモチーフ+下部に黄帯ロゴ(幅84%・y=60%)
- ロゴ元画像はカラーロゴPNG(400×80 パレット形式)

## 印刷 / PDF(帳票系)

- `@page { size: A4 portrait; margin: 12mm 12mm 14mm; }`
- 自動改ページに任せず、**A4実寸で高さを計測して `.psheet`(1ページ=268mm・flex縦)に明示的に割り付け**(storyboard/index.html 参照)
- 全ページ: タイトルヘッダー+白黒ロゴ+表見出し。欄外にページ番号(`n / 総数`)と機密表記。**表紙には欄外表記なし**
- 機密表記: `CONFIDENTIAL / 社外秘 — 本資料の無断転載・複製・第三者への開示を禁じます ・ © 8hammer`
- 表は `width: calc(100% - 1mm)`(右罫線切れ対策)、行は `break-inside: avoid`

## ツール間連携(同一オリジンlocalStorage IPC)

| キー | 方向 | 内容 |
| --- | --- | --- |
| `storyboard.inbox.v1` | shot → storyboard | 送るカット。受信側が読んだら削除 |
| `shot.request.v1` | storyboard → shot | 3Dで作るリクエスト。受信側が読んだら削除 |
| `ツール名.v1` | 各ツール | 本体データ・設定 |

- スキーマ変更時は後方互換の移行コードを入れる(storyboardの `fixBoard()` 参照)

## AI機能(任意機能)

- Claude APIを**利用者自身のAPIキー**で直接叩く(ヘッダ `anthropic-dangerous-direct-browser-access: true`)
- キーはlocalStorage保存、その旨と「共有PCでは注意」を明記。送信データの範囲も明記
- モデル選択式: `claude-sonnet-5`(推奨)/ `claude-haiku-4-5-20251001` / `claude-opus-4-8`

## コード規約

- vanilla JS、`"use strict"`、`const $ = (id) => document.getElementById(id)`
- 状態は単一 `state`/`pref` + `save()` でlocalStorage
- ID生成: `Date.now().toString(36) + Math.random().toString(36).slice(2, 7)`
- DOMは `createElement` + `textContent`(innerHTMLへのユーザー入力混入禁止)

## テスト・リリース手順

1. Playwright(chromium: `/opt/pw-browsers/chromium`、import: `/opt/node22/lib/node_modules/playwright/index.mjs`)で主要フローをE2E確認
   - `python3 -m http.server` でルートを配信(ポート8641–8650)
   - 印刷は `window.print` をスタブして `#printView` をDOM検証 + `page.pdf()` でページ数確認
   - prompt/confirm は `page.on('dialog')` で応答
2. sw.js の CACHE バージョンを上げたか確認
3. 新ツール時: ランチャー・README反映
4. コミット(日本語メッセージ)→ `claude/scene-memo-ipad-app-hq3er6` にpush → mainへff-onlyマージ(GitHub Pagesが自動反映)
