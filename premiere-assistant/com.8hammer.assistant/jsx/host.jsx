/* 8hammer AI編集アシスタント — Premiere側スクリプト(ExtendScript)
   パネル(index.html)から evalScript で呼ばれる。Claudeのtool useが
   これらの関数にマッピングされ、Premiereのプロジェクト/シーケンスを操作する。
   すべての関数は JSON文字列 を返す(成功: 任意のキー / 失敗: {"err":"..."})。 */

var paTICKS = 254016000000; // 1秒あたりのticks

/* ---------- JSON(ExtendScriptはES3でJSON非搭載のため最小実装) ---------- */
function paQuote(s) {
  s = String(s);
  var out = '"';
  for (var i = 0; i < s.length; i++) {
    var c = s.charAt(i), code = s.charCodeAt(i);
    if (c === '"') out += '\\"';
    else if (c === '\\') out += '\\\\';
    else if (c === '\n') out += '\\n';
    else if (c === '\r') out += '\\r';
    else if (c === '\t') out += '\\t';
    else if (code < 0x20) out += '\\u' + ('0000' + code.toString(16)).slice(-4);
    else out += c;
  }
  return out + '"';
}
function paStr(v) {
  if (v === null || v === undefined) return "null";
  var t = typeof v;
  if (t === "number") return isFinite(v) ? String(v) : "null";
  if (t === "boolean") return v ? "true" : "false";
  if (t === "string") return paQuote(v);
  if (v instanceof Array) {
    var a = [];
    for (var i = 0; i < v.length; i++) a.push(paStr(v[i]));
    return "[" + a.join(",") + "]";
  }
  var o = [];
  for (var k in v) if (v.hasOwnProperty(k)) o.push(paQuote(k) + ":" + paStr(v[k]));
  return "{" + o.join(",") + "}";
}
function paOk(obj) { return paStr(obj); }
function paErr(msg) { return paStr({ err: String(msg) }); }

/* ---------- 共通ヘルパー ---------- */
function paSec(tm) {
  if (tm === undefined || tm === null) return 0;
  try { if (typeof tm.seconds === "number") return tm.seconds; } catch (e) {}
  try { return parseFloat(tm.ticks) / paTICKS; } catch (e2) {}
  try { return parseFloat(String(tm)) / paTICKS; } catch (e3) {}
  return 0;
}
function paRound(n) { return Math.round(n * 1000) / 1000; }

function paItemType(it) {
  try {
    if (it.type === ProjectItemType.BIN) return "bin";
    if (it.type === ProjectItemType.CLIP) return "clip";
    if (it.type === ProjectItemType.FILE) return "file";
    if (it.type === ProjectItemType.ROOT) return "root";
  } catch (e) {}
  return "other";
}

function paFindByNodeId(root, nodeId) {
  for (var i = 0; i < root.children.numItems; i++) {
    var ch = root.children[i];
    if (ch.nodeId === nodeId) return ch;
    var isBin = false;
    try { isBin = (ch.type === ProjectItemType.BIN); } catch (e) { isBin = false; }
    if (isBin) {
      var f = paFindByNodeId(ch, nodeId);
      if (f) return f;
    }
  }
  return null;
}

/* rootItem配下を再帰的に走査してメディア素材を集める(bin構造はpathで表現) */
function paCollectItems(node, prefix, out, limit) {
  for (var i = 0; i < node.children.numItems; i++) {
    if (out.length >= limit) return;
    var ch = node.children[i];
    var kind = paItemType(ch);
    if (kind === "bin") {
      paCollectItems(ch, prefix + ch.name + "/", out, limit);
    } else {
      var mediaPath = "";
      try { mediaPath = ch.getMediaPath(); } catch (e) { mediaPath = ""; }
      out.push({
        nodeId: ch.nodeId,
        name: ch.name,
        bin: prefix.length ? prefix.slice(0, -1) : "",
        kind: kind,
        hasMedia: mediaPath ? true : false
      });
    }
  }
}

