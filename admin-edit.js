// 운영자 전용 — 가게 상세·여행톡 글에서 바로 고치고 지운다
// 운영자 판단은 관리자 페이지와 같다: admin_users/{uid} 문서가 있으면 운영자
// 일반 사용자에게는 버튼조차 보이지 않는다
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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

const id = new URLSearchParams(location.search).get('id');
const IS_POST = /heka_post_detail/.test(location.pathname);
const COL = IS_POST ? 'posts' : 'stores';

const STORE_CATS = ['식당', '카페', '술집', '패스트푸드', '편의점', '쇼핑', '마트', '입장권', '호텔', 'ATM', '기타'];
const POST_CATS = ['동행', '맛집', '날씨', '정보'];
const OK = ['VISA', 'MASTER', 'JCB', 'AMEX', 'UnionPay', '트래블로그', '트래블월렛', '알리페이', '위챗페이', '카드가능', '현금가능'];
const NO = ['카드불가', 'VISA', 'MASTER', 'JCB', 'AMEX', 'UnionPay', '트래블로그', '트래블월렛', '알리페이', '위챗페이', '현금불가'];

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

onAuthStateChanged(auth, async u => {
  if (!u || !id) return;
  try {
    const a = await getDoc(doc(db, 'admin_users', u.uid));
    if (a.exists()) addButtons();
  } catch (e) {}
});

function makeBtn(text, dark, onclick) {
  const b = document.createElement('button');
  b.textContent = text;
  b.onclick = onclick;
  return b;
}

function addButtons() {
  if (document.getElementById('admin-btns')) return;
  if (IS_POST) {
    // 여행톡: 상단 바 오른쪽(신고 버튼 앞)에 작게
    const bar = document.querySelector('.topbar');
    if (!bar) return;
    const box = document.createElement('div');
    box.id = 'admin-btns';
    box.style.cssText = 'display:flex;gap:4px;margin-left:auto';
    [['수정', openEditor], ['삭제', removeIt]].forEach(([t, fn]) => {
      const b = makeBtn(t, false, fn);
      b.style.cssText = 'border:0;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;'
        + (t === '삭제' ? 'background:#FEE2E2;color:#B91C1C' : 'background:#111827;color:#fff');
      box.appendChild(b);
    });
    const report = bar.querySelector('[onclick="reportPost()"]');
    bar.insertBefore(box, report || null);
  } else {
    // 가게 상세: 맨 아래 버튼 줄 앞에
    const btns = document.getElementById('bottom-btns');
    if (!btns) return;
    const box = document.createElement('span');
    box.id = 'admin-btns';
    box.style.cssText = 'display:contents';
    [['운영자 수정', openEditor, '#111827'], ['운영자 삭제', removeIt, '#B91C1C']].forEach(([t, fn, bg]) => {
      const b = makeBtn(t, true, fn);
      b.className = 'btn-report';
      b.style.cssText = 'background:' + bg + '!important;color:#fff!important;border-color:' + bg + '!important';
      box.appendChild(b);
    });
    btns.insertBefore(box, btns.firstChild);
  }
}

