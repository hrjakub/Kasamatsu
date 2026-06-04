create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_code text not null unique,
  seats integer not null check (seats between 1 and 12),
  zone text not null,
  description text not null,
  request_score integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.restaurant_tables(id),
  reservation_date date not null,
  reservation_time time not null,
  duration_minutes integer not null default 120 check (duration_minutes between 30 and 240),
  reservation_start timestamp generated always as (
    reservation_date::timestamp + reservation_time
  ) stored,
  reservation_end timestamp generated always as (
    reservation_date::timestamp + reservation_time + make_interval(mins => duration_minutes)
  ) stored,
  guests integer not null check (guests between 1 and 12),
  guest_name text not null,
  email text not null,
  phone text,
  special_requests text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'requested', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurant_tables_active_idx
  on public.restaurant_tables (is_active, seats, request_score);

create index if not exists reservations_date_time_idx
  on public.reservations (reservation_date, reservation_time, status);

do $$
begin
  alter table public.reservations
    add constraint reservations_no_table_overlap
    exclude using gist (
      table_id with =,
      tsrange(reservation_start, reservation_end, '[)') with &&
    )
    where (status in ('confirmed', 'requested'));
exception
  when duplicate_object then null;
end;
$$;

insert into public.restaurant_tables
  (table_code, seats, zone, description, request_score)
values
  ('T1', 2, 'Garden', 'Quiet two-seat table near the pine garden.', 6),
  ('T2', 2, 'Garden', 'Compact two-seat table with a calm garden feel.', 5),
  ('T3', 2, 'Terrace', 'Most requested romantic terrace table.', 10),
  ('T4', 4, 'Terrace', 'Four-seat terrace table for warm evenings.', 8),
  ('T5', 4, 'Window', 'Four-seat table with a softer view of the room.', 7),
  ('T6', 4, 'Dining Room', 'Central four-seat table for relaxed dining.', 4),
  ('T7', 2, 'Chef Counter', 'Two seats close to the chef counter.', 9),
  ('T8', 4, 'Dining Room', 'Flexible four-seat dining room table.', 3),
  ('T9', 6, 'Private Alcove', 'Semi-private alcove for celebrations.', 9),
  ('T10', 12, 'Group Table', 'Largest table for groups and private dinners.', 6)
on conflict (table_code) do update
set
  seats = excluded.seats,
  zone = excluded.zone,
  description = excluded.description,
  request_score = excluded.request_score,
  is_active = true;

create table if not exists public.restaurant_faqs (
  id uuid primary key default gen_random_uuid(),
  topic text not null unique,
  answer text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.restaurant_faqs (topic, answer)
values
  ('Cuisine', 'Kasamatsu is a Japanese dining concept with Mediterranean light, focused on omakase, robata, seasonal fish, sake, cocktails, and wine.'),
  ('Location', 'Kasamatsu is a private test concept near Ramatuelle and Saint-Tropez. The full public address is not finalized in this prototype.'),
  ('Special occasions', 'The team can record requests for cakes, champagne, flowers, surprises, allergies, table preferences, and wine preferences.'),
  ('Service', 'Prototype dinner service is Tuesday to Saturday with seating times from 18:30 to 21:30.')
on conflict (topic) do update
set answer = excluded.answer;

create or replace function public.find_available_tables(
  p_date date,
  p_time time,
  p_guests integer,
  p_preferred_zone text default null
)
returns table (
  id uuid,
  table_code text,
  seats integer,
  zone text,
  description text,
  request_score integer
)
language sql
stable
as $$
  select
    t.id,
    t.table_code,
    t.seats,
    t.zone,
    t.description,
    t.request_score
  from public.restaurant_tables t
  where
    t.is_active = true
    and t.seats >= p_guests
    and not exists (
      select 1
      from public.reservations r
      where
        r.table_id = t.id
        and r.status in ('confirmed', 'requested')
        and tsrange(r.reservation_start, r.reservation_end, '[)') &&
          tsrange(
            p_date::timestamp + p_time,
            p_date::timestamp + p_time + interval '2 hours',
            '[)'
          )
    )
  order by
    case
      when p_preferred_zone is not null
        and lower(t.zone) like '%' || lower(p_preferred_zone) || '%'
      then 0
      else 1
    end,
    t.request_score desc,
    t.seats asc,
    t.table_code asc;
$$;

create or replace function public.create_reservation_if_available(
  p_date date,
  p_time time,
  p_guests integer,
  p_guest_name text,
  p_email text,
  p_phone text default null,
  p_special_requests text default null,
  p_preferred_zone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_table record;
  new_reservation_id uuid;
begin
  if p_guests < 1 or p_guests > 12 then
    return jsonb_build_object(
      'success', false,
      'reason', 'Online reservations support 1 to 12 guests.'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext(p_date::text || ':' || p_time::text));

  select *
  into selected_table
  from public.find_available_tables(p_date, p_time, p_guests, p_preferred_zone)
  limit 1;

  if selected_table.id is null then
    return jsonb_build_object(
      'success', false,
      'reason', 'No suitable table is available for that time.'
    );
  end if;

  insert into public.reservations (
    table_id,
    reservation_date,
    reservation_time,
    guests,
    guest_name,
    email,
    phone,
    special_requests,
    status
  )
  values (
    selected_table.id,
    p_date,
    p_time,
    p_guests,
    p_guest_name,
    p_email,
    p_phone,
    p_special_requests,
    'confirmed'
  )
  returning id into new_reservation_id;

  update public.restaurant_tables
  set request_score = request_score + 1
  where id = selected_table.id;

  return jsonb_build_object(
    'success', true,
    'reservation_id', new_reservation_id,
    'table_code', selected_table.table_code,
    'zone', selected_table.zone,
    'description', selected_table.description,
    'date', p_date,
    'time', p_time,
    'guests', p_guests,
    'special_requests', p_special_requests
  );
exception
  when exclusion_violation then
    return jsonb_build_object(
      'success', false,
      'reason', 'That table was just booked by another guest. Please offer another time.'
    );
end;
$$;

alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.restaurant_faqs enable row level security;
