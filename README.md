# AcuCare Website

Responsive clinic website with:
- First-visit clinic selector for Ebène or Port Louis
- Treatment and location sections
- Online appointment request form
- WhatsApp hand-off to the selected branch
- Demo admin dashboard with status updates and CSV export

## Run
Open `index.html` directly, or use VS Code Live Server.

## Demo booking storage
Appointments are stored in browser `localStorage`. This is suitable for demonstrating the complete flow, but not for production use across devices.

## Production setup recommended
Connect the booking form to Firebase Firestore or another secure backend, add Firebase Authentication to `admin.html`, configure email/WhatsApp notifications, and publish a privacy policy. Patient medical details should be kept minimal and protected appropriately.

## Verified public details used
- Ebène: Lot E406, Rue des Arts, Ebène
- Ebène phone: +230 5485 7000
- Port Louis phone: +230 5518 0888
- Email: acucare88@gmail.com
- Working hours shown: Monday–Sunday, 09:30–20:00

Confirm the exact Port Louis street address before production launch.
