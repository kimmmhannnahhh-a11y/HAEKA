// 매장 영업시간 표시
// 구글에 묻지 않고 매장 자료에 들어 있는 hours(월~일 7칸)를 쓴다. 조회 요금이 붙지 않는다.
// 칸 하나는 "10:00~22:00", "11:00~14:00, 17:00~22:00", "24시간 영업", "휴무" 중 하나.
// 영업중 여부는 매장이 있는 곳의 시각(tz)으로 따진다. 한국에서 파리 가게를 봐도 맞게 나온다.
(function () {
  var DAY = ['월', '화', '수', '목', '금', '토', '일'];
  var WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

  // 매장 현지의 요일(월=0)과 자정부터 지난 분
  function localNow(tz) {
    if (tz) {
      try {
        var p = {};
        new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
          .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
        if (WD[p.weekday] != null) return { day: WD[p.weekday], min: (+p.hour % 24) * 60 + +p.minute };
      } catch (e) {}
    }
    var d = new Date(), g = d.getDay();
    return { day: g === 0 ? 6 : g - 1, min: d.getHours() * 60 + d.getMinutes() };
  }

  // "11:00~14:00, 17:00~02:00" → [[660,840],[1020,1560]] (자정을 넘기면 끝이 1440 보다 크다)
  function ranges(txt) {
    if (!txt || txt === '휴무') return [];
    if (txt.indexOf('24시간') > -1) return [[0, 1440]];
    var out = [];
    txt.split(',').forEach(function (part) {
      var m = part.match(/(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);
      if (!m) { out = null; return; }
      if (!out) return;
      var s = +m[1] * 60 + +m[2], e = +m[3] * 60 + +m[4];
      if (e <= s) e += 1440;
      out.push([s, e]);
    });
    return out;
  }

  function isOpen(hours, now) {
    var today = ranges(hours[now.day]), prev = ranges(hours[(now.day + 6) % 7]);
    if (!today || !prev) return null;
    var i;
    for (i = 0; i < today.length; i++) if (now.min >= today[i][0] && now.min < today[i][1]) return true;
    // 어제 밤에 열어 자정을 넘긴 영업
    for (i = 0; i < prev.length; i++) if (prev[i][1] > 1440 && now.min < prev[i][1] - 1440) return true;
    return false;
  }

  // 영업시간이 없는 매장이면 null
  window.haekaHours = function (store) {
    var h = store && store.hours;
    if (!Array.isArray(h) || h.length !== 7) return null;
    var now = localNow(store.tz);
    return {
      day: now.day,
      dayName: DAY[now.day],
      todayText: h[now.day] || '',
      open: isOpen(h, now),
      week: h.map(function (t, i) { return DAY[i] + '요일: ' + (t || ''); })
    };
  };
})();
