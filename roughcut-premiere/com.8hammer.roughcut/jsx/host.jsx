/* 8hammer AI粗編 — Premiere側スクリプト(ExtendScript)
   パネル(index.html)から evalScript で呼ばれる。 */

var rcTICKS = 254016000000; // 1秒あたりのticks

function rcEsc(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, " ");
}

/* プロジェクトパネルで選択中の素材 → JSON文字列 */
function rcGetSelection() {
  try {
    if (!app.getCurrentProjectViewSelection) {
      return '{"err":"このPremiereバージョンは選択の取得に未対応です(v13以降が必要)"}';
    }
    var sel = app.getCurrentProjectViewSelection();
    if (!sel || !sel.length) {
      return '{"err":"プロジェクトパネルで素材を選択してから押してください"}';
    }
    var parts = [];
    for (var i = 0; i < sel.length; i++) {
      var it = sel[i];
      var p = "";
      try { p = it.getMediaPath(); } catch (e) { p = ""; }
      if (!p) continue; // ビン・シーケンス等はスキップ
      parts.push('{"nodeId":"' + rcEsc(it.nodeId) + '","name":"' + rcEsc(it.name) + '","path":"' + rcEsc(p) + '"}');
    }
    if (!parts.length) {
      return '{"err":"メディアファイルを持つ素材が選択されていません(ビン・シーケンスは対象外)"}';
    }
    return '{"items":[' + parts.join(",") + ']}';
  } catch (e) {
    return '{"err":"' + rcEsc(e) + '"}';
  }
}

function rcFindByNodeId(root, nodeId) {
  for (var i = 0; i < root.children.numItems; i++) {
    var ch = root.children[i];
    if (ch.nodeId === nodeId) return ch;
    var isBin = false;
    try { isBin = (ch.type === ProjectItemType.BIN); } catch (e) { isBin = false; }
    if (isBin) {
      var f = rcFindByNodeId(ch, nodeId);
      if (f) return f;
    }
  }
  return null;
}

/* 粗編をシーケンスに並べる。
   json: {"name":"...", "items":[{"nodeId":"...", "segs":[[inSec,outSec],...]}, ...]}
   アクティブシーケンスがあればその末尾に、無ければ新規シーケンスを作って先頭から。 */
function rcBuild(json) {
  try {
    var data = eval("(" + json + ")"); // パネル(自前UI)からの入力のみ
    var proj = app.project;
    var seq = proj.activeSequence;
    var created = false;
    if (!seq) {
      try { proj.createNewSequence(data.name || "roughcut", "rc" + Math.round(Math.random() * 1e9)); } catch (e1) {}
      seq = proj.activeSequence;
      created = true;
    }
    if (!seq) {
      return '{"err":"シーケンスを作成できませんでした。先に(素材と同じ設定の)シーケンスを1つ作って開いた状態で実行してください"}';
    }
    var t = 0;
    if (!created) {
      try { t = parseFloat(seq.end) / rcTICKS; } catch (e2) { t = 0; }
      if (isNaN(t) || t < 0) t = 0;
    }
    var placed = 0, missing = 0;
    for (var i = 0; i < data.items.length; i++) {
      var item = rcFindByNodeId(proj.rootItem, data.items[i].nodeId);
      if (!item) { missing++; continue; }
      var segs = data.items[i].segs;
      for (var j = 0; j < segs.length; j++) {
        var s = segs[j][0], e = segs[j][1];
        if (!(e > s)) continue;
        try {
          item.setInPoint(s, 4);   // 4 = video+audio
          item.setOutPoint(e, 4);
          var ok = false;
          try { seq.videoTracks[0].insertClip(item, t); ok = true; }
          catch (ev) {
            try { seq.audioTracks[0].insertClip(item, t); ok = true; } catch (ea) {}
          }
          if (ok) { t += (e - s); placed++; }
        } catch (es) {}
      }
      try { item.clearInPoint(4); item.clearOutPoint(4); } catch (ec) {}
    }
    if (!placed) {
      return '{"err":"クリップを配置できませんでした(トラック1がロックされていないか確認してください)"}';
    }
    return '{"ok":' + placed + ',"seq":"' + rcEsc(seq.name) + '","created":' + (created ? "true" : "false") + (missing ? ',"missing":' + missing : "") + "}";
  } catch (e) {
    return '{"err":"' + rcEsc(e) + '"}';
  }
}
