import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { collection, addDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

let profile=null, appointments=[], patients=[];
const $=id=>document.getElementById(id);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canSeeAll=()=>profile?.role==='admin';
const canEditClinical=()=>['admin','doctor'].includes(profile?.role);

onAuthStateChanged(auth,async user=>{
  if(!user){location.href='login.html';return;}
  const snap=await getDoc(doc(db,'users',user.uid));
  if(!snap.exists()){await signOut(auth);return;}
  profile={uid:user.uid,...snap.data()};
  if(!['admin','doctor','receptionist','staff'].includes(profile.role)){await signOut(auth);return;}
  $('welcome').textContent=`Welcome, ${profile.displayName||profile.name||'Staff'}`;
  $('roleLabel').textContent=profile.role==='admin'?'Admin Portal':profile.role==='doctor'?'Doctor Portal':'Staff Portal';
  $('clinicName').textContent=profile.branch||'Both';
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=profile.role==='admin'?'':'none');
  subscribeAppointments(); subscribePatients();
});

function subscribeAppointments(){
  let q=query(collection(db,'appointments'),orderBy('date','desc'));
  onSnapshot(q,s=>{appointments=s.docs.map(d=>({id:d.id,...d.data()}));renderAppointments();},console.error);
}
function subscribePatients(){
  onSnapshot(query(collection(db,'patients'),orderBy('updatedAt','desc')),s=>{patients=s.docs.map(d=>({id:d.id,...d.data()}));renderPatients();},console.error);
}
function permittedAppointment(a){
  if(canSeeAll())return true;
  if(profile.role==='doctor')return a.doctorId===profile.uid;
  return !profile.branch||profile.branch==='Both'||a.branch===profile.branch;
}
function permittedPatient(p){return canSeeAll()||!profile.branch||profile.branch==='Both'||p.branch===profile.branch;}
function renderAppointments(){
  const q=$('appointmentSearch').value.toLowerCase(), branch=$('branchFilter').value,status=$('statusFilter').value;
  const list=appointments.filter(permittedAppointment).filter(a=>(!branch||a.branch===branch)&&(!status||a.status===status)&&`${a.reference} ${a.patientName} ${a.phone}`.toLowerCase().includes(q));
  $('appointmentRows').innerHTML=list.map(a=>`<tr><td><strong>${esc(a.patientName)}</strong><br><small>${esc(a.reference)} • ${esc(a.phone)}</small></td><td>${esc(a.branch)}</td><td>${esc(a.doctorName)}</td><td>${esc(a.date)}<br><small>${esc(a.time)}–${esc(a.endTime)}</small></td><td>${esc(a.treatment)}</td><td><select class="status-select" data-id="${a.id}"><option ${a.status==='Pending confirmation'?'selected':''}>Pending confirmation</option><option ${a.status==='Confirmed'?'selected':''}>Confirmed</option><option ${a.status==='Checked in'?'selected':''}>Checked in</option><option ${a.status==='Completed'?'selected':''}>Completed</option><option ${a.status==='No-show'?'selected':''}>No-show</option><option ${a.status==='Cancelled'?'selected':''}>Cancelled</option></select></td></tr>`).join('');
  document.querySelectorAll('.status-select').forEach(s=>s.onchange=()=>updateDoc(doc(db,'appointments',s.dataset.id),{status:s.value,updatedAt:serverTimestamp()}));
  const today=new Date().toISOString().slice(0,10), allowed=appointments.filter(permittedAppointment);
  $('todayCount').textContent=allowed.filter(a=>a.date===today).length;
  $('pendingCount').textContent=allowed.filter(a=>a.status==='Pending confirmation').length;
}
function renderPatients(){
  const q=$('patientSearch').value.toLowerCase();
  const list=patients.filter(permittedPatient).filter(p=>`${p.patientId} ${p.firstName} ${p.lastName} ${p.phone}`.toLowerCase().includes(q));
  $('patientGrid').innerHTML=list.map(p=>`<article class="patient-card"><small>${esc(p.patientId)}</small><h3>${esc(p.firstName)} ${esc(p.lastName)}</h3><p>${esc(p.phone)}<br>${esc(p.branch)} • ${esc(p.preferredLanguage||'English')}</p><button data-patient="${p.id}">Open sheet</button></article>`).join('');
  document.querySelectorAll('[data-patient]').forEach(b=>b.onclick=()=>openPatient(b.dataset.patient));
  $('patientCount').textContent=patients.filter(permittedPatient).length;
}
function openPatient(id=''){
  const p=patients.find(x=>x.id===id)||{}; const f=$('patientForm'); f.reset();
  for(const [k,v] of Object.entries(p))if(f.elements[k])f.elements[k].value=v||'';
  f.elements.id.value=id; $('patientDialog').showModal();
}
$('patientForm').addEventListener('submit',async e=>{
  e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget)); const id=data.id; delete data.id;
  data.updatedAt=serverTimestamp();
  if(id)await updateDoc(doc(db,'patients',id),data); else {data.patientId=`ACU-P-${Date.now().toString().slice(-7)}`;data.createdAt=serverTimestamp();data.archived=false;await addDoc(collection(db,'patients'),data);}
  $('patientDialog').close();
});
$('newPatientBtn').onclick=()=>openPatient();
$('logoutBtn').onclick=()=>signOut(auth);
['appointmentSearch','branchFilter','statusFilter'].forEach(id=>$(id).addEventListener('input',renderAppointments));
$('patientSearch').addEventListener('input',renderPatients);
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');['appointments','patients','staff'].forEach(v=>$(v+'View').classList.toggle('hidden',v!==b.dataset.view));$('pageTitle').textContent=b.textContent;});
$('language').value=localStorage.getItem('acucarePortalLanguage')||'en';$('language').onchange=e=>localStorage.setItem('acucarePortalLanguage',e.target.value);