/* videoTracks / audioTracks から名前で該当トラックを取得。"V1"/"A2" など。 */
function paResolveTrack(seq, spec) {
  spec = String(spec || "V1").toUpperCase();
  var kind = spec.charAt(0);
  var idx = parseInt(spec.slice(1), 10);
  if (isNaN(idx) || idx < 1) idx = 1;
  if (kind === "A") {
    if (idx > seq.audioTracks.numTracks) return null;
    return seq.audioTracks[idx - 1];
  }
  if (idx > seq.videoTracks.numTracks) return null;
  return seq.videoTracks[idx - 1];
}

/* ==================== ツール本体 ==================== */

/* プロジェクト全体の概観 */
function paGetOverview() {
  try {
    var proj = app.project;
    var active = null;
    try { active = proj.activeSequence ? proj.activeSequence.name : null; } catch (e) { active = null; }

    var seqs = [];
    try {
      for (var i = 0; i < proj.sequences.numSequences; i++) {
        var sq = proj.sequences[i];
        seqs.push({ name: sq.name, active: (active !== null && sq.name === active) });
      }
    } catch (es) {}

    var items = [];
    paCollectItems(proj.rootItem, "", items, 300);

    return paOk({ project: proj.name, activeSequence: active, sequences: seqs, itemCount: items.length, items: items });
  } catch (e) {
    return paErr(e);
  }
}

/* アクティブシーケンスの内容(トラック・クリップ・再生ヘッド) */
function paGetSequence() {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return paErr("アクティブなシーケンスがありません。シーケンスを1つ開いてください。");

    var fps = null;
    try {
      var st = seq.getSettings();
      if (st && st.videoFrameRate) fps = paRound(paTICKS / parseFloat(st.videoFrameRate.ticks));
    } catch (ef) {}

    var tracks = [];
    function grabTracks(coll, label) {
      for (var ti = 0; ti < coll.numTracks; ti++) {
        var tr = coll[ti];
        var clips = [];
        try {
          for (var ci = 0; ci < tr.clips.numItems && clips.length < 200; ci++) {
            var cl = tr.clips[ci];
            clips.push({
              name: cl.name,
              start: paRound(paSec(cl.start)),
              end: paRound(paSec(cl.end)),
              inPoint: paRound(paSec(cl.inPoint)),
              outPoint: paRound(paSec(cl.outPoint))
            });
          }
        } catch (ec) {}
        tracks.push({ track: label + (ti + 1), locked: (tr.isLocked ? tr.isLocked() : false), clipCount: clips.length, clips: clips });
      }
    }
    grabTracks(seq.videoTracks, "V");
    grabTracks(seq.audioTracks, "A");

    var playhead = 0;
    try { playhead = paRound(paSec(seq.getPlayerPosition())); } catch (ep) {}

    var end = 0;
    try { end = paRound(paSec(seq.end)); } catch (ee) {}

    return paOk({ name: seq.name, fps: fps, durationSeconds: end, playheadSeconds: playhead, tracks: tracks });
  } catch (e) {
    return paErr(e);
  }
}

/* プロジェクトパネルで選択中の素材 */
function paGetSelection() {
  try {
    if (!app.getCurrentProjectViewSelection) {
      return paErr("このPremiereバージョンは選択の取得に未対応です(v13以降が必要)");
    }
    var sel = app.getCurrentProjectViewSelection();
    if (!sel || !sel.length) return paOk({ items: [] });
    var parts = [];
    for (var i = 0; i < sel.length; i++) {
      var it = sel[i];
      var p = "";
      try { p = it.getMediaPath(); } catch (e) { p = ""; }
      parts.push({ nodeId: it.nodeId, name: it.name, kind: paItemType(it), hasMedia: p ? true : false });
    }
    return paOk({ items: parts });
  } catch (e) {
    return paErr(e);
  }
}

/* 新規シーケンス作成(空) */
function paCreateSequence(name) {
  try {
    name = name || "sequence";
    var proj = app.project;
    proj.createNewSequence(name, "pa" + Math.round(Math.random() * 1e9));
    var seq = proj.activeSequence;
    if (!seq) return paErr("シーケンスを作成できませんでした");
    return paOk({ ok: true, name: seq.name });
  } catch (e) {
    return paErr(e);
  }
}

