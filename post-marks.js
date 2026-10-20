// 여행톡 하트·찜을 계정(zzim/{uid} 문서)에 저장한다.
// 예전엔 폰(localStorage)에만 둬서 앱을 다시 깔거나 기록이 지워지면 찜 목록이 사라지고 하트가 풀렸다.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp({
  apiKey:"AIzaSyCmcsC_89TfZUIhgH6hKPaTKlXQn3rRzCo",
  authDomain:"card-store-finder.firebaseapp.com",
  projectId:"card-store-finder",
  storageBucket:"card-store-finder.firebasestorage.app",
  messagingSenderId:"340038449458",
  appId:"1:340038449458:web:14c3327a26d0d2892f3f2b"
});
const db = getFirestore(app);
const auth = getAuth(app);

function readLocal(key){ try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ return []; } }
function writeLocal(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }

// 로그인 안 했으면 null. 했으면 { uid, liked:[글id], saved:[글 요약] } — 계정에 있는 것이 기준
window._postMarks = (async function(){
  await auth.authStateReady();
  const u = auth.currentUser;
  if(!u) return null;
  const ref = doc(db, 'zzim', u.uid);
  let d = {};
  try{ const snap = await getDoc(ref); d = snap.exists() ? snap.data() : {}; }catch(e){ console.error('marks load:', e); return null; }
  let liked = d.likedPosts || [];
  let saved = d.savedPosts || [];
  if(!d.postsSynced){
    // 처음 한 번만: 이 폰에 남아 있던 하트·찜을 계정으로 옮긴다
    readLocal('haeka_liked_posts').forEach(function(id){ if(id && liked.indexOf(id)===-1) liked.push(id); });
    readLocal('haeka_saved_posts').forEach(function(p){ if(p && p.id && !saved.some(function(s){ return s.id===p.id; })) saved.push(p); });
    try{ await setDoc(ref, { likedPosts: liked, savedPosts: saved, postsSynced: true }, { merge: true }); }catch(e){ console.error('marks sync:', e); }
  }
  writeLocal('haeka_liked_posts', liked);
  writeLocal('haeka_saved_posts', saved);
  return { uid: u.uid, liked: liked, saved: saved };
})();

// fields: { likedPosts?: [...], savedPosts?: [...] }
window._savePostMarks = async function(fields){
  const u = auth.currentUser;
  if(fields.likedPosts) writeLocal('haeka_liked_posts', fields.likedPosts);
  if(fields.savedPosts) writeLocal('haeka_saved_posts', fields.savedPosts);
  if(!u) return;
  await setDoc(doc(db, 'zzim', u.uid), fields, { merge: true });
};
