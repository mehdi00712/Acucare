import { db } from './firebase-config.js';
import {
  collection, doc, getDocs, query, where, runTransaction,
  serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const gate = document.getElementById('locationGate');
const branchSelect = document.getElementById('branchSelect');
const doctorSelect = document.getElementById('doctorSelect');
const timeSelect = document.getElementById('timeSelect');
const selectedClinicDisplay = document.getElementById('selectedClinicDisplay');
const heroBranch = document.getElementById('heroBranch');
const toast = document.getElementById('toast');
const bookingForm = document.getElementById('bookingForm');
const dateInput = document.getElementById('appointmentDate');

const SLOT_STARTS = ['09:00','10:00','11:00','13:30','14:00','15:00','16:00','17:00','18:00'];
const branchInfo = {
  'Ebène': { phone: '54857000', display: 'Ebène Clinic' },
  'Port Louis': { phone: '55180888', display: 'Port Louis Clinic' }
};
let doctors = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}
function openGate(){ gate.classList.add('open'); document.body.classList.add('modal-open'); }
function closeGate(){ gate.classList.remove('open'); document.body.classList.remove('modal-open'); }

async function loadDoctors() {
  doctorSelect.innerHTML = '<option value="">Loading doctors…</option>';
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'doctor'), where('active', '==', true)));
    doctors = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderDoctors();
  } catch (error) {
    console.error(error);
    doctorSelect.innerHTML = '<option value="">Doctors unavailable</option>';
    showToast('Firebase is connected, but doctor records or Firestore rules still need setup.');
  }
}

function renderDoctors() {
  const branch = branchSelect.value;
  const list = doctors.filter(d => !branch || d.branch === branch || d.branch === 'Both');
  doctorSelect.innerHTML = '<option value="">Select doctor</option>' + list.map(d =>
    `<option value="${d.id}">${d.displayName || d.name || 'Doctor'}${d.branch === 'Both' ? '' : ` — ${d.branch || ''}`}</option>`
  ).join('');
  renderTimes();
}

function setBranch(branch, scrollToBooking=false) {
  if (!branchInfo[branch]) return;
  localStorage.setItem('acucareSelectedBranch', branch);
  branchSelect.value = branch;
  selectedClinicDisplay.textContent = branchInfo[branch].display;
  heroBranch.textContent = branchInfo[branch].display;
  document.getElementById('changeLocation').textContent = branch;
  renderDoctors();
  closeGate();
  if (scrollToBooking) document.getElementById('booking').scrollIntoView({behavior:'smooth'});
}

