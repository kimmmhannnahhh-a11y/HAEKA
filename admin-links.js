// 관리자 페이지 "제휴 링크": 마이리얼트립 예매 링크가 붙은 매장과 홈 광고 목록을 보여준다(보기 전용).
// 자료는 haeka-book.js · haeka-ads.js 이고 매달 자동으로 다시 만들어진다(tools/mrt). 여기서 고치는 기능은 없다.
(function () {
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(src) {
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = src + '?t=' + Date.now();
      s.onload = function () { res(true); }; s.onerror = function () { res(false); };
      document.head.appendChild(s);
    });
  }
  // 자료를 마지막으로 불러온(새로 만든) 날. 매달 자동으로 도니까 40일 넘게 그대로면 자동 실행이 멈춘 것이다
  function when(d) { return '<span style="font-size:12px;color:#6B7280;font-weight:600">' + (d ? esc(d) + ' 불러옴' : '') + '</span>'; }
  function status(d) {
    if (!d) return '';
    var days = Math.floor((Date.now() - new Date(d + 'T00:00:00+09:00').getTime()) / 86400000);
    var late = days > 40;
    return '<div style="margin-bottom:16px;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:700;line-height:1.6;'
      + (late ? 'background:#FEF2F2;color:#DC2626;border:1px solid #FECACA' : 'background:#F0FDF4;color:#15803D;border:1px solid #BBF7D0') + '">'
      + '마지막으로 불러온 날: ' + esc(d) + ' (' + (days <= 0 ? '오늘' : days + '일 전') + ')'
      + '<div style="font-weight:500;font-size:12px">' + (late ? '40일 넘게 새로 불러오지 않았어요. 자동 실행이 멈췄는지 확인이 필요해요.' : '매달 2일 새벽에 자동으로 다시 불러와요. 정상이에요.') + '</div></div>';
  }
  function link(u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener" style="color:#2563eb;font-weight:700;text-decoration:none">열기</a>'; }

  function render() {
    var el = document.getElementById('links-body'); if (!el) return;
    el.innerHTML = '<div style="padding:16px;font-size:13px;color:#6B7280">불러오는 중…</div>';
    Promise.all([load('haeka-book.js'), load('haeka-ads.js')]).then(function () {
      var book = window.HK_BOOK || {}, ads = window.HK_ADS || [];
      var rows = Object.keys(book).map(function (k) { return book[k]; });
      rows.sort(function (a, b) { return (a.k || '').localeCompare(b.k || '', 'ko') || (a.c || '').localeCompare(b.c || '', 'ko') || (a.n || '').localeCompare(b.n || '', 'ko'); });
      var byCountry = {}; rows.forEach(function (r) { byCountry[r.k || '-'] = (byCountry[r.k || '-'] || 0) + 1; });
      var summary = Object.keys(byCountry).sort(function (a, b) { return byCountry[b] - byCountry[a]; }).map(function (c) { return esc(c) + ' ' + byCountry[c]; }).join(' · ');
      el.innerHTML = status(window.HK_BOOK_DATE || window.HK_ADS_DATE)
        + '<div class="card"><div class="card-head"><span class="card-title">입장권 온라인 예매 · ' + rows.length + '곳</span>' + when(window.HK_BOOK_DATE) + '</div>'
        + '<div style="padding:0 16px 10px;font-size:12px;color:#6B7280;line-height:1.7">' + summary + '</div>'
        + '<div style="overflow-x:auto"><table><thead><tr><th>나라</th><th>도시</th><th>매장</th><th>붙은 상품</th><th>링크</th></tr></thead><tbody>'
        + rows.map(function (r) { return '<tr><td>' + esc(r.k) + '</td><td>' + esc(r.c) + '</td><td style="font-weight:700">' + esc(r.n) + '</td><td>' + esc(r.t) + '</td><td>' + link(r.u) + '</td></tr>'; }).join('')
        + '</tbody></table></div></div>'
        + '<div class="card" style="margin-top:16px"><div class="card-head"><span class="card-title">홈 광고 팝업 · ' + ads.length + '개</span>' + when(window.HK_ADS_DATE) + '</div>'
        + '<div style="overflow-x:auto"><table><thead><tr><th>나라</th><th>제목</th><th>설명</th><th>링크</th></tr></thead><tbody>'
        + ads.map(function (a) { return '<tr><td>' + esc(a.country === '*' ? '그 외 전체' : a.country) + '</td><td style="font-weight:700">' + esc(a.title) + '</td><td>' + esc(a.sub) + '</td><td>' + link(a.url) + '</td></tr>'; }).join('')
        + '</tbody></table></div></div>';
    });
  }

  function mount() {
    if (document.getElementById('page-links')) return;
    var nav = document.getElementById('nav-import') || document.getElementById('nav-add-store');
    var first = document.getElementById('page-dashboard');
    if (!nav || !first) return;
    var item = document.createElement('div');
    item.className = 'nav-item'; item.id = 'nav-links';
    item.innerHTML = '🔗 제휴 링크';
    item.onclick = function () { goPage('links', item); render(); };
    nav.parentNode.insertBefore(item, nav.nextSibling);
    var page = document.createElement('div');
    page.className = 'page'; page.id = 'page-links';
    page.innerHTML = '<div class="page-title">제휴 링크</div>'
      + '<div class="page-sub">마이리얼트립 링크가 붙은 곳이에요. 매달 자동으로 새로 만들어져요(없어진 상품은 빠지고 새 상품이 들어가요).</div>'
      + '<div id="links-body"></div>';
    first.parentNode.appendChild(page);
  }

  var tries = 0, timer = setInterval(function () {
    tries++;
    var wrap = document.getElementById('admin-wrap');
    if (wrap && wrap.style.display === 'flex' && document.getElementById('page-dashboard')) {
      // "데이터 등록" 메뉴 다음에 오도록 그 메뉴가 붙을 때까지 잠깐 기다린다
      if (document.getElementById('nav-import') || tries > 20) { clearInterval(timer); mount(); }
    } else if (tries > 600) clearInterval(timer);
  }, 500);
})();
