@echo off
rem 8hammer AI編集アシスタント Premiereパネル インストール(Windows)
rem 1) 未署名エクステンションの実行を許可(PlayerDebugMode)
for %%v in (9 10 11 12) do reg add HKCU\SOFTWARE\Adobe\CSXS.%%v /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

rem 2) エクステンションをユーザーのCEPフォルダへコピー
set DEST=%APPDATA%\Adobe\CEP\extensions\com.8hammer.assistant
if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy /e /i /y "%~dp0com.8hammer.assistant" "%DEST%" >nul

echo.
echo インストール完了。Premiere Proを再起動して
echo   ウィンドウ → エクステンション → 8hammer AI編集アシスタント
echo から開いてください。
pause
