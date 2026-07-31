import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3gNf4b4sCrL3H3MHSJ2_U-jloGMSc-KY",
  authDomain: "acucare-d23bd.firebaseapp.com",
  projectId: "acucare-d23bd",
  storageBucket: "acucare-d23bd.firebasestorage.app",
  messagingSenderId: "770423780038",
  appId: "1:770423780038:web:a5b8fbf15c12f9093b1dc7",
  measurementId: "G-W6SGY0F59R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
isSupported().then(ok => { if (ok) getAnalytics(app); }).catch(() => {});
