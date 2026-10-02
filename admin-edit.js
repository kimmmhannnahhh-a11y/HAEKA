// 운영자 전용 — 가게 상세에서 매장 정보를 바로 고친다
// 운영자 판단은 관리자 페이지와 같다: admin_users/{uid} 문서가 있으면 운영자
// 일반 사용자에게는 버튼조차 보이지 않는다
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const app = getApps()[0] || initializeApp({
  apiKey: "AIzaSyCmcsC_89TfZUIhgH6hKPaTKlXQn3rRzCo",
  authDomain: "card-store-finder.firebaseapp.com",
  projectId: "card-store-finder",
  storageBucket: "card-store-finder.firebasestorage.app",
  messagingSenderId: "340038449458",
  appId: "1:340038449458:web:14c3327a26d0d2892f3f2b"
});
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

const CATS = ['식당', '카페', '술집', '패스트푸드', '편의점', '마트', '호텔', '쇼핑', '입장권', 'ATM', '기타'];
const OK = ['VISA', 'MASTER', 'JCB', 'AMEX', 'UnionPay', '트래블로그', '트래블월렛', '카드가능', '현금가능'];
const NO = ['카드불가', 'VISA', 'MASTER', 'JCB', 'AMEX', 'UnionPay', '트래블로그', '트래블월렛', '현금불가'];

const storeId = new URLSearchParams(location.search).get('id');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

onAuthStateChanged(auth, async u => {
  if (!u || !storeId) return;
  try {
    const a = await getDoc(doc(db, 'admin_users', u.uid));
    if (a.exists()) addButton();
  } catch (e) {}
});

function addButton() {
  if (document.getElementById('admin-edit-btn')) return;
  const btns = document.getElementById('bottom-btns');
  if (!btns) return;
  const b = document.createElement('button');
  b.id = 'admin-edit-btn';
  b.className = 'btn-report';
  b.textContent = '운영자 수정';
  b.style.cssText = 'background:#111827!important;color:#fff!important;border-color:#111827!important';
  b.onclick = openEditor;
  btns.insertBefore(b, btns.firstChild);
}

// 사진은 긴 변 1280px JPEG 으로 줄여 올린다
function shrink(file) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? ok(b) : fail(new Error('변환 실패')), 'image/jpeg', 0.82);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => fail(new Error('사진을 읽지 못했어요'));
    img.src = URL.createObjectURL(file);
  });
}

