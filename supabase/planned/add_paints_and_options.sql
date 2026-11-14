-- PLANNED, NOT APPLIED YET. Waiting for Juan's review of the Honda data (see collection/brands.md).
-- When applied it becomes a normal migration named "add_paints_and_options".
--
-- What it adds: the tables behind the options explorer.
--   paints         one row per paint color of a model
--   trim_paints    which trims offer a paint, and the interior colors that go with it
--   options        packages, wheels and accessories of a model, with price and install time
--   trim_options   which trims offer an option
--   option_rules   "requires", "includes" and "cannot combine" links between two options
-- Access: anyone can read, nobody can write except the service role (same as the car tables).

create table public.paints (
  id                 bigint generated always as identity primary key,
  model_id           bigint not null references public.models(id) on delete cascade,
  name               text not null,                       -- 'Rallye Red'
  manufacturer_code  text,                                -- the carmaker's paint code, 'R-513'
  price_usd          numeric(10,2) not null default 0 check (price_usd >= 0),
  unique (model_id, name)
);

create table public.trim_paints (
  trim_id          bigint not null references public.trims(id) on delete cascade,
  paint_id         bigint not null references public.paints(id) on delete cascade,
  interior_colors  text[] not null default '{}',          -- interiors offered with this paint on this trim
  primary key (trim_id, paint_id)
);

create table public.options (
  id                 bigint generated always as identity primary key,
  model_id           bigint not null references public.models(id) on delete cascade,
  category           text not null check (category in ('package', 'wheels', 'exterior', 'interior', 'electronic', 'factory')),
  name               text not null,
  price_usd          numeric(10,2) not null check (price_usd >= 0),
  install_hours      numeric(4,1),                        -- empty when the carmaker does not list it
  manufacturer_code  text,
  parts_note         text,                                -- for items sold as several parts: what the price adds up
  source_url         text
);

create table public.trim_options (
  trim_id    bigint not null references public.trims(id) on delete cascade,
  option_id  bigint not null references public.options(id) on delete cascade,
  primary key (trim_id, option_id)
);

create table public.option_rules (
  option_id        bigint not null references public.options(id) on delete cascade,
  rule             text not null check (rule in ('requires', 'includes', 'cannot combine')),
  other_option_id  bigint not null references public.options(id) on delete cascade,
  primary key (option_id, rule, other_option_id),
  check (option_id <> other_option_id)
);

create index paints_model_id_idx        on public.paints (model_id);
create index trim_paints_paint_id_idx   on public.trim_paints (paint_id);
create index options_model_id_idx       on public.options (model_id);
create index trim_options_option_id_idx on public.trim_options (option_id);
create index option_rules_other_idx     on public.option_rules (other_option_id);

alter table public.paints       enable row level security;
alter table public.trim_paints  enable row level security;
alter table public.options      enable row level security;
alter table public.trim_options enable row level security;
alter table public.option_rules enable row level security;

create policy "Public can read paints"       on public.paints       for select to anon, authenticated using (true);
create policy "Public can read trim paints"  on public.trim_paints  for select to anon, authenticated using (true);
create policy "Public can read options"      on public.options      for select to anon, authenticated using (true);
create policy "Public can read trim options" on public.trim_options for select to anon, authenticated using (true);
create policy "Public can read option rules" on public.option_rules for select to anon, authenticated using (true);
