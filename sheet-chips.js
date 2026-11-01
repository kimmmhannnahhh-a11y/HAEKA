// 카드사·업종 선택 창(아래에서 올라오는 창)의 칩을 화면 위쪽 칩과 같은 모양으로 맞춘다.
// 로고는 img/pay 의 실제 로고, 업종 아이콘은 화면에 있는 hkdIcon 을 그대로 쓴다. 선택·동작은 건드리지 않는다.
(function () {
  var css = ''
    + 'body .sheet-chip.hkd-sc{height:32px;display:inline-flex!important;align-items:center;justify-content:center;gap:5px;padding:0 13px!important;border-radius:999px!important;border:0!important;background:#F2F1EF!important;color:#2B2F38!important;font-size:13px!important;font-weight:600!important;line-height:1!important;letter-spacing:-.02em;box-shadow:none!important}'
    + 'body .sheet-chip.hkd-sc.on{background:#FFE6E0!important;color:#FD5B50!important;box-shadow:inset 0 0 0 1.5px rgba(253,91,80,.55)!important}'
    + 'body .sheet-chip.hkd-sc.hkd-sc-all.on{background:#16181D!important;color:#fff!important;box-shadow:none!important}'
    + '.hkd-sc .hkd-ic{width:17px;height:17px;flex-shrink:0;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '.hkd-sc img{display:block;width:auto}'
    + '.hkd-sc .sc-visa{height:11px}.hkd-sc .sc-mc{height:16px}.hkd-sc .sc-jcb{height:18px}.hkd-sc .sc-amex{height:20px;border-radius:2px}.hkd-sc .sc-up{height:16px}'
    + '.hkd-sc .sc-mask{display:inline-block;flex-shrink:0;-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat}'
    + '.hkd-sc .sc-ali{width:16px;height:16px;background:#1677FF;-webkit-mask-image:url(img/pay/alipay.svg);mask-image:url(img/pay/alipay.svg)}'
    + '.hkd-sc .sc-we{width:17px;height:17px;background:#07C160;-webkit-mask-image:url(img/pay/wechat.svg);mask-image:url(img/pay/wechat.svg)}';
  // 전체보기처럼 위쪽 칩이 아직 글자만인 화면(window.HKD_SQ)은 위쪽 칩도 홈과 같게 맞춘다
  if (window.HKD_SQ) css += ''
    + 'body .chip-row .sq-chip.hkd-sc,body .chip-row .sq-chip-all.hkd-sc,body .cat-wrap .sq-chip.hkd-sc,body .cat-wrap .sq-chip-all.hkd-sc{height:32px;display:inline-flex!important;align-items:center;justify-content:center;gap:5px;padding:0 13px!important;border-radius:999px!important;border:0!important;background:#F2F1EF!important;color:#2B2F38!important;font-size:13px!important;font-weight:600!important;line-height:1!important;letter-spacing:-.02em;box-shadow:none!important;flex-shrink:0}'
    + 'body .chip-row .sq-chip.hkd-sc.on,body .cat-wrap .sq-chip.hkd-sc.on{background:#FFE6E0!important;color:#FD5B50!important;box-shadow:inset 0 0 0 1.5px rgba(253,91,80,.55)!important}'
    + 'body .chip-row .sq-chip-all.hkd-sc,body .cat-wrap .sq-chip-all.hkd-sc{min-width:56px;font-size:14px!important;font-weight:700!important;background:#16181D!important;color:#fff!important}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function ic(paths) { return '<svg class="hkd-ic" viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>'; }
  var CARD = {
    visa: '<img class="sc-visa" src="img/pay/visa-c.svg" alt="VISA">',
    master: '<img class="sc-mc" src="img/pay/mastercard-mark.svg" alt="MASTER">',
    jcb: '<img class="sc-jcb" src="img/pay/jcb-c.svg" alt="JCB">',
    amex: '<img class="sc-amex" src="img/pay/amex-c.svg" alt="AMEX">',
    unionpay: '<img class="sc-up" src="img/pay/unionpay-c.svg" alt="UnionPay">',
    '알리페이': '<span class="sc-mask sc-ali"></span>알리페이',
    '위챗페이': '<span class="sc-mask sc-we"></span>위챗페이',
    '트래블로그': ic('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M14.5 14.5h3"/>') + '트래블로그',
    '트래블월렛': ic('<path d="M4 7.5h14a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5zM4 7.5 15 4.5v3M16 13.8h1.5"/>') + '트래블월렛',
    '현금': ic('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>') + '현금'
  };

  function decorate(el) {
    if (el.classList.contains('hkd-sc')) return;
    if (el.classList.contains('sq-chip-all')) { el.classList.add('hkd-sc'); return; }
    var m = (el.getAttribute('onclick') || '').match(/toggle(?:CardChip|CardMain)\(this,'([^']+)'\)/);
    if (m) {
      var key = m[1];
      if (key === 'all') { el.classList.add('hkd-sc', 'hkd-sc-all'); return; }
      var h = CARD[key] || CARD[key.toLowerCase()];
      if (h) { el.innerHTML = h; el.title = key; }
      el.classList.add('hkd-sc');
      return;
    }
    // 업종 칩: 데이터 이름(lbl / l)으로 위쪽 칩과 같은 아이콘을 붙인다
    var lbl = el.dataset.lbl || el.dataset.l;
    if (lbl && typeof window.hkdIcon === 'function') {
      var txt = el.textContent;
      el.innerHTML = window.hkdIcon(lbl) + '<span></span>';
      el.lastChild.textContent = txt;
    } else if (el.id === 'cat-all-select' || el.id === 'cat-sheet-all') {
      el.classList.add('hkd-sc-all');
    }
    el.classList.add('hkd-sc');
  }
  function run() { document.querySelectorAll(window.HKD_SQ ? '.sheet-chip, .chip-row .sq-chip, .chip-row .sq-chip-all, .cat-wrap .sq-chip, .cat-wrap .sq-chip-all' : '.sheet-chip').forEach(decorate); }
  run();
  // 업종 칩은 업종 목록을 받은 뒤 다시 만들어진다 → 새로 생긴 칩도 맞춘다
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
