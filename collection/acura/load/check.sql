-- Compares what is in the database with what the raw files hold. Every row must say ok = true.
with expected(slug, model_year, trims, paints, paint_links, options, option_links, rules, msrp_sum, option_price_sum) as (values
  ('adx', 2026, 6, 6, 32, 52, 261, 122, 237200, 17950.4),
  ('integra', 2026, 5, 6, 29, 63, 239, 128, 201650, 29205.0),
  ('mdx', 2026, 8, 8, 44, 70, 384, 117, 496450, 42645.92),
  ('rdx', 2026, 5, 8, 31, 69, 253, 118, 251200, 29185.64)
), found as (
  select m.slug, m.model_year,
    (select count(*) from trims t where t.model_id = m.id) trims,
    (select count(*) from paints p where p.model_id = m.id) paints,
    (select count(*) from trim_paints tp join paints p on p.id = tp.paint_id where p.model_id = m.id) paint_links,
    (select count(*) from options o where o.model_id = m.id) options,
    (select count(*) from trim_options x join options o on o.id = x.option_id where o.model_id = m.id) option_links,
    (select count(*) from option_rules r join options o on o.id = r.option_id where o.model_id = m.id) rules,
    (select sum(msrp_usd) from trims t where t.model_id = m.id) msrp_sum,
    (select sum(price_usd) from options o where o.model_id = m.id) option_price_sum
  from models m join brands b on b.id = m.brand_id where b.slug = 'acura'
)
select e.slug, (f.slug is not null and (e.trims, e.paints, e.paint_links, e.options, e.option_links, e.rules, e.msrp_sum::numeric, e.option_price_sum::numeric)
  = (f.trims, f.paints, f.paint_links, f.options, f.option_links, f.rules, f.msrp_sum, f.option_price_sum)) ok, to_jsonb(f) - 'slug' found
from expected e left join found f on f.slug = e.slug and f.model_year = e.model_year order by 1;
