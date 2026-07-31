import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
const form=document.getElementById('loginForm'),error=document.getElementById('error');
onAuthStateChanged(auth,async user=>{if(!user)return;const snap=await getDoc(doc(db,'users',user.uid));if(snap.exists()&&['admin','doctor','receptionist','staff'].includes(snap.data().role))location.href='portal.html';});
form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const data=Object.fromEntries(new FormData(form));try{await signInWithEmailAndPassword(auth,data.email,data.password)}catch(err){error.textContent='Invalid login or account not configured.'}});