async function removeIt() {
  const what = IS_POST ? '이 글' : '이 매장';
  if (!confirm(what + '을 삭제할까요? 되돌릴 수 없어요.')) return;
  try {
    await deleteDoc(doc(db, COL, id));
    try { sessionStorage.removeItem('haeka_stores_cache'); } catch (e) {}
    alert('삭제했어요');
    location.href = IS_POST ? 'heka_yeohaengtok_v2.html' : 'heka_home_v5.html';
  } catch (err) { alert('삭제 실패: ' + err.message); }
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
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) { alert('찾지 못했어요'); return; }
  const s = snap.data();
  let images = (s.images || []).slice();

  const lbl = t => '<div style="font-size:12px;font-weight:800;color:#374151;margin:16px 0 6px">' + t + '</div>';
  const inp = 'width:100%;box-sizing:border-box;border:1px solid #D1D5DB;border-radius:10px;padding:10px 12px;font-size:14px;font-family:inherit';
  const select = (sid, list, cur) => '<select id="' + sid + '" style="' + inp + '">'
    + list.concat(cur && list.indexOf(cur) < 0 ? [cur] : []).map(c => '<option value="' + esc(c) + '"' + (c === cur ? ' selected' : '') + '>' + esc(c === '호텔' ? '숙소' : c) + '</option>').join('') + '</select>';
  const chip = (group, v, on) => '<label style="display:inline-flex;align-items:center;gap:4px;margin:0 6px 6px 0;padding:6px 10px;border:1px solid #D1D5DB;border-radius:999px;font-size:12px;font-weight:700"><input type="checkbox" data-g="' + group + '" value="' + esc(v) + '"' + (on ? ' checked' : '') + '>' + esc(v) + '</label>';

  let fields;
  if (IS_POST) {
    fields = lbl('제목') + '<input id="ae-title" style="' + inp + '" value="' + esc(s.title) + '">'
      + lbl('분류') + select('ae-pcat', POST_CATS, s.category)
      + lbl('도시') + '<input id="ae-city" style="' + inp + '" value="' + esc(s.city) + '">'
      + lbl('내용') + '<textarea id="ae-body" rows="8" style="' + inp + ';resize:vertical">' + esc(s.body) + '</textarea>';
  } else {
    const okSet = new Set(s.payOk || []), noSet = new Set(s.payNo || []);
    fields = lbl('이름') + '<input id="ae-name" style="' + inp + '" value="' + esc(s.name) + '">'
      + lbl('현지 이름') + '<input id="ae-local" style="' + inp + '" value="' + esc(s.nameLocal) + '">'
      + lbl('업종') + select('ae-cat', STORE_CATS, s.category)
      + lbl('종류 (라멘·수족관 등)') + '<input id="ae-cui" style="' + inp + '" value="' + esc(s.cuisine) + '">'
      + lbl('결제 가능') + '<div>' + OK.map(v => chip('ok', v, okSet.has(v))).join('') + '</div>'
      + lbl('결제 불가') + '<div>' + NO.map(v => chip('no', v, noSet.has(v))).join('') + '</div>'
      + lbl('비고') + '<textarea id="ae-note" rows="3" style="' + inp + ';resize:vertical">' + esc(s.note) + '</textarea>'
      + '<label style="display:flex;align-items:center;gap:8px;margin-top:16px;font-size:13px;font-weight:700;color:#B91C1C"><input id="ae-closed" type="checkbox"' + (s.closed ? ' checked' : '') + '>폐업</label>';
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center';
  wrap.innerHTML =
    '<div style="background:#fff;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:18px 18px 24px;box-sizing:border-box">'
    + '<div style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:16px">운영자 수정</b><button id="ae-close" style="border:0;background:none;font-size:22px;cursor:pointer">✕</button></div>'
    + lbl('사진') + '<div id="ae-imgs" style="display:flex;flex-wrap:wrap;gap:6px"></div>'
    + '<label style="display:inline-block;margin-top:8px;padding:8px 12px;background:#F3F4F6;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer">사진 추가<input id="ae-file" type="file" accept="image/*" multiple style="display:none"></label>'
    + '<span id="ae-up" style="font-size:12px;color:#6B7280;margin-left:8px"></span>'
    + fields
    + '<button id="ae-save" style="width:100%;margin-top:20px;padding:14px;border:0;border-radius:12px;background:#FF3900;color:#fff;font-size:15px;font-weight:800;cursor:pointer">저장</button>'
    + '</div>';
  document.body.appendChild(wrap);
  const $ = sid => wrap.querySelector('#' + sid);

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
        const r = ref(storage, (IS_POST ? 'posts/admin_' : 'stores/admin_') + Date.now() + '_' + i + '.jpg');
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
    let data;
    if (IS_POST) {
      data = { title: $('ae-title').value.trim(), category: $('ae-pcat').value, city: $('ae-city').value.trim(), body: $('ae-body').value, images };
      if (!data.title) { alert('제목은 비울 수 없어요'); return; }
    } else {
      const pick = g => Array.from(wrap.querySelectorAll('input[data-g="' + g + '"]:checked')).map(x => x.value);
      data = {
        name: $('ae-name').value.trim(), nameLocal: $('ae-local').value.trim(), category: $('ae-cat').value,
        cuisine: $('ae-cui').value.trim(), payOk: pick('ok'), payNo: pick('no'),
        note: $('ae-note').value.trim(), closed: $('ae-closed').checked, images
      };
      if (!data.name) { alert('이름은 비울 수 없어요'); return; }
    }
    $('ae-save').disabled = true; $('ae-save').textContent = '저장 중…';
    try {
      await updateDoc(doc(db, COL, id), data);
      try { sessionStorage.removeItem('haeka_stores_cache'); } catch (e) {}
      location.reload();
    } catch (err) {
      alert('저장 실패: ' + err.message);
      $('ae-save').disabled = false; $('ae-save').textContent = '저장';
    }
  };
}
