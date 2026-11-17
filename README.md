# Meridian Care — Hospital Appointment Booking Demo

A responsive, front-end demonstration of a fictional hospital appointment request and staff-management workflow.

## Run locally

No build step, package installation, database server, or paid service is required.

1. Extract the ZIP file.
2. Open `index.html` in a modern browser.
3. Select **Staff portal** to open the staff login.

For the most reliable local testing, serve the folder with any static web server (for example, VS Code Live Server or `python -m http.server 8000`) and visit `http://localhost:8000`.

## Demo staff credentials

- Username: `admin`
- Password: `MeridianDemo24`

## Included

- Patient appointment request form with required-field, phone, email, and past-date validation.
- Unique appointment reference generation and confirmation summary.
- Staff login demonstration.
- Dashboard totals for total, pending, confirmed, and cancelled appointments.
- Appointment details modal and status actions: Pending → Confirmed / Cancelled; Confirmed → Completed / Cancelled.
- Search by patient name or appointment reference.
- Status and appointment-date filters.
- Six fictional sample appointments across four fictional departments.
- Responsive layouts for desktop, tablet, and mobile.
- Developer WhatsApp contact in the footer.

## Data and security limitations

This is a **front-end demo**, not a production hospital system.

- Appointment records are saved in the browser's `localStorage` on the device/browser where they were created.
- Staff login is a demonstration-only client-side gate. Credentials are visible in `app.js` and are not secure authentication.
- There is no shared database, server-side validation, access control, audit log, email/SMS notification, backup, or cross-device synchronization.
- Clearing browser storage removes locally saved demo appointments.
- Do not enter real patient information or use this demo for clinical operations.

A production deployment must use a secure backend, server-side authentication and authorization, encrypted transport, validated persistence, audit logging, backups, and appropriate privacy/security controls.

## Project files

- `index.html` — page structure and interfaces
- `styles.css` — visual design and responsive styling
- `app.js` — demo data, validation, local persistence, login, filters, and appointment workflow
