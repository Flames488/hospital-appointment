# Meridian Care — Supabase-enabled Hospital Demonstration

This package preserves the existing Meridian Care patient-facing website and adds a shared Supabase/PostgreSQL data layer. It also keeps the original local browser demo as a fallback when Supabase is not configured.

## What is included

- Patient appointment form with validation and booking reference.
- Patient booking button that scrolls directly to the booking form.
- Staff sign-in using Supabase Auth in cloud mode.
- Appointment dashboard with search, filters, details, counters and status changes.
- Patient directory and appointment history, grouped from shared appointment records.
- Monthly and department analytics.
- CSV and Excel (`.csv`, `.xlsx`, `.xls`) historical appointment import.
- CSV export and import template.
- Live refresh of the staff dashboard when another device creates or updates an appointment.
- Database status history and audit log trigger.
- Local demo mode if `config.js` has empty Supabase values.

> This is a demonstration project. Use fictional data only. It is not a production electronic medical record or a clinical system. Do not upload real patient information.

## A. Create your Supabase project

1. Open [Supabase](https://supabase.com/) and create a project.
2. Save the database password securely. You do not need it in the website.
3. In the Supabase project, open **SQL Editor**.
4. Open `supabase/schema.sql` from this project, copy the complete file, paste it into SQL Editor and run it.
5. The script creates the appointment tables, staff access list, RLS policies, status history, audit log, indexes and Realtime publication entry. It also adds six fictional sample appointments.

The SQL script deliberately gives signed-out visitors permission to **insert pending appointment requests only**. It does not allow public reads of patient records. Only active users listed in `staff_profiles` can read and manage appointments.

## B. Create the staff login

1. In Supabase, open **Authentication → Users**.
2. Choose **Add user** and create:
   - Email: `admin@meridian-demo.test`
   - Password: choose a password for your demo
   - Confirm/auto-confirm the email if the dashboard offers that option for manually created users.
3. Copy the new user's **UUID** from the Users list.
4. Return to **SQL Editor** and run this statement, replacing the placeholder with the exact UUID:

```sql
insert into public.staff_profiles (id, full_name, role, is_active)
values ('PASTE-THE-AUTH-USER-UUID-HERE', 'Meridian Demo Administrator', 'admin', true)
on conflict (id) do update
set full_name = excluded.full_name, role = 'admin', is_active = true;
```

This staff profile step is required. Creating an Auth user alone does not grant access to patient bookings.

## C. Connect the website to Supabase

1. In Supabase, open **Project Settings → API** (or the API Keys section).
2. Copy the **Project URL**.
3. Copy the **publishable key**. A legacy `anon` public key also works with the browser client.
4. Open `config.js` in this project and replace the blank values:

```js
window.MERIDIAN_SUPABASE_CONFIG = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  publicKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
  staffEmail: "admin@meridian-demo.test"
};
```

**Never paste a Supabase secret key or legacy `service_role` key into `config.js`, HTML, frontend JavaScript, GitHub or a public Vercel deployment.** Only the publishable/anon key belongs in browser code. Database access is limited by grants and Row Level Security.

## D. Run the website locally

You can use VS Code Live Server:

1. Open the extracted project folder in VS Code.
2. Open `index.html`.
3. Choose **Open with Live Server**.

Python is not required. The Supabase JavaScript client and Excel reader are loaded from CDNs, so the browser needs an internet connection.

If you have not filled in `config.js`, the website stays in local demo mode:
- Username: `admin`
- Password: `MeridianDemo24`
- Records are stored only in that browser.

Once the Supabase URL and public key are configured, the website switches to Supabase mode. Staff must use the Auth email and password you created above.

## E. Deploy to Vercel

1. Upload/deploy the project folder to Vercel as a static website.
2. Ensure the deployed root includes `index.html`, `styles.css`, `app.js`, `enhancements.js`, `config.js`, and the `supabase/` folder.
3. After deployment, test a booking from a separate browser or phone.
4. Sign into the Staff portal on another device. The booking should appear in the dashboard.
5. Confirm the appointment and keep the staff dashboard open on the first device; the status change should update through Supabase Realtime.

Because this is a static frontend, `config.js` is served publicly. That is expected for the Supabase publishable key. Do not store passwords or secret keys in it.

## F. How to verify a booking

1. Open the patient website and submit a fictional appointment.
2. The patient receives a booking reference and a Pending confirmation message.
3. In Supabase, open **Table Editor → appointments**. The new record should be visible.
4. Open the Staff portal on any device, sign in with the Supabase staff account and review the appointment.
5. Confirm, cancel or complete the appointment. Status changes are recorded in `appointment_status_history` and `audit_logs`.

The patient directory and analytics are derived from the shared appointment records. The import tool inserts valid historical appointment rows into the same shared table. Imported rows need a valid appointment date and patient name.

## What remains outside this demo

This project shares appointment requests and staff workflow. It does not yet include patient self-service accounts/status lookup, a full separate clinical patient chart, doctor calendars, conflict detection, email/SMS notifications, consent workflows, identity verification, anti-spam/rate limiting, or a complete security/compliance review.

Before any real hospital use, commission a qualified security review; implement least-privilege roles, stronger server-side validation and anti-abuse controls; establish backup/restore and incident procedures; and review applicable Nigeria Data Protection Act requirements. Keep real patient data out of this demo until those controls are in place.

## Project structure

- `index.html` — patient website, staff portal and dashboard panels
- `styles.css` — responsive styling and accessibility refinements
- `app.js` — booking, local/cloud data adapter, authentication, staff dashboard and realtime
- `enhancements.js` — patient directory, analytics, CSV/Excel import/export and video script
- `config.js` — Supabase Project URL and public key placeholders
- `supabase/schema.sql` — PostgreSQL schema, grants, RLS policies, audit trigger and fictional seed data


## G. Verify the Supabase connection

1. Confirm `config.js` contains the correct Project URL and publishable/anon public key.
2. Open the deployed website and submit a test appointment using fictional details.
3. In Supabase, open **Table Editor → appointments** and confirm the new row appears with status `Pending`.
4. Open the Staff portal and sign in with the Supabase Auth email and password. The same appointment should appear.
5. Change the appointment status to `Confirmed`, then refresh the Supabase table and confirm the status changed.
6. For a SQL check, run `select appointment_reference, patient_name, status, created_at from public.appointments order by created_at desc limit 10;` in SQL Editor.

The `SUPABASE CONNECTED` badge indicates that the frontend configuration values are present; the test booking and staff update verify actual database access. If a booking fails, open the browser developer console (F12 → Console) and inspect the error. Common causes are an incorrect URL/key, SQL schema not applied, RLS policies missing, or the site still serving an older `config.js`.


## Patient bookings in the staff dashboard

When Supabase mode is configured, patient requests are inserted into `public.appointments`.
Staff sign in through Supabase Auth. The app checks that the signed-in user's UUID exists
in `public.staff_profiles` and is active, then loads the shared appointments table into
the Appointments dashboard. Staff can search/filter requests, open View details, and
change statuses. Realtime refresh is subscribed while the staff session is active.

If a patient submission fails, the booking form now displays the Supabase error message
returned by the database (for example, a missing table, invalid API key, or denied insert).
Use that exact message to diagnose the setup. Do not switch to local demo mode as a
substitute for checking a failed cloud submission.

To verify the flow:
1. Submit a fictional patient booking on the public page.
2. Confirm it appears in Supabase Table Editor > public > appointments.
3. Sign into the Staff portal using the Supabase Auth email and password.
4. Confirm the same booking appears under Appointments in the dashboard.
5. Change its status and confirm the status changes in Supabase.

This remains a demonstration system. Do not use real patient or clinical data.
