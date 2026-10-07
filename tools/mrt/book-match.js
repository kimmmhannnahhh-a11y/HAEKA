// 후보 중에서 그 매장의 입장권이 확실한 상품만 고른다. 결과: book-match.json
// 규칙: 상품 분류가 입장권·티켓이고(투어 제외), 매장 이름의 글자 묶음이 상품명에 80% 이상 들어 있어야 한다.
// 이름이 짧으면(4자 이하) 도시까지 같아야 한다. 여러 개면 후기 많은 것.
const fs = require('fs');
const cand = JSON.parse(fs.readFileSync(__dirname + '/book-cand.json', 'utf8'));
const norm = (s) => String(s || '').toLowerCase().replace(/셜/g, '설').replace(/츄/g, '추').replace(/썬/g, '선').replace(/\(.*?\)|（.*?）/g, '').replace(/[^0-9a-z가-힣]/g, '');
const grams = (s) => { const o = []; for (let i = 0; i < s.length - 1; i++) o.push(s.slice(i, i + 2)); return o; };
function cover(name, title) { const g = grams(norm(name)), t = norm(title); if (!g.length) return 0; return g.filter((x) => t.includes(x)).length / g.length; }
const TICKET = /입장권|티켓/;
// 눈으로 확인해 정한 것(2026-10-07). 규칙이 놓친 맞는 상품은 ACCEPT, 규칙이 잘못 붙인 것은 REJECT.
const ACCEPT = new Set(['천문산', '썬월드 판시판 레전드(판시판 케이블카)', '커럼빈 야생동물 보호구역', '삿포로 TV탑 전망대', '바토파리지앵 유람선', '사가노 도롯코 열차 (도롯코 사가역)', '시티 크루즈 샌디에이고 (하버 크루즈)', '히스토리움 브뤼헤', '시안 성벽']);
const REJECT = new Set(['디즈니랜드 리조트', '도쿄국립박물관']);   // 다른 도시 디즈니, 다른 박물관이 붙음
const NOT_TICKET = /투어|콘서트|쿨패스|시티패스|픽업|샌딩/;      // 입장권이 아닌 상품
const LESS = /콤보|익스프레스|확약권/;                              // 기본 입장권이 있으면 그쪽을 먼저
const out = {}, review = [];
for (const [key, s] of Object.entries(cand)) {
  let best = null;
  for (const it of s.items) {
    if (!TICKET.test(it.c || '') || /투어/.test(it.c || '')) continue;
    if (REJECT.has(s.name)) continue;
    if (NOT_TICKET.test(it.t) && !/입장권|티켓|탑승권|승차권|1일권/.test(it.t)) continue;
    if (/투어/.test(it.t) && /일출|당일 투어|시간 투어/.test(it.t)) continue;
    const cv = cover(s.name, it.t), n = norm(s.name).length;
    const cityOk = (it.d || '').startsWith(s.city) || norm(it.t).includes(norm(s.city));
    if (cv < 0.6) continue;
    const ok = (cv >= 0.8 && (n > 4 || cityOk)) || ACCEPT.has(s.name);
    const sc = (ok ? 10 : 0) + (LESS.test(it.t) ? 0 : 2) + (/입장권/.test(it.t) ? 1 : 0) + (/1일권/.test(it.t) ? 3 : 0) + cv + Math.min(it.rc || 0, 5000) / 10000;
    if (!best || sc > best.sc) best = { it, cv, ok, sc, cityOk };
  }
  if (!best) continue;
  if (best.ok) out[key] = { name: s.name, city: s.city, country: s.country, gid: best.it.gid, title: best.it.t, url: best.it.u, cv: +best.cv.toFixed(2), cityOk: best.cityOk };
  else review.push(s.name + ' / ' + s.city + '  →  ' + best.it.t.slice(0, 50) + ' (' + best.it.d + ') ' + best.cv.toFixed(2));
}
fs.writeFileSync(__dirname + '/book-match.json', JSON.stringify(out, null, 1));
console.log('후보 있는 매장', Object.values(cand).filter((x) => x.items.length).length, '/ 전체', Object.keys(cand).length, '/ 맞춤', Object.keys(out).length, '/ 애매', review.length);
if (process.argv[2] === 'list') for (const v of Object.values(out)) console.log((v.cityOk ? ' ' : '?') + ' ' + v.name + ' / ' + v.city + '  →  ' + v.title.slice(0, 54) + ' ' + v.cv);
if (process.argv[2] === 'review') review.forEach((r) => console.log(r));
