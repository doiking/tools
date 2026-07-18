@echo off
rem 8hammer Premiere MCPブリッジ インストール(Windows)
rem 1) 未署名エクステンションの実行を許可(PlayerDebugMode)
for %%v in (9 10 11 12) do reg add HKCU\SOFTWARE\Adobe\CSXS.%%v /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

rem 2) ブリッジパネルをユーザーのCEPフォルダへコピー
set DEST=%APPDATA%\Adobe\CEP\extensions\com.8hammer.mcpbridge
if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy /e /i /y "%~dp0com.8hammer.mcpbridge" "%DEST%" >nul

echo.
echo パネルのインストール完了。次に MCPサーバを準備します:
echo   cd "%~dp0mcp-server" ^&^& npm install
echo.
echo Premiere Proを再起動して
echo   ウィンドウ → エクステンション → 8hammer MCPブリッジ
echo を開くと、ローカル窓口が起動します。
echo そのあと Claude Code に接続設定を追加してください(README参照)。
pause
