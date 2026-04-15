-- ============================================================
-- MIGRATION INITIALE — Bénin Petro Platform
-- ============================================================

-- EXTENSION
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'user' check (role in ('admin', 'controller', 'user')),
  status      text not null default 'active' check (status in ('active', 'inactive')),
  avatar_url  text,
  phone       text,
  department  text,
  is_online   boolean not null default false,
  last_seen   timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles: lecture publique"     on public.profiles for select using (true);
create policy "Profiles: mise à jour personnel" on public.profiles for update using (auth.uid() = id);
create policy "Profiles: admin tout faire"     on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ============================================================
-- TABLE: vehicles
-- ============================================================
create table if not exists public.vehicles (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  type         text not null check (type in ('Berline', 'SUV', 'Pickup', 'Minibus', 'Camion', 'Moto')),
  plate        text unique,
  brand        text,
  model        text,
  year         int,
  capacity     int not null default 5,
  fuel_type    text not null default 'Essence' check (fuel_type in ('Essence', 'Diesel', 'Électrique', 'Hybride')),
  mileage      int not null default 0,
  is_available boolean not null default true,
  status       text not null default 'good' check (status in ('good', 'maintenance', 'out_of_service')),
  image_url    text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.vehicles enable row level security;

create policy "Vehicles: lecture pour tous les auth"  on public.vehicles for select using (auth.role() = 'authenticated');
create policy "Vehicles: admin/controller écriture"  on public.vehicles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'controller'))
);

-- ============================================================
-- TABLE: reservations
-- ============================================================
create table if not exists public.reservations (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  vehicle_id     uuid not null references public.vehicles(id) on delete cascade,
  destination    text not null,
  purpose        text not null,
  need_driver    boolean not null default false,
  start_date     timestamptz not null,
  end_date       timestamptz not null,
  status         text not null default 'pending' check (status in ('pending', 'validated', 'cancelled', 'completed')),
  cancel_reason  text,
  cancelled_by   uuid references public.profiles(id),
  validated_by   uuid references public.profiles(id),
  completed_by   uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint no_overlap exclude using gist (
    vehicle_id with =,
    tstzrange(start_date, end_date) with &&
  ) where (status not in ('cancelled'))
);

alter table public.reservations enable row level security;

create policy "Reservations: voir les siennes"         on public.reservations for select using (auth.uid() = user_id);
create policy "Reservations: admin/controller tout voir" on public.reservations for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'controller'))
);
create policy "Reservations: créer"                    on public.reservations for insert with check (auth.uid() = user_id);
create policy "Reservations: admin/controller update"  on public.reservations for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'controller'))
);
create policy "Reservations: annuler les siennes"      on public.reservations for update using (
  auth.uid() = user_id and status = 'pending'
);

-- ============================================================
-- TABLE: chat_messages
-- ============================================================
create table if not exists public.chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Chat: lecture pour auth"  on public.chat_messages for select using (auth.role() = 'authenticated');
create policy "Chat: envoyer"            on public.chat_messages for insert with check (auth.uid() = sender_id);
create policy "Chat: supprimer les siens" on public.chat_messages for update using (auth.uid() = sender_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
create table if not exists public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  type            text not null check (type in ('reservation_validated', 'reservation_cancelled', 'reservation_completed', 'new_reservation', 'system')),
  title           text not null,
  message         text not null,
  is_read         boolean not null default false,
  reservation_id  uuid references public.reservations(id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Notifs: voir les siennes" on public.notifications for select using (auth.uid() = user_id);
create policy "Notifs: marquer lu"       on public.notifications for update using (auth.uid() = user_id);

-- ============================================================
-- TABLE: vehicle_checklists
-- ============================================================
create table if not exists public.vehicle_checklists (
  id              uuid primary key default uuid_generate_v4(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  type            text not null check (type in ('departure', 'return')),
  fuel_level      int check (fuel_level between 0 and 100),
  mileage         int,
  notes           text,
  signed_by       uuid references public.profiles(id),
  signed_at       timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.vehicle_checklists enable row level security;

create policy "Checklists: admin/controller" on public.vehicle_checklists for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'controller'))
);
create policy "Checklists: lecture réservant" on public.vehicle_checklists for select using (
  exists (select 1 from public.reservations r where r.id = reservation_id and r.user_id = auth.uid())
);

-- ============================================================
-- TABLE: checklist_items
-- ============================================================
create table if not exists public.checklist_items (
  id            uuid primary key default uuid_generate_v4(),
  checklist_id  uuid not null references public.vehicle_checklists(id) on delete cascade,
  label         text not null,
  is_checked    boolean not null default false,
  notes         text
);

alter table public.checklist_items enable row level security;

create policy "ChecklistItems: suivre parent" on public.checklist_items for all using (
  exists (
    select 1 from public.vehicle_checklists c
    join public.profiles p on p.id = auth.uid()
    where c.id = checklist_id and p.role in ('admin', 'controller')
  )
);

-- ============================================================
-- VUE: reservations_full (JOIN complet pour le frontend)
-- ============================================================
create or replace view public.reservations_full as
select
  r.id,
  r.user_id,
  prof.name        as user_name,
  prof.email       as user_email,
  prof.avatar_url  as user_avatar,
  r.vehicle_id,
  v.name           as vehicle_name,
  v.type           as vehicle_type,
  v.plate          as vehicle_plate,
  v.image_url      as vehicle_image,
  r.destination,
  r.purpose,
  r.need_driver,
  r.start_date,
  r.end_date,
  r.status,
  r.cancel_reason,
  r.cancelled_by,
  r.validated_by,
  r.completed_by,
  r.created_at,
  r.updated_at
from public.reservations r
join public.profiles  prof on prof.id = r.user_id
join public.vehicles  v    on v.id    = r.vehicle_id;

-- ============================================================
-- TRIGGERS: updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger trg_reservations_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: auto-créer un profil à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DONNÉES PAR DÉFAUT: véhicules de démonstration
-- ============================================================
insert into public.vehicles (name, type, plate, brand, model, year, capacity, fuel_type)
values
  ('Toyota Corolla', 'Berline',  'BJ-001-AA', 'Toyota', 'Corolla',  2022, 5, 'Essence'),
  ('Honda CR-V',     'SUV',      'BJ-002-AA', 'Honda',  'CR-V',     2023, 5, 'Essence'),
  ('Toyota Hiace',   'Minibus',  'BJ-003-AA', 'Toyota', 'Hiace',    2021, 14,'Diesel')
on conflict do nothing;
