# 8hammer Tools 🔨

撮影現場・制作業務用の社内ツール集。すべて **ビルド不要・単一HTML+PWA・オフライン動作対応** です。
GitHub Pages で公開すると `index.html` がランチャーページになります。

| ツール | 内容 |
| --- | --- |
| [scene-memo](scene-memo/) 🎬 | カチンコ風シーンメモ。S/C/T記録、OK/NG判定、CSV書き出し |
| [prompter](prompter/) 📜 | テレプロンプター。自動スクロール、ミラー反転、リモコン対応 |
| [sun](sun/) 🌅 | 日の出・日の入・マジックアワー計算。方角表示、タイムライン |
| [lens](lens/) 🔍 | レンズ画角シミュレーター。画角・撮影範囲・被写界深度 |
| [bitrate](bitrate/) 📶 | 配信ビットレート計算機。推奨設定・必要回線・逆引き判定 |
| [shot](shot/) 🎥 | ショットデザイナー。マネキン・カメラ配置でカットの構図づくり |
| [storyboard](storyboard/) 🎞 | 絵コンテ作成。ショットデザイナー連携・印刷/PDF出力 |

## 使い方

1. GitHub Pages(Settings → Pages → `main` / root)で公開
2. iPadやスマホのSafariで開き、各ツールを「ホーム画面に追加」
3. 以降はオフラインでも動作します

データはすべて端末内(localStorage)にのみ保存され、外部送信はありません。
