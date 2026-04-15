-- ============================================================
-- FIX: Colonnes manquantes sur la table vehicles existante
-- + Recréation de la vue reservations_full
-- À appliquer si la table vehicles existait déjà sans ces colonnes
-- ============================================================

-- Ajouter les colonnes manquantes (sans erreur si elles existent déjà)
alter table public.vehicles
  add column if not exists plate        text unique,
  add column if not exists brand        text,
  add column if not exists model        text,
  add column if not exists year         int,
  add column if not exists fuel_type    text not null default 'Essence',
  add column if not exists mileage      int not null default 0,
  add column if not exists status       text not null default 'good',
  add column if not exists image_url    text,
  add column if not exists notes        text,
  add column if not exists updated_at   timestamptz not null default now();

-- Ajouter les contraintes check si elles n'existent pas
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vehicles_fuel_type_check' and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles
      add constraint vehicles_fuel_type_check
        check (fuel_type in ('Essence', 'Diesel', 'Électrique', 'Hybride'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'vehicles_status_check' and conrelid = 'public.vehicles'::regclass
  ) then
    alter table public.vehicles
      add constraint vehicles_status_check
        check (status in ('good', 'maintenance', 'out_of_service'));
  end if;
end;
$$;

-- ============================================================
-- Recréer la vue reservations_full avec toutes les colonnes
-- ============================================================
drop view if exists public.reservations_full;

create view public.reservations_full as
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
-- Mettre à jour les véhicules existants avec les nouvelles infos
-- ============================================================
update public.vehicles set
  plate     = 'BJ-001-AA', brand = 'Toyota', model = 'Corolla',
  year      = 2022, fuel_type = 'Essence', status = 'good'
where name = 'Toyota Corolla' and plate is null;

update public.vehicles set
  plate     = 'BJ-002-AA', brand = 'Honda', model = 'CR-V',
  year      = 2023, fuel_type = 'Essence', status = 'good'
where name = 'Honda CR-V' and plate is null;

update public.vehicles set
  plate     = 'BJ-003-AA', brand = 'Toyota', model = 'Hiace',
  year      = 2021, fuel_type = 'Diesel', status = 'good'
where name = 'Toyota Hiace' and plate is null;
