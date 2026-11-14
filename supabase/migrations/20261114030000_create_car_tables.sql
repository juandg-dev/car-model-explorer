-- Migration: create the core car tables
-- brands -> models -> trims -> trim_specs
-- Security: everyone can READ; only the server (service_role) can WRITE.

-- 1. BRANDS: one row per manufacturer
create table public.brands (
  id           bigint generated always as identity primary key,
  name         text not null unique,
  slug         text not null unique,              -- URL-friendly name, e.g. 'honda'
  country      text,
  website_url  text,
  is_boutique  boolean not null default false,    -- small / low-volume maker
  created_at   timestamptz not null default now()
);

-- 2. MODELS: one row per model per model year, e.g. 2026 Civic Sedan
create table public.models (
  id          bigint generated always as identity primary key,
  brand_id    bigint not null references public.brands(id) on delete cascade,
  name        text not null,
  slug        text not null,
  model_year  smallint not null check (model_year between 1990 and 2100),
  body_style  text,                               -- sedan, hatchback, SUV, truck, minivan...
  created_at  timestamptz not null default now(),
  unique (brand_id, slug, model_year)
);

-- 3. TRIMS: one row per trim, e.g. Civic Sport Hybrid
create table public.trims (
  id               bigint generated always as identity primary key,
  model_id         bigint not null references public.models(id) on delete cascade,
  name             text not null,
  slug             text not null,
  msrp_usd         numeric(10,2) check (msrp_usd >= 0),
  -- "Build this car" link
  build_url        text,
  build_url_level  text check (build_url_level in ('trim', 'model', 'brand', 'contact')),
  link_status      text not null default 'unchecked'
                   check (link_status in ('unchecked', 'ok', 'redirected', 'broken')),
  link_checked_at  timestamptz,
  created_at       timestamptz not null default now(),
  unique (model_id, slug)
);

-- 4. TRIM_SPECS: the full spec sheet, one row per trim
create table public.trim_specs (
  trim_id               bigint primary key references public.trims(id) on delete cascade,
  -- Dimensions
  length_in             numeric(5,1),
  width_in              numeric(5,1),
  height_in             numeric(5,1),
  wheelbase_in          numeric(5,1),
  cargo_cu_ft           numeric(5,1),
  seating               smallint,
  curb_weight_lb        integer,
  -- Powertrain
  powertrain_type       text check (powertrain_type in ('gas', 'hybrid', 'plug-in hybrid', 'electric')),
  engine                text,                     -- e.g. '2.0L 4-cylinder'
  horsepower            integer,
  torque_lb_ft          integer,
  zero_to_sixty_s       numeric(4,1),
  transmission          text,
  drivetrain            text check (drivetrain in ('FWD', 'RWD', 'AWD', '4WD')),
  -- Efficiency and capability
  mpg_city              smallint,
  mpg_highway           smallint,
  mpg_combined          smallint,
  towing_lb             integer,
  -- EV only
  electric_range_mi     smallint,
  battery_kwh           numeric(5,1),
  max_dc_charge_kw      numeric(5,1),
  mpge_combined         smallint,
  -- Where the numbers came from
  source_url            text,
  updated_at            timestamptz not null default now()
);

-- Indexes on the link columns make lookups by brand/model fast
create index models_brand_id_idx on public.models (brand_id);
create index trims_model_id_idx  on public.trims (model_id);

-- Row Level Security: lock every table, then open read-only access
alter table public.brands     enable row level security;
alter table public.models     enable row level security;
alter table public.trims      enable row level security;
alter table public.trim_specs enable row level security;

create policy "Public can read brands"     on public.brands     for select to anon, authenticated using (true);
create policy "Public can read models"     on public.models     for select to anon, authenticated using (true);
create policy "Public can read trims"      on public.trims      for select to anon, authenticated using (true);
create policy "Public can read trim specs" on public.trim_specs for select to anon, authenticated using (true);

-- Auto-expose is off, so grant access explicitly:
-- visitors (anon / authenticated) can only SELECT; the server can do everything.
grant select on public.brands, public.models, public.trims, public.trim_specs to anon, authenticated;
grant all    on public.brands, public.models, public.trims, public.trim_specs to service_role;
