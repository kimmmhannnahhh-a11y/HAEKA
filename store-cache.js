// 매장 목록 공용 캐시
//
// 화면마다 따로 전체 매장을 받아오던 것을 한 번만 받아 재사용한다.
// 보이는 내용은 그대로고, 같은 세션 안에서 다시 받지 않는다.
// (탭을 닫으면 비워지므로 새로 등록한 매장도 다음에 열면 반영된다)
(function () {
  var KEY = 'haeka_stores_cache';
  var TTL = 5 * 60 * 1000;   // 5분 지나면 다시 받는다
  var pending = null;

  function read() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || !box.at || Date.now() - box.at > TTL) return null;
      return box.rows;
    } catch (e) { return null; }
  }

  function write(rows) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), rows: rows })); } catch (e) {}
  }

  // fetcher: 실제로 Firestore에서 받아오는 함수 (화면마다 다름)
  window.loadAllStores = function (fetcher) {
    var cached = read();
    if (cached) return Promise.resolve(cached);
    if (pending) return pending;
    pending = Promise.resolve(fetcher()).then(function (rows) {
      write(rows);
      pending = null;
      return rows;
    }).catch(function (e) {
      pending = null;
      throw e;
    });
    return pending;
  };

  // 매장을 새로 등록했을 때 캐시를 비운다
  window.clearStoreCache = function () {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    pending = null;
  };
})();
