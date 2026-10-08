// 매장 목록 공용 불러오기
//
// 전 세계 매장을 통째로 받지 않는다. 매장마다 지도 칸 번호(cell)가 있고,
// 화면은 내 주변 칸만 받는다. 매장이 아무리 늘어도 받는 양은 주변 밀도만큼이다.
// 주변에 매장이 거의 없으면(예: 한국) 가장 가까운 도시 것을 같이 받아
// "가까운 순" 목록이 비지 않게 한다.
(function () {
  var PREFIX = 'haeka_near_';
  var TTL = 5 * 60 * 1000;   // 5분 지나면 다시 받는다
  var RADIUS = 2;            // 내 칸 기준 ±2칸 = 5×5칸 (약 11km)
  var MIN = 20;              // 주변이 이보다 적으면 가장 가까운 도시도 받는다
  var CITIES_URL = 'https://haeka.vercel.app/data/cities.json';
  var pending = {};
  var citiesPromise = null;

  // 칸 한 변 0.02도(약 2.2km). 저장하는 쪽(등록·관리자)과 계산식이 같아야 한다.
  window.storeCell = function (lat, lng) {
    return Math.floor(lat * 50) + '_' + Math.floor(lng * 50);
  };

  window.cellsAround = function (lat, lng, r) {
    if (r == null) r = RADIUS;
    var y = Math.floor(lat * 50), x = Math.floor(lng * 50), out = [];
    for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) out.push((y + dy) + '_' + (x + dx));
    return out;
  };

  function read(key) {
    try {
      var raw = sessionStorage.getItem(PREFIX + key);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (!box || !box.at || Date.now() - box.at > TTL) return null;
      return box.rows;
    } catch (e) { return null; }
  }

  function write(key, rows) {
    try { sessionStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), rows: rows })); } catch (e) {}
  }

  function loadCities() {
    if (!citiesPromise) {
      citiesPromise = fetch(CITIES_URL).then(function (r) { return r.json(); }).catch(function () { citiesPromise = null; return []; });
    }
    return citiesPromise;
  }

  function nearestCity(lat, lng, cities) {
    var best = null, bestD = Infinity;
    (cities || []).forEach(function (c) {
      var dy = c.lat - lat, dx = (c.lng - lng) * Math.cos(lat * Math.PI / 180);
      var d = dy * dy + dx * dx;
      if (d < bestD) { bestD = d; best = c; }
    });
    return best;
  }

  // api.cells(칸 목록) → 그 칸들의 매장, api.city(도시 이름) → 그 도시 매장 일부
  // api.city 를 안 주면 주변 칸만 받는다(지도 화면)
  window.loadStoresNear = function (lat, lng, api) {
    var key = window.storeCell(lat, lng) + (api.city ? '' : '_m');
    var cached = read(key);
    if (cached) return Promise.resolve(cached);
    if (pending[key]) return pending[key];
    pending[key] = Promise.resolve(api.cells(window.cellsAround(lat, lng))).then(function (rows) {
      rows = rows || [];
      if (rows.length >= MIN || !api.city) return rows;
      // 가까운 도시부터 차례로 받아 MIN 곳이 찰 때까지 채운다(최대 4개 도시)
      return loadCities().then(function (cities) {
        var order = (cities || []).slice().sort(function (a, b) {
          var k = Math.cos(lat * Math.PI / 180);
          var da = Math.pow(a.lat - lat, 2) + Math.pow((a.lng - lng) * k, 2);
          var db = Math.pow(b.lat - lat, 2) + Math.pow((b.lng - lng) * k, 2);
          return da - db;
        }).slice(0, 4);
        var seen = {}, acc = [];
        rows.forEach(function (s) { if (!seen[s.id]) { seen[s.id] = 1; acc.push(s); } });
        var step = function (i) {
          if (i >= order.length || acc.length >= MIN) return acc;
          return Promise.resolve(api.city(order[i].name)).then(function (more) {
            (more || []).forEach(function (s) { if (!seen[s.id]) { seen[s.id] = 1; acc.push(s); } });
            return step(i + 1);
          }).catch(function () { return acc; });
        };
        return step(0);
      });
    }).then(function (rows) {
      write(key, rows);
      delete pending[key];
      return rows;
    }).catch(function (e) {
      delete pending[key];
      throw e;
    });
    return pending[key];
  };

  // 매장을 새로 등록했을 때 캐시를 비운다
  window.clearStoreCache = function () {
    try {
      for (var i = sessionStorage.length - 1; i >= 0; i--) {
        var k = sessionStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) sessionStorage.removeItem(k);
      }
      sessionStorage.removeItem('haeka_stores_cache');
    } catch (e) {}
    pending = {};
  };
})();
