// 관리자 페이지 "데이터 등록": data/imports.json 에 올라온 자료를 자동으로 등록한다.
// 이미 들어 있는 것은 건너뛰므로 여러 번 돌아도 중복되지 않는다.
(function () {
  var DONE_KEY = 'haeka_import_done';
  // 자료는 사이트가 아니라 저장소에서 바로 읽는다 → 사이트 배포가 밀리거나 막혀도 새 자료가 들어온다
  var DATA_BASE = 'https://raw.githubusercontent.com/kimmmhannnahhh-a11y/HAEKA/main/data/';
  var _busy = false, _items = [];

  function doneMap() { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (e) { return {}; } }
  function markDone(id, n) { var m = doneMap(); m[id] = { at: Date.now(), n: n }; try { localStorage.setItem(DONE_KEY, JSON.stringify(m)); } catch (e) {} }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function mount() {
    if (document.getElementById('page-import')) return;
    var nav = document.getElementById('nav-add-store');
    var first = document.getElementById('page-dashboard');
    if (!nav || !first) return;
    var item = document.createElement('div');
    item.className = 'nav-item'; item.id = 'nav-import';
    item.innerHTML = '📦 데이터 등록<span class="nav-badge" id="badge-import" style="display:none"></span>';
    item.onclick = function () { goPage('import', item); render(); };
    nav.parentNode.insertBefore(item, nav.nextSibling);
    var page = document.createElement('div');
    page.className = 'page'; page.id = 'page-import';
    page.innerHTML = '<div class="page-title">데이터 등록</div>'
      + '<div class="page-sub">새로 올라온 매장·입장권 자료를 자동으로 등록해요. 이미 있는 것은 건너뜁니다.</div>'
      + '<div class="card"><div class="card-head"><span class="card-title">올라온 자료</span>'
      + '<button class="btn-primary" id="import-all-btn" onclick="window.haekaImportAll(true)">전체 다시 확인</button></div>'
      + '<div id="import-list" style="padding:4px 16px 12px"></div></div>'
      + '<div class="card" style="margin-top:16px"><div class="card-head"><span class="card-title">진행 기록</span></div>'
      + '<div id="import-log" style="padding:8px 16px 14px;font-size:12px;line-height:1.7;color:#374151;white-space:pre-wrap;max-height:320px;overflow:auto"></div></div>';
    first.parentNode.appendChild(page);
  }

  function log(t) {
    var el = document.getElementById('import-log'); if (!el) return;
    el.textContent += t + '\n'; el.scrollTop = el.scrollHeight;
  }

  function render() {
    var el = document.getElementById('import-list'); if (!el) return;
    var d = doneMap();
    if (!_items.length) { el.innerHTML = '<div style="padding:14px 0;font-size:13px;color:#6B7280">올라온 자료가 없어요</div>'; return; }
    el.innerHTML = _items.map(function (it) {
      var done = d[it.id], st = it._state || (done ? '등록 완료' : '대기');
      var color = st === '등록 완료' ? '#16A34A' : st === '실패' ? '#DC2626' : '#6B7280';
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6">'
        + '<div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:700">' + esc(it.title) + '</div>'
        + '<div style="font-size:11px;color:#9CA3AF">' + esc(it.count) + '곳' + (it.date ? ' · ' + esc(it.date) : '') + (it._msg ? ' · ' + esc(it._msg) : '') + '</div></div>'
        + '<span style="font-size:12px;font-weight:700;color:' + color + '">' + esc(st) + '</span></div>';
    }).join('');
    var left = _items.filter(function (it) { return !d[it.id]; }).length;
    var b = document.getElementById('badge-import');
    if (b) { b.style.display = left ? '' : 'none'; b.textContent = left || ''; }
  }

  // 자료 하나 등록: 매장은 그 도시에 지도·체인 자료가 이미 있으면 건너뛰고, 입장권은 원문 이름이 같으면 건너뛴다
  async function importOne(it) {
    var f = window._fbFns, c = f.collection(window._db, 'stores'), uid = window._auth.currentUser.uid;
    var res = await fetch(DATA_BASE + it.file + '?t=' + Date.now());
    if (!res.ok) throw new Error('자료 파일을 못 받았어요 (' + res.status + ')');
    var a = await res.json(), added = 0, skipped = 0;
    var cities = []; a.forEach(function (s) { if (cities.indexOf(s.city) < 0) cities.push(s.city); });
    for (var ci = 0; ci < cities.length; ci++) {
      var city = cities[ci];
      var ex = (await f.getDocs(f.query(c, f.where('city', '==', city)))).docs.map(function (d) { return d.data(); });
      var hasStore = ex.some(function (x) { return x.source === 'osm' || x.source === 'chain'; });
      var tk = {}; ex.forEach(function (x) { if (x.category === '입장권') tk[x.nameLocal] = 1; });
      var mine = a.filter(function (s) { return s.city === city; });
      var list = mine.filter(function (s) { return s.category === '입장권' ? !tk[s.nameLocal] : !hasStore; });
      skipped += mine.length - list.length;
      for (var i = 0; i < list.length; i += 20) {
        await Promise.all(list.slice(i, i + 20).map(function (s) {
          var doc = {}; for (var k in s) doc[k] = s[k];
          doc.images = []; doc.uid = uid; doc.registeredBy = 'admin'; doc.createdAt = f.serverTimestamp();
          return f.addDoc(c, doc);
        }));
      }
      added += list.length;
      log('  ' + city + ' ' + list.length + '곳 등록' + (mine.length - list.length ? ', 건너뜀 ' + (mine.length - list.length) + '곳' : ''));
    }
    return { added: added, skipped: skipped };
  }

  // 도시 from 에 들어 있는 매장 중 (lat,lng) 반경 km 안의 것을 도시 to 로 옮긴다
  async function recity(op) {
    var f = window._fbFns, c = f.collection(window._db, 'stores');
    var snap = await f.getDocs(f.query(c, f.where('city', '==', op.from)));
    var hit = [];
    snap.forEach(function (d) {
      var x = d.data(); if (typeof x.lat !== 'number' || typeof x.lng !== 'number') return;
      var dx = (x.lng - op.lng) * Math.cos(op.lat * Math.PI / 180) * 111.3, dy = (x.lat - op.lat) * 111.3;
      if (Math.sqrt(dx * dx + dy * dy) <= op.km) hit.push(d.ref);
    });
    for (var i = 0; i < hit.length; i += 20) {
      await Promise.all(hit.slice(i, i + 20).map(function (ref) { return f.updateDoc(ref, { city: op.to }); }));
    }
    return hit.length;
  }

  // 영업시간 자료(data/hours/*.json)를 좌표가 같은 매장에 넣는다
  async function fillHours(op) {
    var f = window._fbFns, c = f.collection(window._db, 'stores');
    var res = await fetch(DATA_BASE + op.file + '?t=' + Date.now());
    if (!res.ok) throw new Error('자료 파일을 못 받았어요 (' + res.status + ')');
    var groups = await res.json(), n = 0;
    function key(lat, lng) { return (+lat).toFixed(5) + ',' + (+lng).toFixed(5); }
    var RANK = { osm: 1, official: 2 };
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g], map = {};
      grp.rows.forEach(function (r) { map[key(r.lat, r.lng)] = r; });
      var snap = await f.getDocs(f.query(c, f.where('city', '==', grp.city)));
      var todo = [];
      snap.forEach(function (d) {
        var x = d.data(); if (typeof x.lat !== 'number' || typeof x.lng !== 'number') return;
        var r = map[key(x.lat, x.lng)]; if (!r) return;
        // 믿을 만한 순서: 손으로 넣은 것 > 체인 공식 사이트(official) > 지도 자료(osm). 더 믿을 만한 것은 덮지 않는다
        var src = r.src || 'osm', have = !x.hours ? 0 : RANK[x.hoursSrc] || 3;
        if (have > RANK[src]) return;
        if (x.hoursSrc === src && JSON.stringify(x.hours) === JSON.stringify(r.hours)) return;
        var up = { hours: r.hours, hoursSrc: src, tz: r.tz };
        if (r.phone && !x.phone) up.phone = r.phone;
        todo.push({ ref: d.ref, up: up });
      });
      for (var i = 0; i < todo.length; i += 20) {
        await Promise.all(todo.slice(i, i + 20).map(function (t) { return f.updateDoc(t.ref, t.up); }));
      }
      n += todo.length;
      log('  ' + grp.city + ' 영업시간 ' + todo.length + '곳');
    }
    return n;
  }

  // force=true 면 등록 완료로 표시된 것도 다시 확인한다(중복은 생기지 않음)
  window.haekaImportAll = async function (force) {
    if (_busy) return; _busy = true;
    var btn = document.getElementById('import-all-btn'); if (btn) btn.disabled = true;
    try {
      var res = await fetch(DATA_BASE + 'imports.json?t=' + Date.now());
      _items = res.ok ? await res.json() : [];
    } catch (e) { _items = []; }
    render();
    var d = doneMap(), total = 0;
    for (var i = 0; i < _items.length; i++) {
      var it = _items[i];
      if (d[it.id] && !force) continue;
      it._state = '등록 중…'; render();
      log(it.title + ' 시작');
      try {
        var r = await importOne(it);
        markDone(it.id, r.added); total += r.added;
        it._state = '등록 완료'; it._msg = '등록 ' + r.added + '곳' + (r.skipped ? ', 건너뜀 ' + r.skipped + '곳' : '');
        log(it.title + ' 끝 - 등록 ' + r.added + '곳, 건너뜀 ' + r.skipped + '곳');
      } catch (e) {
        it._state = '실패'; it._msg = (e && e.message) || String(e);
        log(it.title + ' 실패: ' + it._msg);
      }
      render();
    }
    // 추가 작업(도시 이름 옮기기, 영업시간 넣기 등). 목록이 없으면 그냥 넘어간다
    try {
      var ores = await fetch(DATA_BASE + 'ops.json?t=' + Date.now());
      var ops = ores.ok ? await ores.json() : [];
      d = doneMap();
      for (var j = 0; j < ops.length; j++) {
        var op = ops[j];
        if (d['op:' + op.id] || (op.type !== 'recity' && op.type !== 'hours')) continue;
        log(op.title + ' 시작');
        try {
          var n = op.type === 'hours' ? await fillHours(op) : await recity(op);
          markDone('op:' + op.id, n); total += n;
          log(op.title + ' 끝 - ' + n + (op.type === 'hours' ? '곳 영업시간 넣음' : '곳 옮김'));
        } catch (e) { log(op.title + ' 실패: ' + ((e && e.message) || e)); }
      }
    } catch (e) {}
    if (total && window.clearStoreCache) { try { window.clearStoreCache(); } catch (e) {} }
    if (btn) btn.disabled = false;
    _busy = false;
  };

  // 관리자 로그인이 끝나 화면이 뜨면 메뉴를 붙이고, 아직 안 넣은 자료를 자동으로 등록한다
  var tries = 0, timer = setInterval(function () {
    tries++;
    var wrap = document.getElementById('admin-wrap');
    var ready = window._db && window._fbFns && window._auth && window._auth.currentUser && wrap && wrap.style.display === 'flex';
    if (ready) { clearInterval(timer); mount(); window.haekaImportAll(false);
      // 페이지를 열어 둔 동안에도 1분마다 새 자료가 올라왔는지 보고 자동으로 등록한다
      setInterval(function () { if (window._auth && window._auth.currentUser) window.haekaImportAll(false); }, 60000); }
    else if (tries > 600) clearInterval(timer);
  }, 500);
})();
