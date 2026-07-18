#!/bin/bash
# 8hammer Premiere MCPブリッジ インストール(Mac)
cd "$(dirname "$0")"

# 1) 未署名エクステンションの実行を許可(PlayerDebugMode)
for v in 9 10 11 12; do
  defaults write com.adobe.CSXS.$v PlayerDebugMode 1
done

# 2) ブリッジパネルをユーザーのCEPフォルダへコピー
DEST="$HOME/Library/Application Support/Adobe/CEP/extensions/com.8hammer.mcpbridge"
rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R com.8hammer.mcpbridge "$DEST"

echo ""
echo "パネルのインストール完了。次に MCPサーバを準備します:"
echo "  cd \"$(pwd)/mcp-server\" && npm install"
echo ""
echo "Premiere Proを再起動して"
echo "  ウィンドウ → エクステンション → 8hammer MCPブリッジ"
echo "を開くと、ローカル窓口が起動します。"
echo "そのあと Claude Code に接続設定を追加してください(README参照)。"
