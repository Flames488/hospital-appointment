
create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Meridian Demo Staff',
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  appointment_reference text primary key,
  patient_name text not null check (char_length(trim(patient_name)) >= 2),
  patient_phone text not null,
  patient_email text,
  department text not null,
  appointment_date date not null,
  appointment_time text not null,
  reason text,
  status text not null default 'Pending'
    check (status in ('Pending','Confirmed','Cancelled','Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointment_status_history (
  id bigint generated always as identity primary key,
  appointment_reference text not null
    references public.appointments(appointment_reference) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_reference text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists appointments_created_at_idx on public.appointments(created_at desc);
create index if not exists appointments_date_idx on public.appointments(appointment_date);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists appointments_patient_name_idx
  on public.appointments using gin (to_tsvector('simple', patient_name));
create index if not exists appointments_phone_idx on public.appointments(patient_phone);

-- Staff authorization helper. It reads the staff allow-list without recursive RLS.
create or replace function public.is_hospital_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_profiles p
    where p.id = (select auth.uid())
      and p.is_active = true
  );
$$;

revoke all on function public.is_hospital_staff() from public, anon;
grant execute on function public.is_hospital_staff() to authenticated;

alter table public.staff_profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.audit_logs enable row level security;

-- Remove broad/default client grants, then grant only the operations used by this demo.
revoke all on table public.staff_profiles from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.appointment_status_history from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant select on table public.staff_profiles to authenticated;
grant insert on table public.appointments to anon;
grant select, insert, update on table public.appointments to authenticated;
grant select on table public.appointment_status_history to authenticated;
grant select on table public.audit_logs to authenticated;

-- Staff may read only their own staff profile.
drop policy if exists "Staff can read own profile" on public.staff_profiles;
create policy "Staff can read own profile" on public.staff_profiles
for select to authenticated
using (id = (select auth.uid()));

-- A visitor can submit a pending booking, but cannot read patient rows.
drop policy if exists "Public can submit pending appointments" on public.appointments;
create policy "Public can submit pending appointments" on public.appointments
for insert to anon
with check (status = 'Pending');

-- Authenticated patients/visitors using this demo can submit pending requests too.
drop policy if exists "Authenticated can submit pending appointments" on public.appointments;
create policy "Authenticated can submit pending appointments" on public.appointments
for insert to authenticated
with check (status = 'Pending');

-- Staff can read, update and import appointment records.
drop policy if exists "Staff can read appointments" on public.appointments;
create policy "Staff can read appointments" on public.appointments
for select to authenticated
using ((select public.is_hospital_staff()));

drop policy if exists "Staff can update appointments" on public.appointments;
create policy "Staff can update appointments" on public.appointments
for update to authenticated
using ((select public.is_hospital_staff()))
with check ((select public.is_hospital_staff()));

drop policy if exists "Staff can import appointments" on public.appointments;
create policy "Staff can import appointments" on public.appointments
for insert to authenticated
with check ((select public.is_hospital_staff()));

drop policy if exists "Staff can read status history" on public.appointment_status_history;
create policy "Staff can read status history" on public.appointment_status_history
for select to authenticated
using ((select public.is_hospital_staff()));

drop policy if exists "Staff can read audit logs" on public.audit_logs;
create policy "Staff can read audit logs" on public.audit_logs
for select to authenticated
using ((select public.is_hospital_staff()));

-- Every status update is recorded automatically.
create or replace function public.log_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if old.status is distinct from new.status then
    insert into public.appointment_status_history
      (appointment_reference, old_status, new_status, changed_by)
    values
      (new.appointment_reference, old.status, new.status, (select auth.uid()));

    insert into public.audit_logs
      (actor_id, action, entity_type, entity_reference, details)
    values
      ((select auth.uid()), 'appointment_status_changed', 'appointment',
       new.appointment_reference,
       jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_status_audit on public.appointments;
create trigger appointments_status_audit
before update on public.appointments
for each row execute function public.log_appointment_status_change();

-- Enable realtime updates for staff dashboards.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;

-- Six fictional sample appointments. Safe to re-run.
insert into public.appointments
(appointment_reference, patient_name, patient_phone, patient_email, department,
 appointment_date, appointment_time, reason, status)
values
('MC-DEMO-A7K2','Amara Bennett','08031245678','amara.bennett@example.test',
 'General Medicine',current_date + 1,'09:00 AM','Routine health consultation.','Pending'),
('MC-DEMO-B4P9','Daniel Okafor','08059871234','daniel.okafor@example.test',
 'Dental Services',current_date + 2,'11:00 AM','Tooth sensitivity and routine check-up.','Confirmed'),
('MC-DEMO-C8R1','Zara Collins','07024567891',null,
 'Paediatrics',current_date - 2,'10:00 AM','Child wellness consultation.','Completed'),
('MC-DEMO-D2M6','Noah Adeyemi','08123450987','noah.adeyemi@example.test',
 'Laboratory Services',current_date + 4,'08:00 AM','Routine blood work request.','Cancelled'),
('MC-DEMO-E5T3','Ivy Morgan','09087654321','ivy.morgan@example.test',
 'General Medicine',current_date + 3,'02:00 PM','Follow-up consultation.','Pending'),
('MC-DEMO-F9W8','Ethan James','07011223344','ethan.james@example.test',
 'Dental Services',current_date + 5,'01:00 PM','Dental review.','Confirmed')
on conflict (appointment_reference) do nothing;
