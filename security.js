// HAEKA 공통 보안 헬퍼
// 사용자 입력을 HTML에 넣기 전 반드시 이 함수를 통과시켜 XSS 차단

(function(){
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }
  // 속성값(href, src 등)에 사용자 입력이 들어갈 때 위험한 스킴 차단
  function safeUrl(url) {
    if (url == null) return '';
    var s = String(url).trim();
    // javascript:, data:, vbscript: 차단
    if (/^(javascript|data|vbscript):/i.test(s)) return '#';
    return escapeHtml(s);
  }
  // 문자열 길이 제한 (DoS 방지)
  function safeLen(str, max) {
    if (str == null) return '';
    var s = String(str);
    max = max || 500;
    return s.length > max ? s.slice(0, max) + '…' : s;
  }
  // 안전 렌더러 = escape + 길이 제한 (기본 500자)
  function safeText(str, max) {
    return escapeHtml(safeLen(str, max));
  }
  // safeImg — 사용자 이미지 URL 검증. https 아니면 fallback
  function safeImg(url, fallback) {
    if (url == null) return fallback || '';
    var s = String(url).trim();
    if (!/^https:\/\//i.test(s)) return fallback || '';
    return escapeHtml(s);
  }
  // 신고 헬퍼 — window._db + window._fbAuth 필요 (각 페이지에서 Firebase 초기화 필수)
  function report(targetType, targetId, reason) {
    return new Promise(function(resolve, reject){
      var t = String(targetType||'').trim();
      if (['store','review','post','comment'].indexOf(t) < 0) { reject(new Error('invalid target')); return; }
      var id = String(targetId||'').trim();
      var r = safeLen(reason||'기타', 1000);
      if (!id) { reject(new Error('empty id')); return; }
      if (!window._db || !window._fbAuth) { reject(new Error('firebase not init')); return; }
      var u = window._fbAuth.currentUser;
      if (!u) { reject(new Error('not signed in')); return; }
      Promise.all([
        import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js')
      ]).then(function(mods){
        var m = mods[0];
        return m.addDoc(m.collection(window._db, 'reports'), {
          uid: u.uid,
          targetType: t,
          targetId: id,
          reason: r,
          createdAt: m.serverTimestamp ? m.serverTimestamp() : new Date()
        });
      }).then(resolve).catch(reject);
    });
  }
  window._esc = escapeHtml;
  window._safeUrl = safeUrl;
  window._safeLen = safeLen;
  window._safeText = safeText;
  window._safeImg = safeImg;
  window._report = report;
})();
