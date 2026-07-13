# 8hammer AI粗編 — Premiere Pro パネル版 ✂️

[Web版](../roughcut/) と同じ無音検出エンジンを **Premiere Proのパネル** にしたものです。
プロジェクトパネルで素材を選んで解析 → **XML書き出しも再リンクも無しで、シーケンスに直接粗編を並べます。**

## インストール(1台につき1回)

### Mac
1. このフォルダ(`roughcut-premiere`)をダウンロード
2. `install-mac.command` をダブルクリック
   - 「開発元を確認できない」と出たら: 右クリック → 開く。それでもだめなら ターミナルで `bash install-mac.command`
3. Premiere Pro を再起動

### Windows
1. このフォルダ(`roughcut-premiere`)をダウンロード
2. `install-win.bat` をダブルクリック
3. Premiere Pro を再起動

どちらも中身は「未署名エクステンションの許可(PlayerDebugMode)」と「`com.8hammer.roughcut` フォルダを AdobeのCEP拡張フォルダへコピー」の2つだけです。手動でも同じことができます:

- Mac: `~/Library/Application Support/Adobe/CEP/extensions/`
- Win: `%APPDATA%\Adobe\CEP\extensions\`

## 使い方

1. Premiere Pro → **ウィンドウ → エクステンション → 8hammer AI粗編**
2. プロジェクトパネルで素材を選択(10〜20素材まとめてOK)
3. パネルの「**選択中の素材を解析**」→ 波形とセグメントが出る
4. しきい値などを調整、いらないセグメントはタップで除外、▶で試聴
5. 「**粗編をシーケンスに並べる**」
   - アクティブなシーケンスがあれば末尾に追加、無ければ新規作成
   - 素材と同じ設定で編集したい場合は、先にそのシーケンスを開いておくのがおすすめ

AI選抜(β)もWeb版と同じように使えます(文字起こし+指示 → 残す区間を自動選抜)。

## うまく動かないとき

| 症状 | 対処 |
| --- | --- |
| メニューにパネルが出ない | Premiereを完全に再起動。インストーラを再実行(PlayerDebugModeの設定を確認) |
| 「選択の取得に未対応」 | Premiere Pro 13(2019)以降が必要です |
| 素材の解析に失敗する | ProRes/MXF等はブラウザエンジンでデコードできません。H.264/H.265のMOV/MP4、WAV、MP3は対応。非対応素材は当面Web版+プロキシ(H.264)でご利用ください |
| クリップを配置できない | V1/A1トラックのロックを解除。シーケンスを1つ開いた状態で実行 |
| パネルが真っ白 | `%APPDATA%\Adobe\CEP\extensions\com.8hammer.roughcut`(Macは `~/Library/Application Support/Adobe/CEP/extensions/`)に `index.html` があるか確認 |

## 技術メモ

- CEP エクステンション(HTML/JS + ExtendScript)。ビルド不要
- 解析(RMS無音検出)はWeb版 `roughcut/` と同一ロジック
- シーケンスへの配置は `projectItem.setInPoint/setOutPoint` + `track.insertClip` で行い、配置後にイン/アウトを解除します
- 社外配布する場合は ZXPSignCmd で自己署名パッケージ(.zxp)にしてください(社内利用はこのままでOK)