function addMinutes(time, minutes) {
  const [h,m] = time.split(':').map(Number);
  const total = h*60+m+minutes;
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function lockIds(doctorId, date, start) {
  return [start, addMinutes(start,30)].map(t => `${doctorId}_${date}_${t.replace(':','')}`);
}

async function renderTimes() {
  const doctorId = doctorSelect.value;
  const date = dateInput.value;
  if (!doctorId || !date) {
    timeSelect.innerHTML = '<option value="">Select doctor and date first</option>';
    return;
  }
  timeSelect.innerHTML = '<option value="">Checking availability…</option>';
  try {
    const lockSnap = await getDocs(query(collection(db,'bookingLocks'), where('doctorId','==',doctorId), where('date','==',date)));
    const occupied = new Set(lockSnap.docs.map(d => d.id));
    const available = SLOT_STARTS.filter(start => lockIds(doctorId,date,start).every(id => !occupied.has(id)));
    timeSelect.innerHTML = '<option value="">Select time</option>' + available.map(t => `<option>${t}</option>`).join('');
    if (!available.length) timeSelect.innerHTML = '<option value="">No available times</option>';
  } catch (error) {
    console.error(error);
    timeSelect.innerHTML = '<option value="">Could not load availability</option>';
  }
}

async function createBooking(data) {
  const appointmentRef = doc(collection(db,'appointments'));
  const patientRef = doc(collection(db,'patients'));
  const locks = lockIds(data.doctorId, data.date, data.time).map(id => doc(db,'bookingLocks',id));
  const doctor = doctors.find(d => d.id === data.doctorId);
  await runTransaction(db, async tx => {
    for (const lockRef of locks) {
      const existing = await tx.get(lockRef);
      if (existing.exists()) throw new Error('SLOT_TAKEN');
    }
    const patientData = {
      patientId: `ACU-P-${patientRef.id.slice(0,8).toUpperCase()}`,
      firstName:data.firstName, lastName:data.lastName, phone:data.phone, email:data.email,
      branch:data.branch, preferredLanguage:data.language || 'English',
      createdAt:serverTimestamp(), updatedAt:serverTimestamp(), archived:false
    };
    tx.set(patientRef, patientData);
    tx.set(appointmentRef, {
      reference:`ACU-${appointmentRef.id.slice(0,8).toUpperCase()}`,
      patientId:patientRef.id,
      patientName:`${data.firstName} ${data.lastName}`,
      phone:data.phone, email:data.email, branch:data.branch,
      doctorId:data.doctorId, doctorName:doctor?.displayName || doctor?.name || 'Doctor',
      treatment:data.treatment, date:data.date, time:data.time,
      endTime:addMinutes(data.time,60), durationMinutes:60,
      message:data.message || '', status:'Pending confirmation', source:'website',
      createdAt:serverTimestamp(), updatedAt:serverTimestamp()
    });
    for (const lockRef of locks) tx.set(lockRef, {
      appointmentId:appointmentRef.id, doctorId:data.doctorId, date:data.date,
      startTime:data.time, createdAt:serverTimestamp()
    });
  });
  return { id:appointmentRef.id, ref:`ACU-${appointmentRef.id.slice(0,8).toUpperCase()}`, doctor };
}

document.querySelectorAll('.location-choice').forEach(b=>b.addEventListener('click',()=>setBranch(b.dataset.branch,true)));
document.querySelectorAll('.branch-book').forEach(b=>b.addEventListener('click',()=>setBranch(b.dataset.branch,true)));
document.querySelectorAll('.book-treatment').forEach(b=>b.addEventListener('click',()=>{
  document.getElementById('treatmentSelect').value=b.dataset.treatment;
  document.getElementById('booking').scrollIntoView({behavior:'smooth'});
}));
document.getElementById('changeLocation').addEventListener('click',openGate);
document.getElementById('bookingChangeClinic').addEventListener('click',openGate);
branchSelect.addEventListener('change',()=>setBranch(branchSelect.value));
doctorSelect.addEventListener('change',renderTimes);
dateInput.addEventListener('change',renderTimes);

const now = new Date(); now.setMinutes(now.getMinutes()-now.getTimezoneOffset()); dateInput.min=now.toISOString().split('T')[0];
const savedBranch=localStorage.getItem('acucareSelectedBranch'); if(savedBranch)setBranch(savedBranch);else setTimeout(openGate,350);
loadDoctors();

bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button=bookingForm.querySelector('[type="submit"]');
  const data=Object.fromEntries(new FormData(bookingForm).entries());
  button.disabled=true; button.textContent='Saving appointment…';
  try {
    const result=await createBooking(data);
    const phone=branchInfo[data.branch].phone;
    const text=encodeURIComponent(`Hello AcuCare, I submitted an appointment request.\n\nReference: ${result.ref}\nName: ${data.firstName} ${data.lastName}\nClinic: ${data.branch}\nDoctor: ${result.doctor?.displayName || result.doctor?.name || 'Selected doctor'}\nTreatment: ${data.treatment}\nDate: ${data.date}\nTime: ${data.time}\nPhone: ${data.phone}`);
    showToast(`Appointment ${result.ref} saved successfully.`);
    setTimeout(()=>window.open(`https://wa.me/230${phone}?text=${text}`,'_blank','noopener'),650);
    bookingForm.reset(); setBranch(data.branch); renderTimes();
  } catch(error) {
    console.error(error);
    showToast(error.message==='SLOT_TAKEN' ? 'That time was just booked. Please select another time.' : 'Could not save the booking. Check Firebase setup and try again.');
    renderTimes();
  } finally { button.disabled=false; button.innerHTML='Request appointment <span>→</span>'; }
});

document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('mainNav').classList.toggle('open'));
document.querySelectorAll('#mainNav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('mainNav').classList.remove('open')));
document.getElementById('year').textContent=new Date().getFullYear();
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
