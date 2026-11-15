# Builds the SQL that loads Acura's spec values: one trim_specs row per trim. Usage (from the collection folder):
#   python3 acura/specs-load.py        -> writes acura/specs-load.sql
# Juan's rule since Nov 15, 2026: only the most important specs are loaded for now; more can be added later.
# The ten for Acura: horsepower, torque, 0-60, MPG (city / highway / combined), engine, transmission, drivetrain,
# seating, cargo volume, towing. NHTSA stars and EPA annual fuel cost are added because they were already researched.
# Every value is copied from Acura's spec table (specs/<model>.txt) or from specs/outside-sources.json.
# Nothing is estimated; a value Acura doesn't publish stays empty (null).
import re, json

norm = lambda t: re.sub(r'\s+', ' ', re.sub(r'\bPackages?\b', '', t.replace('w/', 'with '))).strip()
q = lambda s: 'null' if s in (None, '') else "'" + str(s).replace("'", "''") + "'"
num = lambda s: None if s in (None, '', '-') else float(re.search(r'[\d,]+(\.\d+)?', s).group().replace(',', ''))
PAGE = {'integra': 'https://www.acura.com/cars/integra/pricing-and-specs', 'adx': 'https://www.acura.com/suvs/adx/pricing-and-specs',
        'rdx': 'https://www.acura.com/suvs/rdx/pricing-and-specs', 'mdx': 'https://www.acura.com/suvs/mdx/pricing-and-specs'}
# 0-60: one road test per engine and drive (Juan chose Car and Driver for the Integra Type S and the RDX, Nov 14, 2026).
# Sources are in specs/outside-sources.json. No test was found for the ADX FWD or the MDX FWD, so they stay empty.
ZERO60 = {('integra', 'CVT'): 7.1, ('integra', '6MT'): 7.0, ('integra', 'Type S'): 5.1, ('adx', 'AWD'): 8.7, ('rdx', 'AWD'): 6.2, ('mdx', 'AWD'): 6.4, ('mdx', 'Type S'): 5.5}
# NHTSA overall stars per model and drive (the Integra Type S is not rated overall).
NHTSA = {('integra', 'FWD'): 5, ('adx', 'FWD'): 5, ('adx', 'AWD'): 5, ('rdx', 'AWD'): 5, ('mdx', 'FWD'): 5, ('mdx', 'AWD'): 5}
# EPA annual fuel cost, matched to the EPA entry with the same city / highway / combined figures.
EPA = {('integra', (29, 37, 32)): 2350, ('integra', (26, 36, 30)): 2500, ('integra', (21, 28, 24)): 3150, ('adx', (26, 31, 28)): 2700, ('adx', (25, 30, 27)): 2800,
       ('rdx', (21, 27, 23)): 3250, ('rdx', (21, 26, 23)): 3250, ('mdx', (19, 26, 22)): 3400, ('mdx', (19, 25, 21)): 3600, ('mdx', (17, 21, 19)): 3950}
