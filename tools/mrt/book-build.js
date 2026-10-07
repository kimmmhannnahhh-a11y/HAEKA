// 맞춰진 입장권 상품마다 홍보 링크를 만들어 저장소의 haeka-book.js 로 쓴다.
// 열쇠는 매장 좌표(소수 5자리) — 화면이 매장 좌표로 찾아 "온라인 예매" 버튼을 띄운다.
const fs = require('fs');
const { mrt } = require('./mrt.js');
const OUT = require('path').join(__dirname, '../../haeka-book.js');
const CACHE = __dirname + '/book-links.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const match = JSON.parse(fs.readFileSync(__dirname + '/book-match.json', 'utf8'));
  const links = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const book = {}; let skipped = 0;
  for (const [key, m] of Object.entries(match)) {
    if (!links[m.gid]) {
      // 일부 상품은 홍보 링크를 만들 수 없다(400). 그런 상품은 빼고 넘어간다
      let j; try { j = await mrt('POST', '/v1/mylink', { targetUrl: m.url }); } catch (e) { console.log('링크 못 만듦:', m.name, '→', m.title.slice(0, 40)); skipped++; await sleep(700); continue; }
      links[m.gid] = j.data.mylink;
      fs.writeFileSync(CACHE, JSON.stringify(links, null, 1));
      await sleep(700);
    }
    book[key] = { u: links[m.gid], t: m.title.trim(), n: m.name, c: m.city, k: m.country };
  }
  const head = [
    '// 해카 입장권 매장의 온라인 예매 링크 — 손으로 고치지 말 것. tools/mrt/book-*.js 가 만든다(매달 자동 실행).',
    '// 열쇠는 매장 좌표(위도,경도 소수 5자리). u 는 마이리얼트립 홍보 링크(파트너 코드 포함), t 는 그 상품 이름. n·c·k 는 매장 이름·도시·나라(관리자 목록용).',
    '// 만든 날 ' + new Date().toISOString().slice(0, 10) + ' · ' + Object.keys(book).length + '곳',
  ].join('\n');
  fs.writeFileSync(OUT, head + '\nwindow.HK_BOOK = ' + JSON.stringify(book, null, 1) + ';\n'
    + "// 매장에 맞는 예매 링크를 돌려준다(없으면 null)\nwindow.haekaBook = function (s) { if (!s || typeof s.lat !== 'number' || typeof s.lng !== 'number') return null; return window.HK_BOOK[s.lat.toFixed(5) + ',' + s.lng.toFixed(5)] || null; };\n");
  console.log('예매 링크', Object.keys(book).length, '곳 / 상품', new Set(Object.values(match).map((m) => m.gid)).size, '개');
})().catch((e) => console.log('실패:', e.message));
