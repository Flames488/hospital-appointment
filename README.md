# Meridian Care Center — Hospital Demonstration

A responsive front-end prototype demonstrating a patient-to-hospital appointment workflow. It includes patient booking, staff appointment management, patient profiles and history, operational charts, historical CSV/Excel import, and a guided presentation script.

## Run locally
1. Extract the ZIP.
2. Open `index.html` in a modern browser, or serve the folder with VS Code Live Server / `python -m http.server 8000`.
3. Choose **Staff portal** and use the demo credentials below.

## Staff demo access
- Username: `admin`
- Password: `MeridianDemo24`

## Demonstration features
- Patient appointment request form with validation and a unique reference.
- Requests begin as **Pending**; staff can confirm, cancel, or mark confirmed appointments as completed.
- Staff dashboard with search, status/date filters and appointment details.
- Patient directory grouped by phone number (or name when phone is unavailable), with appointment history.
- Analytics for monthly appointment-date volume and department statistics.
- CSV export of stored appointment records.
- CSV and Excel (`.xlsx` / `.xls`) import, with a downloadable CSV template. Excel parsing uses SheetJS from a CDN and therefore requires internet access; CSV import works without that library.
- Patient-facing workflow explainer and staff walkthrough with a ready-to-record ~90-second video script and copy control.
- Responsive desktop, tablet and mobile layouts.

## Import format
The first row must contain headings. Recognised aliases include:
- Patient name: `name`, `patient name`, `full name`, `patient`
- Phone: `phone`, `phone number`, `mobile`
- Email: `email`, `email address`
- Department: `department`, `service`, `specialty`
- Appointment date: `date`, `appointment date`, `visit date`
- Time: `time`, `appointment time`, `visit time`
- Optional: `reason`, `notes`, `status`, `id`, `reference`

Use ISO dates (`YYYY-MM-DD`) for the most reliable CSV imports. Imported records are added to the current browser dataset; matching appointment references are skipped.

## Important limitations — not production software
This is a **browser-only demonstration**. Data is stored in `localStorage` on the current browser/device. It is not a shared hospital database and does not synchronize across staff devices. Demo credentials and the login gate are client-side and are not secure. There is no server-side validation, role-based access, audit trail, backup, encryption at rest, email/SMS notification, appointment-slot locking, or clinical record integration.

Do not enter real patient or clinical information. Before any real hospital deployment, replace the demo storage and login with a secure backend, authenticated and authorized staff accounts, encrypted transport and storage, audit logging, backup/recovery, privacy controls, consent workflows, and tested operational procedures. Have the deployment reviewed against applicable Nigerian data protection and health-sector requirements.

## Project files
- `index.html` — patient booking, staff portal and demo walkthrough
- `styles.css` — responsive interface and extended workspace styles
- `app.js` — original appointment workflow and demo authentication
- `enhancements.js` — patient records, analytics, import/export and walkthrough interactions
- `README.md` — setup, import and limitations
