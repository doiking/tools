#!/bin/bash
# 8hammer AI編集アシスタント Premiereパネル インストール(Mac)
cd "$(dirname "$0")"

# 1) 未署名エクステンションの実行を許可(PlayerDebugMode)
for v in 9 10 11 12; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done

# 2) エクステンションをユーザーのCEPフォルダへコピー
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.8hammer.assistant"
rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R com.8hammer.assistant "$DEST"

echo ""
echo "インストール完了。Premiere Proを再起動して"
echo "  ウィンドウ → エクステンション → 8hammer AI編集アシスタント"
echo "から開いてください。"
