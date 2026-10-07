// 해카 홈 광고 목록(haeka-ads.js)을 만든다. 마이리얼트립 마이심(수수료 20%)의 나라별 eSIM.
// 사용: node make-ads.js   → 마이심 나라 목록을 받고, 나라마다 홍보 링크를 만들어 저장소에 haeka-ads.js 로 쓴다.
// 이미 만든 링크는 ads-links.json 에 남겨 다시 만들지 않는다.
const fs = require('fs');
const { mrt } = require('./mrt.js');
const OUT = require('path').join(__dirname, '../../haeka-ads.js');
const CACHE = __dirname + '/ads-links.json';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const r = await fetch('https://api3.myrealtrip.com/sim/api/v1/mysim/products', { headers: { 'User-Agent': 'Mozilla/5.0', Origin: 'https://www.myrealtrip.com' } });
  const items = (await r.json()).data.items;
  const links = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
  const ads = [];
  for (const it of items) {
    if (it.type !== 'COUNTRY' && it.type !== 'GLOBAL') continue;
    const target = 'https://www.myrealtrip.com/mysim/products/' + it.productId + '?period=cheapest';
    if (!links[it.productId]) {
      const j = await mrt('POST', '/v1/mylink', { targetUrl: target });
      links[it.productId] = j.data.mylink;
      fs.writeFileSync(CACHE, JSON.stringify(links, null, 1));
      await sleep(700);
    }
    const global = it.type === 'GLOBAL';
    ads.push({
      country: global ? '*' : it.title,
      title: global ? '해외여행 eSIM' : it.title + ' 여행 eSIM',
      sub: '도착해서 바로 쓰는 데이터 · 마이리얼트립',
      url: links[it.productId],
      img: it.imageUrl || '', ratio: '513/300', pos: 'center',
    });
  }
  const head = [
    '// 해카 홈 광고 목록 — 손으로 고치지 말 것. tools/mrt/make-ads.js 가 만든다(매달 자동 실행).',
    '// 마이리얼트립 마이심(나라별 eSIM). url 은 파트너 코드가 든 홍보 링크, img 는 마이리얼트립이 내려주는 나라 사진.',
    '// country 는 매장 자료의 나라 이름과 같다. "*" 는 그 나라 광고가 없을 때 쓰는 전 세계용.',
    '// 만든 날 ' + new Date().toISOString().slice(0, 10) + ' · ' + ads.length + '개',
  ].join('\n');
  fs.writeFileSync(OUT, head + '\nwindow.HK_ADS = ' + JSON.stringify(ads, null, 1) + ';\n');
  console.log('광고', ads.length, '개 /', ads.filter((a) => !a.img).length, '개는 사진 없음');
})().catch((e) => console.log('실패:', e.message));