async function openEditor() {
  const snap = await getDoc(doc(db, 'stores', storeId));
  if (!snap.exists()) { alert('매장을 찾지 못했어요'); return; }
  const s = snap.data();
  let images = (s.images || []).slice();
  const okSet = new Set(s.payOk || []), noSet = new Set(s.payNo || []);

  const wrap = document.createElement('div');
  wrap.id = 'admin-edit';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center';
  const lbl = t => '<div style="font-size:12px;font-weight:800;color:#374151;margin:16px 0 6px">' + t + '</div>';
  const inp = 'width:100%;box-sizing:border-box;border:1px solid #D1D5DB;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit';
  const chip = (group, v, on) => '<label style="display:inline-flex;align-items:center;gap:4px;margin:0 6px 6px 0;padding:6px 10px;border:1px solid #D1D5DB;border-radius:999px;font-size:12px;font-weight:700"><input type="checkbox" data-g="' + group + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '>' + esc(v) + '</label>';

  wrap.innerHTML =
    '<div style="background:#fff;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:18px 18px 24px;box-sizing:border-box">'
    + '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">운영자 수정</b><button id="ae-close" style="border:0;background:none;font-size:22px;cursor:pointer">✕</button></div>'
    + lbl('사진') + '<div id="ae-imgs" style="display:flex;flex-wrap:wrap;gap:6px"></div>'
    + '<label style="display:inline-block;margin-top:8px;padding:8px 12px;background:#F3F4F6;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">사진 추가<input id="ae-file" type="file" accept="image/*" multiple style="display:none"></label>'
    + '<span id="ae-up" style="font-size:12px;color:#6B7280;margin-left:8px"></span>'
    + lbl('이름') + '<input id="ae-name" style="' + inp + '" value="' + esc(s.name) + '">'
    + lbl('현지 이름') + '<input id="ae-local" style="' + inp + '" value="' + esc(s.nameLocal) + '">'
    + lbl('업종') + '<select id="ae-cat" style="' + inp + '">' + CATS.concat(CATS.indexOf(s.category) < 0 && s.category ? [s.category] : []).map(c => '<option' + (c === s.category ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select>'
    + lbl('종류 (라멘·수족관 등)') + '<input id="ae-cui" style="' + inp + '" value="' + esc(s.cuisine) + '">'
    + lbl('결제 가능') + '<div>' + OK.map(v => chip('ok', v, okSet.has(v))).join('') + '</div>'
    + lbl('결제 불가') + '<div>' + NO.map(v => chip('no', v, noSet.has(v))).join('') + '</div>'
    + lbl('비고') + '<textarea id="ae-note" rows="3" style="' + inp + ';resize:vertical">' + esc(s.note) + '</textarea>'
    + '<label style="display:flex;align-items:center;gap:8px;margin-top:16px;font-size:13px;font-weight:700;color:#B91C1C"><input id="ae-closed" type="checkbox"' + (s.closed ? ' checked' : '') + '>폐업</label>'
    + '<button id="ae-save" style="width:100%;margin-top:20px;padding:14px;border:0;border-radius:12px;background:#FF3900;color:#fff;font-size:15px;font-weight:800;cursor:pointer">저장</button>'
    + '</div>';
  document.body.appendChild(wrap);
  const $ = id => wrap.querySelector('#' + id);

  const drawImgs = () => {
    $('ae-imgs').innerHTML = images.map((u, i) =>
      '<div style="position:relative;width:76px;height:76px"><img src="' + esc(u) + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px">'
      + '<button data-del="' + i + '" style="position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:0;background:#111;color:#fff;font-size:12px;cursor:pointer">✕</button></div>').join('')
      || '<span style="font-size:12px;color:#9CA3AF">사진 없음</span>';
  };
  drawImgs();
  $('ae-imgs').onclick = e => {
    const i = e.target.getAttribute('data-del');
    if (i == null) return;
    images.splice(+i, 1); drawImgs();
  };
  $('ae-file').onchange = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (let i = 0; i < files.length; i++) {
      $('ae-up').textContent = '올리는 중 ' + (i + 1) + '/' + files.length;
      try {
        const blob = await shrink(files[i]);
        const r = ref(storage, 'stores/admin_' + Date.now() + '_' + i + '.jpg');
        await uploadBytes(r, blob, { contentType: 'image/jpeg' });
        images.push(await getDownloadURL(r));
        drawImgs();
      } catch (err) { alert('사진 업로드 실패: ' + err.message); }
    }
    $('ae-up').textContent = '';
  };
  $('ae-close').onclick = () => wrap.remove();
  wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };

  $('ae-save').onclick = async () => {
    const pick = g => Array.from(wrap.querySelectorAll('input[data-g="' + g + '"]:checked')).map(x => x.value);
    const data = {
      name: $('ae-name').value.trim(),
      nameLocal: $('ae-local').value.trim(),
      category: $('ae-cat').value,
      cuisine: $('ae-cui').value.trim(),
      payOk: pick('ok'),
      payNo: pick('no'),
      note: $('ae-note').value.trim(),
      closed: $('ae-closed').checked,
      images: images,
    };
    if (!data.name) { alert('이름은 비울 수 없어요'); return; }
    $('ae-save').disabled = true; $('ae-save').textContent = '저장 중…';
    try {
      await updateDoc(doc(db, 'stores', storeId), data);
      try { window.clearStoreCache && window.clearStoreCache(); sessionStorage.removeItem('haeka_stores_cache'); } catch (e) {}
      location.reload();
    } catch (err) {
      alert('저장 실패: ' + err.message);
      $('ae-save').disabled = false; $('ae-save').textContent = '저장';
    }
  };
}
