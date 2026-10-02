// 지도 버튼 → 구글 지도에서 그 가게 페이지가 바로 열리게 한다
// 좌표만 넘기면 빈 지점이, 이름만 넘기면 검색 목록이 뜬다.
// 그래서 이름 + 좌표로 구글 장소 ID를 미리 찾아두고, ID로 연다.
// ID만 받는 조회는 구글 요금이 붙지 않는다. 찾은 ID는 이 기기에 저장해 다시 묻지 않는다.
(function () {
  var PREFIX = 'haeka_pid:';
  var BOX = 0.0015; // 좌표 앞뒤 약 150m 안에서만 찾는다 (다른 지점과 헷갈리지 않게)

  function keyOf(s) { return PREFIX + (+s.lat).toFixed(5) + ',' + (+s.lng).toFixed(5); }
  function nameOf(s) { return s.nameLocal || s.name || ''; }
  function getPid(s) { try { return localStorage.getItem(keyOf(s)); } catch (e) { return null; } }

  window.haekaMapUrl = function (s) {
    if (!s) return null;
    if (s.lat && s.lng) {
      var pid = getPid(s);
      if (pid) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(nameOf(s)) + '&query_place_id=' + pid;
      return 'https://www.google.com/maps/search/' + encodeURIComponent(nameOf(s)) + '/@' + s.lat + ',' + s.lng + ',18z';
    }
    if (s.address) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address);
    return null;
  };

  window.haekaOpenMap = function (s) {
    var u = window.haekaMapUrl(s);
    if (u) window.open(u, '_blank');
  };

  // 가게 화면을 열 때 불러둔다. 지도 스크립트가 늦게 뜨면 잠깐 기다린다
  window.haekaFindPlace = function (s, tries) {
    if (!s || !s.lat || !s.lng || !nameOf(s) || getPid(s)) return;
    tries = tries || 0;
    if (!(window.google && google.maps && google.maps.importLibrary)) {
      if (tries < 20) setTimeout(function () { window.haekaFindPlace(s, tries + 1); }, 300);
      return;
    }
    var lat = +s.lat, lng = +s.lng;
    google.maps.importLibrary('places').then(function (lib) {
      return lib.Place.searchByText({
        textQuery: nameOf(s),
        fields: ['id'],
        locationRestriction: { south: lat - BOX, west: lng - BOX, north: lat + BOX, east: lng + BOX },
        maxResultCount: 1
      });
    }).then(function (res) {
      var p = res && res.places && res.places[0];
      if (p && p.id) { try { localStorage.setItem(keyOf(s), p.id); } catch (e) {} }
    }).catch(function () {});
  };
})();
