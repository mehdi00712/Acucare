# AcuCare Firebase Website

This version is connected to Firebase project `acucare-d23bd` and includes:

- Public booking by branch, doctor, date and time
- One-hour appointment locking that prevents overlaps for the same doctor
- Slots: 09:00, 10:00, 11:00, 13:30, 14:00, 15:00, 16:00, 17:00, 18:00
- Secure login for admin, doctor, receptionist and staff
- Searchable patient records
- English, French and Chinese language preference storage
- Firestore and Storage security rule files

## Firebase Console setup

1. Enable **Authentication > Email/Password**.
2. Create the first admin account in Authentication.
3. In Firestore, create `users/{AUTH_UID}` with:

```json
{
  "displayName": "AcuCare Administrator",
  "role": "admin",
  "branch": "Both",
  "active": true
}
```

4. Create doctor Authentication accounts, then create `users/{DOCTOR_UID}` documents:

```json
{
  "displayName": "Doctor Name",
  "role": "doctor",
  "branch": "Ebène",
  "active": true
}
```

Use `Port Louis` or `Both` where appropriate. Only active doctor records are shown on the public booking form.

5. Publish `firestore.rules` in Firestore Rules.
6. Publish `storage.rules` in Storage Rules.
7. Upload the site to Firebase Hosting, GitHub Pages or another static host.

## Main pages

- `index.html` – public site and booking
- `login.html` – staff login
- `portal.html` – role-based clinical portal

Medical records are sensitive. Before production use, review the rules with a security professional, enable App Check, set up backups, define retention policies and confirm compliance with Mauritius data-protection requirements.
