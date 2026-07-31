const gate = document.getElementById('locationGate');
const branchSelect = document.getElementById('branchSelect');
const selectedClinicDisplay = document.getElementById('selectedClinicDisplay');
const heroBranch = document.getElementById('heroBranch');
const toast = document.getElementById('toast');
const bookingForm = document.getElementById('bookingForm');

const branchInfo = {
  'Ebène': { phone: '54857000', display: 'Ebène Clinic' },
  'Port Louis': { phone: '55180888', display: 'Port Louis Clinic' }
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function openGate() {
  gate.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeGate() {
  gate.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function setBranch(branch, scrollToBooking = false) {
  if (!branchInfo[branch]) return;
  localStorage.setItem('acucareSelectedBranch', branch);
  branchSelect.value = branch;
  selectedClinicDisplay.textContent = branchInfo[branch].display;
  heroBranch.textContent = branchInfo[branch].display;
  document.getElementById('changeLocation').textContent = branch;
  closeGate();
  if (scrollToBooking) document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('.location-choice').forEach(button => {
  button.addEventListener('click', () => setBranch(button.dataset.branch, true));
});

document.querySelectorAll('.branch-book').forEach(button => {
  button.addEventListener('click', () => setBranch(button.dataset.branch, true));
});

document.querySelectorAll('.book-treatment').forEach(button => {
  button.addEventListener('click', () => {
    document.getElementById('treatmentSelect').value = button.dataset.treatment;
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('changeLocation').addEventListener('click', openGate);
document.getElementById('bookingChangeClinic').addEventListener('click', openGate);
branchSelect.addEventListener('change', () => setBranch(branchSelect.value));

const savedBranch = localStorage.getItem('acucareSelectedBranch');
if (savedBranch) setBranch(savedBranch); else setTimeout(openGate, 350);

const dateInput = document.getElementById('appointmentDate');
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().split('T')[0];

bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(bookingForm).entries());
  data.id = `ACU-${Date.now().toString().slice(-8)}`;
  data.status = 'Pending confirmation';
  data.createdAt = new Date().toISOString();

  const appointments = JSON.parse(localStorage.getItem('acucareAppointments') || '[]');
  appointments.unshift(data);
  localStorage.setItem('acucareAppointments', JSON.stringify(appointments));

  const phone = branchInfo[data.branch].phone;
  const text = encodeURIComponent(`Hello AcuCare, I would like to request an appointment.\n\nReference: ${data.id}\nName: ${data.firstName} ${data.lastName}\nClinic: ${data.branch}\nTreatment: ${data.treatment}\nPreferred date: ${data.date}\nPreferred time: ${data.time}\nPhone: ${data.phone}\nMessage: ${data.message || 'N/A'}`);

  showToast(`Appointment request ${data.id} saved. Opening WhatsApp…`);
  setTimeout(() => window.open(`https://wa.me/230${phone}?text=${text}`, '_blank', 'noopener'), 700);
  bookingForm.reset();
  setBranch(data.branch);
});

document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('mainNav').classList.toggle('open'));
document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => document.getElementById('mainNav').classList.remove('open')));

document.getElementById('year').textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
