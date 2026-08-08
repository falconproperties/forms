// ============================================================
// FORMS BY FALCON PROPERTIES — Core module
// Firebase init + shared helpers (auth, IP gate, toast, slug)
// ============================================================

// -------- 1. FIREBASE CONFIG --------
// Replace with YOUR Firebase project config (Project settings → General → Your apps → SDK config)
export const firebaseConfig = {
  apiKey: "AIzaSyDLsUleGLDtg7mWE4Lq9ux41F0jvhLg3FE",
  authDomain: "forms-app-db7a8.firebaseapp.com",
  projectId: "forms-app-db7a8",
  storageBucket: "forms-app-db7a8.firebasestorage.app",
  messagingSenderId: "286599353494",
  appId: "1:286599353494:web:c3831788c53292eb185eb7"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs,
  query, where, orderBy, serverTimestamp, onSnapshot
};

// -------- 2. TOAST --------
export function toast(msg, isError=false){
  let el = document.getElementById('__toast');
  if(!el){
    el = document.createElement('div');
    el.id = '__toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('error', !!isError);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove('show'), 3200);
}

// -------- 3. RANDOM SLUG (public form link + submission ids) --------
// 12-char, unambiguous alphabet (no 0/O/1/l/I), collision-resistant enough for this use.
const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export function randomSlug(len=12){
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for(let i=0;i<len;i++) out += SLUG_ALPHABET[arr[i] % SLUG_ALPHABET.length];
  return out;
}

// -------- 4. IP GATE --------
// Client-side IP check against Firestore `ipWhitelist` collection.
// NOTE: this is a deterrent, not a hard security boundary — a determined user
// can bypass client-side checks. For a hard boundary, move this check into a
// Cloud Function (Blaze plan) that reads req headers server-side.
export async function getClientIP(){
  try{
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  }catch(e){
    console.error('IP lookup failed', e);
    return null;
  }
}

export async function isIPAllowed(ip){
  if(!ip) return false;
  const snap = await getDoc(doc(db, 'ipWhitelist', ip));
  return snap.exists() && snap.data().active === true;
}

// Call at the top of any gated page. Redirects away if IP not whitelisted.
// Super admin's own IP should be added to ipWhitelist at setup time (see README).
export async function enforceIPGate(redirectTo='blocked.html'){
  const ip = await getClientIP();
  const allowed = await isIPAllowed(ip);
  if(!allowed){
    sessionStorage.setItem('__blockedIP', ip || 'unknown');
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

// -------- 5. FIELD TYPE REGISTRY (shared between builder + renderer) --------
export const FIELD_TYPES = [
  { type:'short_text',   label:'Short Text',      icon:'▁' },
  { type:'long_text',    label:'Paragraph',       icon:'☰' },
  { type:'email',        label:'Email',           icon:'@' },
  { type:'phone',        label:'Phone',           icon:'☎' },
  { type:'number',       label:'Number',          icon:'#' },
  { type:'date',         label:'Date',            icon:'▦' },
  { type:'time',         label:'Time',            icon:'◔' },
  { type:'dropdown',     label:'Dropdown',        icon:'▾' },
  { type:'radio',        label:'Single Choice',   icon:'◉' },
  { type:'checkbox',     label:'Multi Choice',    icon:'☑' },
  { type:'tickbox',      label:'Single Tickbox',  icon:'✓' },
  { type:'scale',        label:'Level / Slider',  icon:'⟷' },
  { type:'rating',       label:'Star Rating',     icon:'★' },
  { type:'nps',          label:'NPS (0–10)',      icon:'⑩' },
  { type:'ranking',      label:'Ranking',         icon:'⇅' },
  { type:'matrix',       label:'Matrix Grid',     icon:'▦' },
  { type:'file',         label:'File Upload',     icon:'⇧' },
  { type:'signature',    label:'Signature',       icon:'✎' },
  { type:'address',      label:'Address',         icon:'⌂' },
  { type:'section',      label:'Section Break',   icon:'—' },
  { type:'page_break',   label:'Page Break',      icon:'⏭' },
  { type:'image_block',  label:'Image / Media',   icon:'▣' },
  { type:'hidden',       label:'Hidden Field',    icon:'⋯' },
];
