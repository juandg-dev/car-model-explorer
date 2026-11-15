# Builds the SQL that loads one brand's options files into Supabase. Usage (from the collection folder):
#   python3 load-options.py acura
# It writes <brand>/load/<model>.sql (one statement per model) and <brand>/load/check.sql, and prints the counts the
# database must show afterwards. Nothing in a raw file is changed: the file's text travels inside the statement, the
# database checks its fingerprint (md5) before it loads anything, and then reads the lines itself.
# Loading a model again replaces it (the old rows are deleted first), so corrections are safe.
#
# Brand and model details that are not in the raw files (website, plant, generation, warranty) come from
# <brand>/load-details.json, which is written by hand from <brand>/specs/outside-sources.json.
import sys, os, json, hashlib, re

B = sys.argv[1]; D = json.load(open(f'{B}/load-details.json', encoding='utf8')); os.makedirs(f'{B}/load', exist_ok=True)
q = lambda s: 'null' if s in (None, '') else "'" + str(s).replace("'", "''") + "'"
TEMPLATE = open('load-options.template.sql', encoding='utf8').read()
check = []; total = dict(models=0, trims=0, paints=0, paint_links=0, options=0, option_links=0, rules=0)

for f in sorted(os.listdir(f'{B}/raw')):
    raw = open(f'{B}/raw/{f}', encoding='utf8').read().strip(); L = raw.split('\n'); hd = L[0][1:].split('|'); m = D['models'][hd[3]]
    assert '$raw$' not in raw
    T = [l.split(';') for l in L if l.startswith('T;')]; C = [l.split(';') for l in L if l.startswith('C;')]
    I = [l.split(';') for l in L if l[:2] in ('P;', 'W;', 'E;', 'I;', 'L;', 'F;')]; R = [l[2:] for l in L if l.startswith('R;')]
    # parts_note: for an item sold as several parts, the "Sold together as ..." entry whose parts add up to the item's price.
    notes = {}
    for e in (R[0].split(' // ') if R else []):
        mm = re.match(r'Sold together as (.*?): (.*)$', e)
        if not mm: continue
        name, parts = mm.group(1), mm.group(2); total_parts = round(sum(float(x) for x in re.findall(r'\$([\d.]+)', parts)), 2)
        for it in I:
            if it[1] == name and round(float(it[2]), 2) == total_parts: notes.setdefault(it[8], parts)
    sql = TEMPLATE
    for k, v in {'{{RAW}}': raw, '{{MD5}}': hashlib.md5(raw.encode('utf8')).hexdigest(), '{{BRAND}}': q(D['brand']['name']), '{{BRAND_SLUG}}': q(D['brand']['slug']),
                 '{{COUNTRY}}': q(D['brand']['country']), '{{WEBSITE}}': q(D['brand']['website_url']), '{{PAGE}}': q(m['page_url']), '{{GENERATION}}': q(m.get('generation')),
                 '{{PLANT}}': q(m.get('assembly_plant')), '{{BASIC}}': q(m.get('basic_warranty')), '{{POWERTRAIN}}': q(m.get('powertrain_warranty')),
                 '{{ROADSIDE}}': q(m.get('roadside_assistance')), '{{NOTES}}': q(json.dumps(notes))}.items(): sql = sql.replace(k, v)
    open(f'{B}/load/{hd[0]}.sql', 'w', encoding='utf8').write(sql)
    n = len(T); rules = set()
    for k, it in enumerate(I):
        for rule, fld in (('x', it[5]), ('req', it[6]), ('inc', it[7])):
            for v in filter(None, fld.split(',')): rules.add((k, rule, int(v)))
    c = dict(trims=n, paints=len(C), paint_links=sum(v != '0' for c_ in C for v in c_[4].split(',')), options=len(I),
             option_links=sum(bin(int(it[4])).count('1') for it in I), rules=len(rules), msrp_sum=sum(int(t[2]) for t in T), option_price_sum=round(sum(float(it[2]) for it in I), 2))
    for k in total:
        if k in c: total[k] += c[k]
    total['models'] += 1; check.append((hd[3], int(hd[2]), c)); print(hd[3], c)

rows = ',\n  '.join(f"({q(s)}, {y}, {c['trims']}, {c['paints']}, {c['paint_links']}, {c['options']}, {c['option_links']}, {c['rules']}, {c['msrp_sum']}, {c['option_price_sum']})" for s, y, c in check)
open(f'{B}/load/check.sql', 'w', encoding='utf8').write(f"""-- Compares what is in the database with what the raw files hold. Every row must say ok = true.
with expected(slug, model_year, trims, paints, paint_links, options, option_links, rules, msrp_sum, option_price_sum) as (values
  {rows}
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
  from models m join brands b on b.id = m.brand_id where b.slug = {q(D['brand']['slug'])}
)
select e.slug, (f.slug is not null and (e.trims, e.paints, e.paint_links, e.options, e.option_links, e.rules, e.msrp_sum::numeric, e.option_price_sum::numeric)
  = (f.trims, f.paints, f.paint_links, f.options, f.option_links, f.rules, f.msrp_sum, f.option_price_sum)) ok, to_jsonb(f) - 'slug' found
from expected e left join found f on f.slug = e.slug and f.model_year = e.model_year order by 1;
""")
print('total', total)
