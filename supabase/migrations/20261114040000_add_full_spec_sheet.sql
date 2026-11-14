-- Migration: expand the spec sheet to match Juan's Spec Planning decisions (Nov 13, 2026)
-- 84 specs kept (Must have + Nice to have). Skipped: width with mirrors, track, suspension, headlights.

-- A reusable type for features that can be standard, optional, or missing on a trim
create domain public.availability as text
  check (value in ('standard', 'optional', 'not available'));

-- ---------- BRAND / MODEL-LEVEL FACTS (same for every trim of a model) ----------
alter table public.models
  add column exterior_colors            text[],
  add column interior_colors            text[],
  add column assembly_plant             text,
  add column generation                 text,                -- e.g. '11th generation (2022-present)'
  add column basic_warranty             text,                -- e.g. '3 yr / 36,000 mi'
  add column powertrain_warranty        text,
  add column ev_battery_warranty        text,
  add column roadside_assistance        text,
  add column complimentary_maintenance  text;

-- ---------- TRIM-LEVEL PRICING ----------
alter table public.trims
  add column destination_usd  numeric(10,2) check (destination_usd >= 0),
  add column option_packages  jsonb;                       -- [{"name": "...", "price_usd": 1200}]

-- ---------- TRIM SPEC SHEET ----------
-- Powertrain type now includes fuel cell
alter table public.trim_specs drop constraint trim_specs_powertrain_type_check;
alter table public.trim_specs add constraint trim_specs_powertrain_type_check
  check (powertrain_type in ('gas', 'hybrid', 'plug-in hybrid', 'electric', 'fuel cell'));

alter table public.trim_specs
  -- Dimensions
  add column ground_clearance_in     numeric(4,1),
  add column turning_circle_ft       numeric(4,1),
  -- Interior space
  add column front_headroom_in       numeric(4,1),
  add column rear_headroom_in        numeric(4,1),
  add column front_legroom_in        numeric(4,1),
  add column rear_legroom_in         numeric(4,1),
  add column front_shoulder_room_in  numeric(4,1),
  add column rear_shoulder_room_in   numeric(4,1),
  add column passenger_volume_cu_ft  numeric(5,1),
  add column cargo_folded_cu_ft      numeric(5,1),    -- cargo_cu_ft = seats up
  add column frunk_cu_ft             numeric(4,1),
  add column third_row_legroom_in    numeric(4,1),
  -- Weight and capacity
  add column gvwr_lb                 integer,
  add column payload_lb              integer,
  add column fuel_tank_gal           numeric(4,1),
  add column bed_length_in           numeric(5,1),
  -- Powertrain
  add column engine_aspiration       text check (engine_aspiration in (
                                       'naturally aspirated', 'turbocharged', 'twin-turbo', 'bi-turbo',
                                       'supercharged', 'turbo + supercharged', 'none')),
  add column electric_motor_hp       integer,
  add column recommended_fuel        text check (recommended_fuel in ('regular', 'midgrade', 'premium', 'diesel')),
  -- Performance
  add column top_speed_mph           smallint,
  -- Efficiency
  add column epa_annual_fuel_cost_usd integer,
  -- EV and plug-in hybrid
  add column dc_charge_10_80_min     smallint,
  add column level2_charge_hrs       numeric(4,1),
  add column charging_port           text check (charging_port in ('NACS', 'CCS', 'J1772')),
  -- Chassis and wheels
  add column wheel_size_in           numeric(4,1),
  add column tire_size               text,             -- e.g. '235/40R18'
  add column spare_tire              text check (spare_tire in ('full-size', 'compact', 'repair kit', 'none')),
  -- Safety
  add column nhtsa_overall_stars     smallint check (nhtsa_overall_stars between 1 and 5),
  add column iihs_award              text check (iihs_award in ('Top Safety Pick', 'Top Safety Pick+')),
  add column driver_assist_suite     text,             -- e.g. 'Honda Sensing'
  add column adaptive_cruise         public.availability,
  add column blind_spot_monitoring   public.availability,
  add column camera_360              public.availability,
  -- Tech
  add column touchscreen_in          numeric(4,1),
  add column carplay_android_auto    text check (carplay_android_auto in ('wired', 'wireless', 'not available')),
  add column digital_cluster_in      numeric(4,1),
  add column sound_system            text,             -- e.g. 'Bose, 12 speakers'
  add column head_up_display         public.availability,
  add column wireless_charging       public.availability,
  add column google_built_in         public.availability,
  -- Comfort
  add column seat_material           text check (seat_material in ('cloth', 'synthetic leather', 'leather', 'other')),
  add column heated_front_seats      public.availability,
  add column ventilated_front_seats  public.availability,
  add column power_driver_seat       public.availability,
  add column climate_zones           smallint,
  add column sunroof                 public.availability,
  add column sunroof_type            text check (sunroof_type in ('standard', 'panoramic')),
  add column heated_steering_wheel   public.availability,
  add column keyless_push_start      public.availability,
  -- Links
  add column epa_url                 text,
  add column nhtsa_url               text;

-- Driving range per tank is calculated, never typed: tank size x combined MPG
alter table public.trim_specs
  add column range_per_tank_mi integer
  generated always as (round(fuel_tank_gal * mpg_combined)::integer) stored;
