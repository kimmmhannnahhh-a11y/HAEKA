// 해카 숙소 예약 링크 — 트립닷컴 제휴(Allianceid·SID 가 붙어야 수익이 잡힌다).
// HK_STAY 는 해카 도시 이름 → 트립닷컴 도시 번호. 번호를 아는 도시는 그 도시 호텔 목록으로 바로 가고,
// 모르는 도시는 트립닷컴 통합 검색에 "<도시> 호텔"을 넣은 결과로 간다(호텔 목록 주소는 도시 번호가 있어야 열린다).
window.HK_STAY = {
  '오사카': 219,
  '교토': 734
};
// city: 해카 도시 이름, from: 어느 화면에서 눌렀는지(trip_sub1 로 남겨 대시보드에서 구분한다)
window.haekaStay = function (city, from) {
  var tail = 'Allianceid=10931341&SID=332918622&trip_sub1=' + encodeURIComponent(from || 'haeka');
  if (!city) return { u: 'https://kr.trip.com/hotels/?' + tail, city: '' };
  var id = window.HK_STAY[city], n = encodeURIComponent(city);
  if (id) return { u: 'https://kr.trip.com/hotels/list?city=' + id + '&display=' + n + '&optionId=' + id + '&optionType=City&optionName=' + n + '&' + tail, city: city };
  // 이름 끝의 괄호 설명(예: 해밀턴(온타리오))은 검색어에서 뺀다
  var kw = encodeURIComponent(city.replace(/\(.*\)$/, '') + ' 호텔');
  return { u: 'https://kr.trip.com/global-search/searchlist/search?keyword=' + kw + '&' + tail, city: city };
};
