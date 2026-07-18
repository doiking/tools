#!/usr/bin/env node
/*
 * 8hammer Premiere MCP server
 *
 * Claude Code(または任意のMCPクライアント)に Premiere Pro 操作ツールを提供する。
 * 各ツール呼び出しは、Premiere内で動く CEPブリッジパネル(localhost)へ中継される。
 *
 * 接続先: http://127.0.0.1:<PORT>/call   (既定 PORT=8722)
 * 認証:   x-8h-token ヘッダ                (既定 TOKEN="8hammer-local")
 *
 * 環境変数で上書き可:
 *   PREMIERE_BRIDGE_PORT   (既定 8722)
 *   PREMIERE_BRIDGE_HOST   (既定 127.0.0.1)
 *   PREMIERE_BRIDGE_TOKEN  (既定 "8hammer-local")
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const HOST = process.env.PREMIERE_BRIDGE_HOST || "127.0.0.1";
const PORT = process.env.PREMIERE_BRIDGE_PORT || "8722";
const TOKEN = process.env.PREMIERE_BRIDGE_TOKEN ?? "8hammer-local";
const ENDPOINT = `http://${HOST}:${PORT}/call`;

/* CEPブリッジへ1呼び出しを中継。結果はhost.jsxのJSON文字列(または{err}) */
async function callBridge(fn, args) {
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-8h-token": TOKEN },
      body: JSON.stringify({ fn, args: args || {} }),
    });
  } catch (e) {
    return {
      isError: true,
      text: `Premiereブリッジに接続できません(${ENDPOINT})。Premiereで「ウィンドウ → エクステンション → 8hammer MCPブリッジ」を開き、起動中になっているか確認してください。詳細: ${e.message}`,
    };
  }
  const text = await res.text();
  if (!res.ok) return { isError: true, text: `ブリッジエラー ${res.status}: ${text}` };
  let bad = false;
  try { bad = !!JSON.parse(text).err; } catch (_) {}
  return { isError: bad, text };
}

function reply(r) {
  return { content: [{ type: "text", text: r.text }], isError: r.isError || false };
}

const server = new McpServer({ name: "premiere", version: "1.0.0" });

server.registerTool(
  "get_project_overview",
  {
    description:
      "現在開いているPremiereプロジェクトの概観を取得する。プロジェクト名・シーケンス一覧・プロジェクトパネル内の素材(nodeId/名前/bin/メディア有無)を返す。素材を配置する前に必ず呼んでnodeIdを確認すること。",
    inputSchema: {},
  },
  async () => reply(await callBridge("get_project_overview"))
);

server.registerTool(
  "get_active_sequence",
  {
    description:
      "アクティブなシーケンスの詳細(名前・fps・尺・再生ヘッド位置・各トラックのクリップと時間、秒単位)を取得する。タイムラインの現状把握に使う。",
    inputSchema: {},
  },
  async () => reply(await callBridge("get_active_sequence"))
);

server.registerTool(
  "get_selection",
  {
    description:
      "プロジェクトパネルで現在選択中の素材(nodeId/名前)を取得する。「選択中の素材」を対象にする指示のときに使う。",
    inputSchema: {},
  },
  async () => reply(await callBridge("get_selection"))
);

server.registerTool(
  "create_sequence",
  {
    description: "新しい空のシーケンスを作成し、それをアクティブにする。",
    inputSchema: { name: z.string().describe("シーケンス名") },
  },
  async ({ name }) => reply(await callBridge("create_sequence", { name }))
);

server.registerTool(
  "place_clip",
  {
    description:
      "プロジェクト素材をアクティブシーケンスのトラックに配置する。nodeIdはget_project_overview/get_selectionで取得する。inSeconds/outSecondsで素材のイン点・アウト点(秒)を指定でき、省略時は素材全体。",
    inputSchema: {
      nodeId: z.string().describe("配置する素材のnodeId"),
      track: z.string().optional().describe('トラック指定。"V1"(映像1)や"A1"(音声1)など。既定V1'),
      atSeconds: z.number().optional().describe("配置先の開始位置(秒)。既定0"),
      inSeconds: z.number().optional().describe("素材のイン点(秒、任意)"),
      outSeconds: z.number().optional().describe("素材のアウト点(秒、任意)"),
      mode: z.enum(["insert", "overwrite"]).optional().describe("insert=挿入(後続をずらす)/overwrite=上書き。既定insert"),
    },
  },
  async (args) => reply(await callBridge("place_clip", args))
);

server.registerTool(
  "add_marker",
  {
    description: "アクティブシーケンスの指定位置(秒)にマーカーを追加する。名前・コメント・長さを任意で付けられる。",
    inputSchema: {
      atSeconds: z.number().describe("マーカー位置(秒)"),
      name: z.string().optional().describe("マーカー名(任意)"),
      comment: z.string().optional().describe("コメント(任意)"),
      durationSeconds: z.number().optional().describe("デュレーション秒(任意、範囲マーカー)"),
    },
  },
  async (args) => reply(await callBridge("add_marker", args))
);

server.registerTool(
  "set_playhead",
  {
    description: "アクティブシーケンスの再生ヘッドを指定秒に移動する。",
    inputSchema: { seconds: z.number().describe("移動先(秒)") },
  },
  async ({ seconds }) => reply(await callBridge("set_playhead", { seconds }))
);

server.registerTool(
  "import_files",
  {
    description: "絶対パスで指定したメディアファイルをプロジェクトにインポートする。パスが分かっている場合のみ使う。",
    inputSchema: { paths: z.array(z.string()).describe("絶対パスの配列") },
  },
  async ({ paths }) => reply(await callBridge("import_files", { paths }))
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[premiere-mcp] ready → bridge ${ENDPOINT}`);
