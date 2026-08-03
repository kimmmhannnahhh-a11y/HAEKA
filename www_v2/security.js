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
  // 사용자 차단 — users/{uid}.blockedUsers 배열에 상대 uid를 넣는다.
  // 차단 목록은 localStorage에도 캐시해 목록 화면에서 즉시 필터링할 수 있게 한다.
  var BLOCK_CACHE_KEY = 'haeka_blocked';

  function getBlockedUsers() {
    try {
      var raw = localStorage.getItem(BLOCK_CACHE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function setBlockedCache(list) {
    try { localStorage.setItem(BLOCK_CACHE_KEY, JSON.stringify(list || [])); } catch (e) {}
  }

  function isBlocked(targetUid) {
    if (!targetUid) return false;
    return getBlockedUsers().indexOf(String(targetUid)) >= 0;
  }

  // 로그인 직후/목록 진입 시 서버 값을 캐시에 동기화
  function syncBlockedUsers() {
    return new Promise(function (resolve) {
      if (!window._db || !window._fbAuth) { resolve(getBlockedUsers()); return; }
      var u = window._fbAuth.currentUser;
      if (!u) { resolve(getBlockedUsers()); return; }
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js').then(function (m) {
        return m.getDoc(m.doc(window._db, 'users', u.uid)).then(function (snap) {
          var list = (snap.exists() && snap.data().blockedUsers) || [];
          if (!Array.isArray(list)) list = [];
          setBlockedCache(list);
          resolve(list);
        });
      }).catch(function () { resolve(getBlockedUsers()); });
    });
  }

  function blockUser(targetUid) {
    return new Promise(function (resolve, reject) {
      var target = String(targetUid || '').trim();
      if (!target) { reject(new Error('empty uid')); return; }
      if (!window._db || !window._fbAuth) { reject(new Error('firebase not init')); return; }
      var u = window._fbAuth.currentUser;
      if (!u) { reject(new Error('not signed in')); return; }
      if (u.uid === target) { reject(new Error('self block')); return; }
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js').then(function (m) {
        return m.setDoc(m.doc(window._db, 'users', u.uid), { blockedUsers: m.arrayUnion(target) }, { merge: true });
      }).then(function () {
        var list = getBlockedUsers();
        if (list.indexOf(target) < 0) list.push(target);
        setBlockedCache(list);
        resolve();
      }).catch(reject);
    });
  }

  function unblockUser(targetUid) {
    return new Promise(function (resolve, reject) {
      var target = String(targetUid || '').trim();
      if (!target) { reject(new Error('empty uid')); return; }
      if (!window._db || !window._fbAuth) { reject(new Error('firebase not init')); return; }
      var u = window._fbAuth.currentUser;
      if (!u) { reject(new Error('not signed in')); return; }
      import('https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js').then(function (m) {
        return m.setDoc(m.doc(window._db, 'users', u.uid), { blockedUsers: m.arrayRemove(target) }, { merge: true });
      }).then(function () {
        setBlockedCache(getBlockedUsers().filter(function (x) { return x !== target; }));
        resolve();
      }).catch(reject);
    });
  }

  window._esc = escapeHtml;
  window._safeUrl = safeUrl;
  window._safeLen = safeLen;
  window._safeText = safeText;
  window._safeImg = safeImg;
  window._report = report;
  window._blockUser = blockUser;
  window._unblockUser = unblockUser;
  window._isBlocked = isBlocked;
  window._getBlockedUsers = getBlockedUsers;
  window._syncBlockedUsers = syncBlockedUsers;
})();
