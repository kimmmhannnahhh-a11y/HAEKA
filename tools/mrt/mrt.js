// 마이리얼트립 파트너 API 호출 도우미.
// 키는 환경변수 MRT_API_KEY 에서 읽는다(GitHub 에서는 저장소 Secret). 저장소에 키를 적지 말 것.
// PC 에서 돌릴 때는 MRT_API_KEY_FILE 에 키 파일 경로를 주면 된다.
const fs = require('fs');
const KEY = (process.env.MRT_API_KEY || (process.env.MRT_API_KEY_FILE ? fs.readFileSync(process.env.MRT_API_KEY_FILE, 'utf8') : '')).trim();
if (!KEY) { console.error('MRT_API_KEY 가 없습니다'); process.exit(1); }
const BASE = 'https://partner-ext-api.myrealtrip.com';
async function mrt(method, path, body) {
  const r = await fetch(BASE + path, { method, headers: Object.assign({ Authorization: 'Bearer ' + KEY }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + JSON.stringify(j).slice(0, 200));
  return j;
}
module.exports = { mrt };
