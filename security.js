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
  window._esc = escapeHtml;
  window._safeUrl = safeUrl;
})();
