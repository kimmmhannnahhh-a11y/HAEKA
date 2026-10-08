// 해카 입장권 매장마다 마이리얼트립 상품 후보를 찾는다(상위 5개). 결과: book-cand.json
// 맞는 상품인지 가려내는 건 다음 단계(book-match.js)에서 한다.
const fs = require('fs');
const { mrt } = require('./mrt.js');
const DATA = require('path').join(__dirname, '../../data/');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const seen = new Map();
  for (const f of fs.readdirSync(DATA)) {
    if (!f.endsWith('.json')) continue;
    let j; try { j = JSON.parse(fs.readFileSync(DATA + f, 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(j)) continue;
    for (const s of j) if (s && s.category === '입장권' && typeof s.lat === 'number') seen.set((s.nameLocal || s.name) + '|' + s.city, s);
  }
  const stores = [...seen.values()];
  const out = {};   // 매번 새로 찾는다(없어진 상품이 남지 않게)
  let n = 0;
  for (const s of stores) {
    const key = s.lat.toFixed(5) + ',' + s.lng.toFixed(5);
    if (out[key]) continue;
    try {
      const r = await mrt('POST', '/v1/products/tna/search', { keyword: s.name, page: 1, size: 5, sort: 'selling_count_desc' });
      out[key] = { name: s.name, nameLocal: s.nameLocal || '', city: s.city, country: s.country, lat: s.lat, lng: s.lng,
        items: (r.data.items || []).map((i) => ({ gid: i.gid, t: i.itemName, d: i.description, c: i.category, p: i.salePrice, rs: i.reviewScore, rc: i.reviewCount, u: i.productUrl })) };
    } catch (e) { console.log('실패', s.name, e.message.slice(0, 80)); await sleep(3000); continue; }
    if (++n % 50 === 0) { fs.writeFileSync(__dirname + '/book-cand.json', JSON.stringify(out)); console.log(n); }
    await sleep(350);
  }
  fs.writeFileSync(__dirname + '/book-cand.json', JSON.stringify(out));
  const v = Object.values(out);
  console.log('끝', v.length, '곳 / 후보 있는 곳', v.filter((x) => x.items.length).length);
})();