/* クリップをアクティブシーケンスに配置
   json: {"nodeId":"...","track":"V1","atSeconds":0,"inSeconds":?,"outSeconds":?,"mode":"insert"|"overwrite"} */
function paPlaceClip(json) {
  try {
    var d = eval("(" + json + ")"); // 入力は自前パネル経由
    var proj = app.project;
    var seq = proj.activeSequence;
    if (!seq) return paErr("アクティブなシーケンスがありません。先にシーケンスを開くかcreate_sequenceで作成してください。");

    var item = paFindByNodeId(proj.rootItem, d.nodeId);
    if (!item) return paErr("指定のnodeIdの素材が見つかりません: " + d.nodeId);

    var track = paResolveTrack(seq, d.track);
    if (!track) return paErr("トラックが見つかりません: " + (d.track || "V1"));

    var hasIn = (typeof d.inSeconds === "number");
    var hasOut = (typeof d.outSeconds === "number");
    try {
      if (hasIn) item.setInPoint(d.inSeconds, 4);
      if (hasOut) item.setOutPoint(d.outSeconds, 4);
      if (!hasIn && !hasOut) { item.clearInPoint(4); item.clearOutPoint(4); }
    } catch (ei) {}

    var at = (typeof d.atSeconds === "number") ? d.atSeconds : 0;
    var mode = (d.mode === "overwrite") ? "overwrite" : "insert";
    var placed = false;
    try {
      if (mode === "overwrite") track.overwriteClip(item, at);
      else track.insertClip(item, at);
      placed = true;
    } catch (ep) {
      return paErr("配置に失敗しました(トラックのロック解除を確認): " + ep);
    }
    try { item.clearInPoint(4); item.clearOutPoint(4); } catch (ec) {}

    return paOk({ ok: placed, track: d.track || "V1", atSeconds: at, mode: mode });
  } catch (e) {
    return paErr(e);
  }
}

/* シーケンスマーカーを追加
   json: {"atSeconds":0,"name":"...","comment":"...","durationSeconds":?} */
function paAddMarker(json) {
  try {
    var d = eval("(" + json + ")");
    var seq = app.project.activeSequence;
    if (!seq) return paErr("アクティブなシーケンスがありません。");
    var at = (typeof d.atSeconds === "number") ? d.atSeconds : 0;
    var m = seq.markers.createMarker(at);
    try { if (d.name) m.name = String(d.name); } catch (en) {}
    try { if (d.comment) m.comments = String(d.comment); } catch (ec) {}
    try { if (typeof d.durationSeconds === "number" && d.durationSeconds > 0) m.end = at + d.durationSeconds; } catch (ed) {}
    return paOk({ ok: true, atSeconds: at, name: d.name || "" });
  } catch (e) {
    return paErr(e);
  }
}

/* 再生ヘッドを移動 */
function paSetPlayhead(sec) {
  try {
    var seq = app.project.activeSequence;
    if (!seq) return paErr("アクティブなシーケンスがありません。");
    var s = parseFloat(sec);
    if (isNaN(s) || s < 0) s = 0;
    var ticks = Math.round(s * paTICKS);
    seq.setPlayerPosition(String(ticks));
    return paOk({ ok: true, seconds: paRound(s) });
  } catch (e) {
    return paErr(e);
  }
}

/* メディアをインポート
   json: {"paths":["/abs/path.mov", ...]} */
function paImport(json) {
  try {
    var d = eval("(" + json + ")");
    var paths = d.paths || [];
    if (!paths.length) return paErr("インポートするファイルパスがありません(絶対パスで指定)");
    var proj = app.project;
    var ok = proj.importFiles(paths, true, proj.rootItem, false);
    return paOk({ ok: ok ? true : false, requested: paths.length });
  } catch (e) {
    return paErr(e);
  }
}
