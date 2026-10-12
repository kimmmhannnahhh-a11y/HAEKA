// 해카 숙소 예약 링크 — 트립닷컴 제휴(Allianceid·SID 가 붙어야 수익이 잡힌다).
// HK_STAY 는 해카 도시 이름 → 트립닷컴 도시 번호. 번호를 아는 도시는 그 도시 호텔 목록으로,
// 모르는 도시는 트립닷컴 숙소 검색 첫 화면으로 보낸다(도시 번호가 없으면 목록 주소가 열리지 않는다).
window.HK_STAY = {
  '오사카': 219,
  '교토': 734
};
// city: 해카 도시 이름, from: 어느 화면에서 눌렀는지(trip_sub1 로 남겨 대시보드에서 구분한다)
window.haekaStay = function (city, from) {
  var tail = 'Allianceid=10931341&SID=332918622&trip_sub1=' + encodeURIComponent(from || 'haeka');
  var id = city && window.HK_STAY[city];
  if (!id) return { u: 'https://kr.trip.com/hotels/?' + tail, city: '' };
  var n = encodeURIComponent(city);
  return { u: 'https://kr.trip.com/hotels/list?city=' + id + '&display=' + n + '&optionId=' + id + '&optionType=City&optionName=' + n + '&' + tail, city: city };
};