out = []; report = []
for m in ['integra', 'adx', 'rdx', 'mdx']:
    T = [l.split(';') for l in open(f'acura/raw/{m}.txt', encoding='utf8').read().split('\n') if l.startswith('T;')]
    L = open(f'acura/specs/{m}.txt', encoding='utf8').read().strip().split('\n'); cols = L[1].split('|')
    rows = [l.split('|') for l in L[3:] if l.count('|') == len(cols)]
    def cell(pattern, i, drive=None):
        # First row whose label matches. When rows differ by drive, the label ends with the drive (": FWD", "(AWD)").
        hits = [r for r in rows if re.search(pattern, r[0], re.I)]
        if drive:
            want = r'(2WD|FWD)\)?$' if drive == 'FWD' else r'AWD\)?$'
            by = [r for r in hits if re.search(want, r[0])]
            hits = by or [r for r in hits if not re.search(r'(2WD|FWD|AWD)\)?$', r[0])]
        for r in hits:
            if r[i + 1] not in ('', '-'): return r[i + 1]
        return None
    for t in T:
        # The spec-page column for this trim: the same name, or else the longest column name the trim name starts with
        # ("A-Spec with Technology 6MT" belongs to "A-Spec w/Technology Package 6MT", not to "A-Spec Package").
        name = t[1]; i = max((k for k, c in enumerate(cols) if norm(name) == norm(c) or norm(name).startswith(norm(c) + ' ')), key=lambda k: len(norm(cols[k])))
        drive = 'FWD' if m == 'integra' or name.endswith(' FWD') else 'AWD'   # RDX and the upper MDX trims are SH-AWD only
        engine_type = cell(r'^Engine Type$', i); disp = cell(r'Displacement', i)
        gear = 'CVT' if cell(r'Continuously Variable Transmission.*Final Drive', i) else '6-speed manual' if cell(r'6-Speed Manual.*Final Drive', i) else '10-speed automatic' if cell(r'10-Speed Automatic', i) else None
        mpg = cell(r'^EPA Fuel Economy', i, drive); mpg3 = tuple(int(x) for x in re.findall(r'\d+', mpg)) if mpg else (None, None, None)
        kind = 'Type S' if 'Type S' in name else '6MT' if gear == '6-speed manual' else 'CVT' if m == 'integra' else drive
        cargo = cell(r'^EPA Cargo Area Volume|^Cargo Area Volume \(cu ft\) Standard|^Cargo Volume|Behind 3rd Row', i)
        v = dict(horsepower=num(cell(r'Horsepower', i)), torque_lb_ft=num(cell(r'^(Engine Type: )?Torque', i)), zero_to_sixty_s=ZERO60.get((m, kind)),
                 mpg_city=mpg3[0], mpg_highway=mpg3[1], mpg_combined=mpg3[2], engine=f'{disp}L {engine_type}' if disp and engine_type else None,
                 engine_aspiration='turbocharged' if engine_type and 'turbo' in engine_type.lower() else 'naturally aspirated' if engine_type else None,
                 transmission=gear, drivetrain=drive, seating=num(cell(r'Maximum (Seating|Occupant) Capacity', i)), cargo_cu_ft=num(cargo),
                 towing_lb=num(cell(r'Max Towing Capacity', i, drive)), powertrain_type='gas',
                 nhtsa_overall_stars=None if 'Type S' in name and m == 'integra' else NHTSA.get((m, drive)), epa_annual_fuel_cost_usd=EPA.get((m, mpg3)), source_url=PAGE[m])
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', name).strip('-').lower()
        fmt = lambda x: 'null' if x is None else str(int(x)) if isinstance(x, float) and x == int(x) and not isinstance(x, bool) else str(x) if isinstance(x, (int, float)) else q(x)
        out.append((m, slug, v, fmt)); report.append([m, name] + [v[k] for k in ('horsepower', 'torque_lb_ft', 'zero_to_sixty_s', 'mpg_city', 'mpg_highway', 'mpg_combined', 'engine', 'transmission', 'drivetrain', 'seating', 'cargo_cu_ft', 'towing_lb', 'nhtsa_overall_stars', 'epa_annual_fuel_cost_usd')])
keys = list(out[0][2].keys())
values = ',\n  '.join('(' + ', '.join([q(m), q(s)] + [(f(v[k]) if k != 'zero_to_sixty_s' and k != 'cargo_cu_ft' else ('null' if v[k] is None else str(v[k]))) for k in keys]) + ')' for m, s, v, f in out)
sql = f"""-- Acura spec values: one row per trim. Written by acura/specs-load.py. Running it again replaces the rows.
with v(model_slug, trim_slug, {', '.join(keys)}) as (values
  {values}
), del as (
  delete from trim_specs where trim_id in (select t.id from trims t join models m on m.id = t.model_id join brands b on b.id = m.brand_id where b.slug = 'acura') returning 1
)
insert into trim_specs (trim_id, {', '.join(keys)})
select t.id, {', '.join('v.' + k + ('::smallint' if k in ('mpg_city', 'mpg_highway', 'mpg_combined', 'seating', 'nhtsa_overall_stars') else '::integer' if k in ('horsepower', 'torque_lb_ft', 'towing_lb', 'epa_annual_fuel_cost_usd') else '::numeric' if k in ('zero_to_sixty_s', 'cargo_cu_ft') else '') for k in keys)}
from v join brands b on b.slug = 'acura' join models m on m.brand_id = b.id and m.slug = v.model_slug and m.model_year = 2026 join trims t on t.model_id = m.id and t.slug = v.trim_slug
where (select count(*) from del) >= 0;
"""
open('acura/specs-load.sql', 'w', encoding='utf8').write(sql)
for r in report: print(' | '.join('' if x is None else str(x) for x in r))
print(len(out), 'rows')
