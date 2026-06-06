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
  confirmation_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
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

alter table public.reservations
  add column if not exists confirmation_code text;

update public.reservations
set confirmation_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where confirmation_code is null;

alter table public.reservations
  alter column confirmation_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table public.reservations
  alter column confirmation_code set not null;

create unique index if not exists reservations_confirmation_code_idx
  on public.reservations (confirmation_code);

create index if not exists restaurant_tables_active_idx
  on public.restaurant_tables (is_active, seats, request_score);

create index if not exists reservations_date_time_idx
  on public.reservations (reservation_date, reservation_time, status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_no_table_overlap'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_no_table_overlap
      exclude using gist (
        table_id with =,
        tsrange(reservation_start, reservation_end, '[)') with &&
      )
      where (status in ('confirmed', 'requested'));
  end if;
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

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null unique,
  description text not null,
  price_eur numeric(8, 2) not null check (price_eur > 0),
  ingredients text[] not null default '{}',
  allergens text[] not null default '{}',
  is_vegan boolean not null default false,
  is_vegetarian boolean not null default false,
  is_gluten_free boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.menu_items
  (category, name, description, price_eur, ingredients, allergens, is_vegan, is_vegetarian, is_gluten_free, sort_order)
values
  ('To Begin', 'Sea Salt Edamame', 'Warm edamame with sea salt and lemon.', 8, array['edamame', 'sea salt', 'lemon'], array['soy'], true, true, true, 10),
  ('To Begin', 'Shishito Peppers', 'Charred shishito peppers with yuzu kosho and sesame.', 12, array['shishito pepper', 'yuzu kosho', 'sesame'], array['sesame'], true, true, true, 20),
  ('Cold Plates', 'Yellowtail Jalapeno', 'Yellowtail sashimi with jalapeno, yuzu soy, and coriander oil.', 24, array['yellowtail', 'jalapeno', 'yuzu', 'soy', 'coriander'], array['fish', 'soy', 'gluten'], false, false, false, 30),
  ('Cold Plates', 'Sea Bream Usuzukuri', 'Thin-cut sea bream with ponzu, shiso, and coastal herbs.', 23, array['sea bream', 'ponzu', 'shiso', 'coastal herbs'], array['fish', 'soy', 'gluten'], false, false, false, 40),
  ('Cold Plates', 'Salmon Tataki', 'Seared salmon with sesame, spring onion, and smoked ponzu.', 22, array['salmon', 'sesame', 'spring onion', 'ponzu'], array['fish', 'soy', 'sesame', 'gluten'], false, false, false, 50),
  ('Sushi', 'Chef Nigiri Selection', 'Seven pieces selected daily by the sushi chef.', 38, array['seasonal fish', 'sushi rice', 'wasabi'], array['fish', 'shellfish', 'soy'], false, false, true, 60),
  ('Sushi', 'Toro and Caviar Maki', 'Fatty tuna, caviar, chive, and seasoned rice.', 32, array['toro tuna', 'caviar', 'chive', 'sushi rice'], array['fish'], false, false, true, 70),
  ('Sushi', 'Avocado Cucumber Maki', 'Avocado, cucumber, shiso, and sesame with tamari.', 14, array['avocado', 'cucumber', 'shiso', 'sesame', 'tamari'], array['soy', 'sesame'], true, true, true, 80),
  ('Robata', 'Miso Black Cod', 'Black cod marinated in sweet saikyo miso.', 42, array['black cod', 'saikyo miso', 'mirin'], array['fish', 'soy', 'gluten'], false, false, false, 90),
  ('Robata', 'Wagyu Truffle Ponzu', 'Charcoal-grilled wagyu with truffle ponzu and spring onion.', 58, array['wagyu beef', 'truffle', 'ponzu', 'spring onion'], array['soy', 'gluten'], false, false, false, 100),
  ('Robata', 'King Oyster Mushroom', 'Charcoal-grilled mushroom with sesame ponzu and shiso.', 18, array['king oyster mushroom', 'sesame', 'ponzu', 'shiso'], array['soy', 'sesame', 'gluten'], true, true, false, 110),
  ('Robata', 'Aubergine Dengaku', 'Roasted aubergine with sweet miso and toasted sesame.', 17, array['aubergine', 'sweet miso', 'sesame'], array['soy', 'sesame', 'gluten'], true, true, false, 120),
  ('Robata', 'Chicken Tsukune', 'Robata chicken meatballs with tare and cured egg yolk.', 24, array['chicken', 'tare', 'egg yolk'], array['egg', 'soy', 'gluten'], false, false, false, 130),
  ('Main', 'Sea Bass Shiso Butter', 'Roasted sea bass with shiso butter and asparagus.', 39, array['sea bass', 'shiso', 'butter', 'asparagus'], array['fish', 'milk'], false, false, true, 140),
  ('Main', 'Lobster Yuzu Butter', 'Grilled lobster with yuzu butter and Japanese herbs.', 54, array['lobster', 'yuzu', 'butter', 'Japanese herbs'], array['shellfish', 'milk'], false, false, true, 150),
  ('Main', 'Wagyu Donabe Rice', 'Clay-pot rice with wagyu, shiitake, and soy-cured egg.', 52, array['wagyu beef', 'rice', 'shiitake', 'egg', 'soy'], array['egg', 'soy', 'gluten'], false, false, false, 160),
  ('Dessert', 'Yuzu Cheesecake', 'Light yuzu cheesecake with sesame sable.', 15, array['cream cheese', 'yuzu', 'egg', 'sesame sable'], array['milk', 'egg', 'sesame', 'gluten'], false, true, false, 170),
  ('Dessert', 'Matcha Coconut Mochi', 'Soft matcha mochi with coconut cream.', 14, array['rice flour', 'matcha', 'coconut cream'], array[]::text[], true, true, true, 180),
  ('Dessert', 'Chocolate Miso Fondant', 'Warm dark chocolate fondant with white miso ice cream.', 16, array['dark chocolate', 'miso', 'butter', 'egg', 'flour'], array['milk', 'egg', 'soy', 'gluten'], false, true, false, 190),
  ('Dessert', 'Seasonal Fruit and Shiso Sorbet', 'Market fruit with fresh shiso sorbet.', 13, array['seasonal fruit', 'shiso sorbet'], array[]::text[], true, true, true, 200)
on conflict (name) do update
set
  category = excluded.category,
  description = excluded.description,
  price_eur = excluded.price_eur,
  ingredients = excluded.ingredients,
  allergens = excluded.allergens,
  is_vegan = excluded.is_vegan,
  is_vegetarian = excluded.is_vegetarian,
  is_gluten_free = excluded.is_gluten_free,
  is_active = true,
  sort_order = excluded.sort_order;

create or replace function public.search_menu_items(
  p_query text default '',
  p_dietary_preference text default null,
  p_allergen_to_avoid text default null
)
returns table (
  category text,
  name text,
  description text,
  price_eur numeric,
  ingredients text[],
  allergens text[],
  is_vegan boolean,
  is_vegetarian boolean,
  is_gluten_free boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.category,
    m.name,
    m.description,
    m.price_eur,
    m.ingredients,
    m.allergens,
    m.is_vegan,
    m.is_vegetarian,
    m.is_gluten_free
  from public.menu_items m
  where
    m.is_active = true
    and (
      coalesce(trim(p_query), '') = ''
      or m.name ilike '%' || trim(p_query) || '%'
      or m.category ilike '%' || trim(p_query) || '%'
      or m.description ilike '%' || trim(p_query) || '%'
      or array_to_string(m.ingredients, ' ') ilike '%' || trim(p_query) || '%'
    )
    and (
      p_dietary_preference is null
      or (p_dietary_preference = 'vegan' and m.is_vegan)
      or (p_dietary_preference = 'vegetarian' and m.is_vegetarian)
      or (p_dietary_preference = 'gluten_free' and m.is_gluten_free)
    )
    and (
      coalesce(trim(p_allergen_to_avoid), '') = ''
      or not (lower(trim(p_allergen_to_avoid)) = any(m.allergens))
    )
  order by m.sort_order, m.name
  limit 12;
$$;

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
security definer
set search_path = public
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
  new_confirmation_code text;
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
  returning id, confirmation_code
  into new_reservation_id, new_confirmation_code;

  update public.restaurant_tables
  set request_score = request_score + 1
  where id = selected_table.id;

  return jsonb_build_object(
    'success', true,
    'reservation_id', new_reservation_id,
    'confirmation_code', new_confirmation_code,
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

create or replace function public.get_staff_schedule(p_date date)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'date', p_date,
    'tables',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', t.id,
              'table_code', t.table_code,
              'seats', t.seats,
              'zone', t.zone,
              'description', t.description,
              'request_score', t.request_score,
              'is_active', t.is_active
            )
            order by t.table_code
          )
          from public.restaurant_tables t
        ),
        '[]'::jsonb
      ),
    'reservations',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', r.id,
              'confirmation_code', r.confirmation_code,
              'table_id', r.table_id,
              'table_code', t.table_code,
              'zone', t.zone,
              'reservation_date', r.reservation_date,
              'reservation_time', r.reservation_time,
              'duration_minutes', r.duration_minutes,
              'reservation_start', r.reservation_start,
              'reservation_end', r.reservation_end,
              'guests', r.guests,
              'guest_name', r.guest_name,
              'email', r.email,
              'phone', r.phone,
              'special_requests', r.special_requests,
              'status', r.status
            )
            order by r.reservation_time, t.table_code
          )
          from public.reservations r
          join public.restaurant_tables t on t.id = r.table_id
          where r.reservation_date = p_date
            and r.status in ('confirmed', 'requested')
        ),
        '[]'::jsonb
      )
  );
$$;

alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.restaurant_faqs enable row level security;
alter table public.menu_items enable row level security;

grant usage on schema public to service_role;
revoke all on table public.restaurant_tables, public.reservations, public.restaurant_faqs, public.menu_items from anon, authenticated;
revoke all on function public.find_available_tables(date, time, integer, text) from public, anon, authenticated;
revoke all on function public.create_reservation_if_available(date, time, integer, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.search_menu_items(text, text, text) from public, anon, authenticated;
revoke all on function public.get_staff_schedule(date) from public, anon, authenticated;
grant execute on function public.find_available_tables(date, time, integer, text) to service_role;
grant execute on function public.create_reservation_if_available(date, time, integer, text, text, text, text, text) to service_role;
grant execute on function public.search_menu_items(text, text, text) to service_role;
grant execute on function public.get_staff_schedule(date) to service_role;
