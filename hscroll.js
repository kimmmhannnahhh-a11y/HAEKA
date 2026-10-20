// PC(마우스)에서 가로로 넘기는 줄(칩 줄, 최근 본 항목 등)을 옆으로 움직이게 한다.
// - 마우스로 잡고 끌기
// - 줄 위에서 휠을 굴리면 옆으로
// 터치 기기에서는 아무것도 하지 않는다(원래대로 손가락으로 밀면 된다).
(function () {
  if (!window.matchMedia || !matchMedia('(pointer:fine)').matches) return;

  function scroller(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 2) {
        var ox = getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll') return el;
      }
    }
    return null;
  }

  var drag = null, moved = false;
  document.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('input,textarea,select')) return;
    var el = scroller(e.target);
    if (!el) return;
    drag = { el: el, x: e.clientX, left: el.scrollLeft };
    moved = false;
  });
  document.addEventListener('mousemove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!moved && Math.abs(dx) < 5) return;
    moved = true;
    drag.el.scrollLeft = drag.left - dx;
    drag.el.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mouseup', function () {
    if (!drag) return;
    drag.el.style.cursor = '';
    drag = null;
  });
  // 끌고 나서 손을 뗄 때 칩이 눌리지 않게
  document.addEventListener('click', function (e) {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);
  document.addEventListener('dragstart', function (e) { if (drag) e.preventDefault(); });

  document.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var el = scroller(e.target);
    if (!el) return;
    var max = el.scrollWidth - el.clientWidth;
    if ((e.deltaY > 0 && el.scrollLeft >= max - 1) || (e.deltaY < 0 && el.scrollLeft <= 0)) return;
    el.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
})();
