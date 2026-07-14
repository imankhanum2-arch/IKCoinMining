// ===== FIREBASE SHARED CONFIG & HELPERS =====
// Used by index.html, signup.html, forgot.html via <script type="module">

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, runTransaction, serverTimestamp, Timestamp,
  increment, query, where, orderBy, limit, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDytdW5oVU2oo-L2G236yZyowb_jgqkUCY",
  authDomain: "ikcoin-84455.firebaseapp.com",
  projectId: "ikcoin-84455",
  storageBucket: "ikcoin-84455.firebasestorage.app",
  messagingSenderId: "977650254013",
  appId: "1:977650254013:web:985f1de3eddd0b4c6fb7d4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset,
  onAuthStateChanged, signOut,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, addDoc, runTransaction, serverTimestamp, Timestamp, increment,
  query, where, orderBy, limit, getDocs, onSnapshot
};

// ===== EMAIL RELAY (Google Apps Script - sends OTP emails only) =====
// Deploy Code.gs as a Web App and paste the URL here.
export const RELAY_URL = 'https://script.google.com/macros/s/AKfycbxs-NnljH0Xx5fgJ58QHqHGBLT9hqr98vGj-EePCk0g_v5aijupgkFpHz_LBIi1-Cfy/exec';
export const RELAY_SECRET = 'ikcoin_change_this_secret_123'; // must match SHARED_SECRET in Code.gs

export async function sendOtpEmail(email, otp) {
  const url = new URL(RELAY_URL);
  url.searchParams.set('action', 'sendOtpEmail');
  url.searchParams.set('email', email);
  url.searchParams.set('otp', otp);
  url.searchParams.set('secret', RELAY_SECRET);
  return jsonpRequest(url);
}

// Apps Script Web Apps redirect internally when serving a response, and that
// redirect doesn't carry CORS headers — so fetch() gets blocked by the
// browser even though the script itself works fine. JSONP (a <script> tag)
// isn't subject to CORS at all, so it sidesteps the problem entirely.
function jsonpRequest(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const callbackName = 'ikcoin_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    url.searchParams.set('callback', callbackName);

    const script = document.createElement('script');
    let settled = false;

    const cleanup = () => {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      clearTimeout(timer);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ success: false, message: 'Request timed out' });
    }, timeoutMs);

    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.src = url.toString();
    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ success: false, message: 'Could not reach email relay' });
    };

    document.head.appendChild(script);
  });
}

// ===== MINING / COIN CONSTANTS =====
export const COIN_NAME = 'IK';
export const BASE_RATE = 10;
export const HALVING_INTERVAL = 10000;
export const MINE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const BLUE_TICK_LIMIT = 1000;
export const REFERRAL_BONUS = 1;

export function getCurrentRate(totalUsers) {
  const halvings = Math.floor(totalUsers / HALVING_INTERVAL);
  return BASE_RATE / Math.pow(2, halvings);
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Simple crypto-style wallet address, e.g. IKw_9f3ac1...
export function generateWalletAddress() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return 'IKw' + hex;
}

// Transaction ID, e.g. IK-20260711-4F9A2C
export function generateTID() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `IK-${y}${m}${d}-${rand}`;
}

// username -> { email, uid } lookup doc, stored at usernames/{username}
export function usernameDocRef(username) {
  return doc(db, 'usernames', String(username).toLowerCase());
}

export function userDocRef(uid) {
  return doc(db, 'users', uid);
}

export function statsDocRef() {
  return doc(db, 'meta', 'stats');
}
