// 사진 순서 바꾸기 — 사진을 손가락(또는 마우스)으로 끌어 다른 사진 위에 놓으면 그 자리로 옮긴다.
// 쓰는 곳: 매장 등록(heka_register.html), 운영자 수정(admin-edit.js)
// 사용: haekaDragSort(상자, function(from, to){ ...배열 순서 바꾸고 다시 그리기... })
//   상자 안에서 순서를 바꿀 항목에는 data-sort="순번" 을 붙인다. 상자를 다시 그려도(innerHTML) 그대로 동작한다.
(function () {
  window.haekaDragSort = function (box, onMove) {
    if (!box || box._dragSort) { if (box) box._dragSortMove = onMove; return; }
    box._dragSort = true; box._dragSortMove = onMove;
    var st = null; // { el, from, x0, y0, on, over }

    function itemAt(x, y) {
      var el = document.elementFromPoint(x, y);
      el = el && el.closest ? el.closest('[data-sort]') : null;
      return (el && box.contains(el)) ? el : null;
    }
    function mark(el) {
      if (st.over && st.over !== el) st.over.style.outline = '';
      st.over = el;
      if (el && el !== st.el) { el.style.outline = '2px solid #FF3900'; el.style.outlineOffset = '2px'; }
    }
    function end(commit) {
      if (!st) return;
      var s = st; st = null;
      s.el.style.transform = ''; s.el.style.zIndex = ''; s.el.style.opacity = ''; s.el.style.pointerEvents = '';
      if (s.over) s.over.style.outline = '';
      if (commit && s.on && s.over && s.over !== s.el) {
        var to = +s.over.getAttribute('data-sort');
        if (to !== s.from && box._dragSortMove) box._dragSortMove(s.from, to);
      }
      // 끌다 놓은 건 누른 것으로 치지 않는다
      if (s.on) { var stop = function (e) { e.stopPropagation(); e.preventDefault(); }; box.addEventListener('click', stop, true); setTimeout(function () { box.removeEventListener('click', stop, true); }, 250); }
    }

    box.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button > 0) return;
      if (e.target.closest && e.target.closest('button')) return;   // 삭제(✕) 단추는 그대로 누르게 둔다
      var el = e.target.closest ? e.target.closest('[data-sort]') : null;
      if (!el || !box.contains(el)) return;
      st = { el: el, from: +el.getAttribute('data-sort'), x0: e.clientX, y0: e.clientY, on: false, over: null, id: e.pointerId };
    });
    box.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.on) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        st.on = true;
        try { box.setPointerCapture(e.pointerId); } catch (err) {}
        st.el.style.zIndex = '5'; st.el.style.opacity = '.85'; st.el.style.pointerEvents = 'none';
      }
      e.preventDefault();
      st.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.06)';
      mark(itemAt(e.clientX, e.clientY));
    });
    box.addEventListener('pointerup', function (e) { if (st && e.pointerId === st.id) end(true); });
    box.addEventListener('pointercancel', function (e) { if (st && e.pointerId === st.id) end(false); });
    // 사진이 브라우저 기본 동작(이미지 끌어 저장, 길게 눌러 메뉴)으로 빠지지 않게
    box.addEventListener('dragstart', function (e) { if (e.target.closest && e.target.closest('[data-sort]')) e.preventDefault(); });
    box.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-sort]')) e.preventDefault(); });
  };
  // 배열에서 from 번째를 to 번째 자리로 옮긴다
  window.haekaMoveItem = function (arr, from, to) {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
    arr.splice(to, 0, arr.splice(from, 1)[0]);
    return arr;
  };
})();
