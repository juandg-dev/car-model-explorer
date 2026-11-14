# Honda spec loader: builds one trim_specs row per trim, and the model details, as SQL for Supabase.
# Run from the collection folder:   python3 honda/specs-load.py
# It writes honda/specs-load.sql (trim_specs) and honda/specs-models.sql (plant, generation, warranty) and prints a summary.
# Claude then runs those two statements in Supabase. Loaded Nov 14, 2026 after Juan's review.
#
# Rules: every value is copied from Honda's spec page (specs/<model>.txt), the Build & Price trim line (raw/<model>.txt)
# or specs/outside-sources.json. Nothing is estimated. A field with no matching row stays empty (NULL).
# The trim ids in DB below are the ids Supabase gave the 65 Honda trims on Nov 14, 2026.
import re, json, sys, os, glob
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
REPO = HERE

def load():
    M={}
    for f in sorted(glob.glob(HERE + 'specs/*.txt')):
        L=open(f,encoding='utf8').read().rstrip('\n').split('\n')
        slug,title,url=L[0][3:].split(' | ')[0],L[0][3:].split(' | ')[1:-1],L[0].split(' | ')[-1]
        trims=L[1].split('|'); n=len(trims); sec=''; rows=[]
        for l in L[2:]:
            if '|' not in l: sec=re.sub(r'[">]','',l).strip(); continue
            c=l.split('|')
            if c[0].startswith('Starting at'): continue
            if len(c)==n+1: rows.append((sec,c[0],c[1:]))
            else: rows.append((sec,'!!BAD '+l[:80],[]))
        M[slug]=dict(trims=trims,rows=rows,url=url)
    return M

OUT = json.load(open(REPO + 'specs/outside-sources.json'))

# trims as loaded in Supabase on Nov 14, 2026: model slug -> [(trim id, trim name)]
DB = {
 'civic-type-r': [(1, 'Civic Type R')],
 'prelude': [(2, 'Hybrid'), (3, 'Hybrid Two-Tone')],
 'civic-si-sedan': [(4, 'Si')],
 'civic-hatchback': [(5, 'Sport'), (6, 'Sport Hybrid'), (7, 'Sport Touring Hybrid')],
 'civic-sedan': [(8, 'LX'), (9, 'Sport'), (10, 'Sport Hybrid'), (11, 'Sport Touring Hybrid')],
 'accord-sedan': [(12, 'LX'), (13, 'SE'), (14, 'Sport Hybrid'), (15, 'EX-L Hybrid'), (16, 'Sport-L Hybrid'), (17, 'Touring Hybrid')],
 'prologue': [(18, 'EX 2WD'), (19, 'EX AWD'), (20, 'Touring 2WD'), (21, 'Touring AWD'), (22, 'Elite')],
 'hr-v': [(23, 'LX 2WD'), (24, 'LX AWD'), (25, 'Sport 2WD'), (26, 'Sport AWD'), (27, 'EX-L 2WD'), (28, 'EX-L AWD')],
 'odyssey': [(29, 'EX-L'), (30, 'Sport-L'), (31, 'Touring'), (32, 'Elite')],
 'cr-v': [(33, 'LX 2WD'), (34, 'LX AWD'), (35, 'EX 2WD'), (36, 'EX AWD'), (37, 'EX-L 2WD'), (38, 'EX-L AWD'), (39, 'Sport Hybrid 2WD'), (40, 'Sport Hybrid AWD'),
          (41, 'TrailSport Hybrid'), (42, 'Sport-L Hybrid 2WD'), (43, 'Sport-L Hybrid AWD'), (44, 'Sport Touring Hybrid')],
 'passport': [(45, 'RTL'), (46, 'RTL Towing'), (47, 'TrailSport'), (48, 'TrailSport Blackout'), (49, 'TrailSport Elite'), (50, 'TrailSport Elite Blackout')],
 'pilot': [(51, 'Sport 2WD'), (52, 'Sport AWD'), (53, 'EX-L 2WD'), (54, 'EX-L AWD'), (55, 'TrailSport'), (56, 'Touring'), (57, 'Touring Blackout'), (58, 'Elite'), (59, 'Black Edition')],
 'ridgeline': [(60, 'Sport'), (61, 'RTL'), (62, 'TrailSport'), (63, 'TrailSport+HPD Wheels'), (64, 'Black Edition'), (65, 'Black Edition Two-Tone')],
}
RAW = {'civic-type-r': 'typer', 'prelude': 'prelude', 'civic-si-sedan': 'civicsi', 'civic-hatchback': 'civichb', 'civic-sedan': 'civic', 'accord-sedan': 'accord',
       'prologue': 'prologue', 'hr-v': 'hrv', 'odyssey': 'odyssey', 'cr-v': 'crv', 'passport': 'passport', 'pilot': 'pilot', 'ridgeline': 'ridgeline'}

def num(s):
    """First number in a cell. Honda's Ridgeline and Civic pages write thousands with a dot (4.420 lbs)."""
    if s is None: return None
    m = re.search(r'\d[\d,]*(?:\.\d+)?', s)
    return float(m.group(0).replace(',', '')) if m else None

def thousands(s):
    """Whole-number weights: '4,420' or Honda's '4.420' (three digits after the dot) both mean 4420."""
    if s is None: return None
    m = re.search(r'\d[\d,.]*', s)
    if not m: return None
    t = m.group(0)
    if re.fullmatch(r'\d{1,2}\.\d{3}', t): t = t.replace('.', '')
    return int(round(float(t.replace(',', ''))))

def parts(s):
    return [p.strip() for p in s.split('/')] if s else []

class Col:
    def __init__(self, model, idx, drive):
        self.rows = [(sec, lab, cells[idx]) for sec, lab, cells in model['rows'] if cells and sec != 'Key Features']
        self.drive = drive  # '2WD', 'AWD' or None (trim name has no suffix)
    def find(self, pat, std_only=False, sec=None):
        out = []
        for s, lab, c in self.rows:
            if re.search(pat, lab, re.I) and (sec is None or re.search(sec, s, re.I)):
                c = c.strip()
                if c in ('', '-'): continue
                if std_only and c != 'Std': continue
                out.append((lab, c))
        return out
    def val(self, pat, sec=None):
        """Cell text of the first row that has a real value for this trim (not Std, not '-')."""
        for lab, c in self.find(pat, sec=sec):
            if c != 'Std': return lab, c
        return None, None
    def std(self, pat):
        hits = self.find(pat)
        return bool([1 for lab, c in hits if c in ('Std', 'AWD Trim') or c not in ('Available',)])
    def by_drive(self, base):
        """Value for this trim's drive. Handles '(2WD)' / '(AWD)' row pairs and '2WD / AWD' cells."""
        want = self.drive
        rows = self.find(base)
        rows = [(l, c) for l, c in rows if c != 'Std']
        two = [(l, c) for l, c in rows if re.search(r'\(2WD\)|- 2WD$', l)]
        awd = [(l, c) for l, c in rows if re.search(r'\((AWD|4WD)\)|- AWD$', l)]
        both = [(l, c) for l, c in rows if re.search(r'2WD\s*/\s*AWD|2WD & AWD', l)]
        plain = [(l, c) for l, c in rows if (l, c) not in two + awd + both]
        if two or awd:
            if want == '2WD': return two[0][1] if two else None
            if want == 'AWD': return awd[0][1] if awd else None
            # no suffix in the trim name: the trim comes one way only
            if awd and not two: return awd[0][1]
            if two and not awd: return two[0][1]
            return None
        if both:
            lab, c = both[0]
            if '&' in lab: return c
            p = parts(c)
            if len(p) != 2: return None
            a, b = p
            ok = lambda x: x not in ('', '-', 'NA')
            if want == '2WD': return a if ok(a) else None
            if want == 'AWD': return b if ok(b) else None
            if ok(b) and not ok(a): return b
            if ok(a) and not ok(b): return a
            return None
        return plain[0][1] if plain else None

def epa_cost(slug, triple):
    for line in OUT['epa'].get(slug, []):
        m = re.search(r'\$([\d,]+) per year \((\d+) / (\d+) / (\d+)', line)
        if m and tuple(int(x) for x in m.groups()[1:]) == triple:
            return int(m.group(1).replace(',', ''))
    return None

def build(slug, model):
    rows = []
    rawf = open(REPO + 'raw/' + RAW[slug] + '.txt', encoding='utf8').read().split('\n')
    seat_raw = {l.split(';')[1]: l.split(';')[4] for l in rawf if l.startswith('T;')}
    for tid, tname in DB[slug]:
        m = re.match(r'(.*) (2WD|AWD)$', tname)
        base, drive = (m.group(1), m.group(2)) if m else (tname, None)
        idx = model['trims'].index(base)
        c = Col(model, idx, drive)
        fwd = bool(c.find(r'^(Single Motor )?Front-Wheel Drive', std_only=True))
        awd_std = bool(c.find(r'AWD System|Real-Time AWD|Dual Motor All-Wheel Drive', std_only=True))
        if drive is None and awd_std: c.drive = 'AWD'      # trim sold with all-wheel drive only
        elif drive is None and fwd: c.drive = '2WD'
        r = {'trim_id': tid, '_model': slug, '_trim': tname, 'source_url': model['url']}
        n1 = lambda pat, sec=None: num(c.val(pat, sec)[1])

        # ---- dimensions
        r['length_in'] = n1(r'^Length \(in')
        r['width_in'] = n1(r'^Width \(in')
        r['height_in'] = num(c.by_drive(r'^Height \(in'))
        r['wheelbase_in'] = n1(r'^Wheelbase')
        r['ground_clearance_in'] = num(c.by_drive(r'^Ground Clearance'))
        r['turning_circle_ft'] = n1(r'^Turning Diameter')
        # ---- interior space (first / second / third row)
        for key, pat in (('headroom', r'^Headroom'), ('legroom', r'^Legroom'), ('shoulder_room', r'^Shoulder Room')):
            p = parts(c.val(pat)[1])
            r['front_%s_in' % key] = num(p[0]) if len(p) > 0 else None
            r['rear_%s_in' % key] = num(p[1]) if len(p) > 1 else None
            if key == 'legroom': r['third_row_legroom_in'] = num(p[2]) if len(p) > 2 else None
        r['passenger_volume_cu_ft'] = n1(r'Passenger Volume')
        # cargo: seats up = behind the last row of seats; folded = behind the first row. "Standard / Max": Standard.
        up = fold = None
        third = c.val(r'Cargo Volume.*Behind Third Row')[1]
        second = c.val(r'Cargo Volume.*Behind Second Row')[1]
        first = c.val(r'Cargo Volume.*Behind First Row')[1]
        lab, generic = c.val(r'^(Rear )?Cargo Volume \(cu ft\.\)(?!.*Behind)')
        if third: up = num(parts(third)[0])
        elif second: up = num(parts(second)[0])
        if first: fold = num(parts(first)[1 if slug == 'cr-v' else 0])
        if generic and up is None:
            p = parts(generic)
            up = num(p[0])
            if len(p) > 1 and re.search(r'Standard / Max|Seat Up / Seat Down', lab): fold = num(p[1])
        if slug == 'ridgeline': up = n1(r'^Truck Bed Cargo Volume')
        r['cargo_cu_ft'], r['cargo_folded_cu_ft'] = up, fold
        # seating
        s = c.find(r'(\d)-Person Seating Capacity')
        if s: r['seating'] = int(re.search(r'(\d)-Person', s[0][0]).group(1))
        else: r['seating'] = (lambda v: int(v) if v else None)(num(c.val(r'^Seating Capacity')[1]))
        # ---- weight and capacity
        r['curb_weight_lb'] = thousands(c.by_drive(r'^Curb Weight'))
        r['gvwr_lb'] = thousands(c.val(r'Gross Vehicle Weight Rating')[1])
        r['payload_lb'] = thousands(c.val(r'Payload')[1])
        r['towing_lb'] = thousands(c.by_drive(r'Towing Capacity'))
        r['fuel_tank_gal'] = n1(r'^Fuel Tank Capacity')
        bl = c.val(r'^Truck Bed Length')[1]
        r['bed_length_in'] = num(parts(bl)[0]) if bl else None   # tailgate up
        # ---- powertrain
        hybrid = bool(c.find(r'^Two-Motor Hybrid System', std_only=True))
        ev = slug == 'prologue'
        r['powertrain_type'] = 'electric' if ev else 'hybrid' if hybrid else 'gas'
        et = c.val(r'^Engine Type')[1]
        cc = c.val(r'^Displacement')[1]
        if et:
            litres = round(float(re.sub(r'[.,]', '', cc)) / 1000, 1) if cc else None   # 1,993 / 1.993 / 1993 cc
            r['engine'] = ('%.1fL ' % litres if litres else '') + et
            r['engine_aspiration'] = 'turbocharged' if re.search(r'Turbocharger', et) else 'naturally aspirated'
        else:
            r['engine'] = None
            r['engine_aspiration'] = 'none' if ev else None
        if ev:
            r['horsepower'] = thousands(c.by_drive(r'^Horsepower'))
            r['torque_lb_ft'] = thousands(c.by_drive(r'^Torque'))
            r['electric_motor_hp'] = r['horsepower']
        else:
            tot = c.val(r'^Total System Horsepower')[1]
            r['horsepower'] = int(num(tot)) if tot else int(num(c.val(r'^Horsepower')[1]))
            r['torque_lb_ft'] = int(num(c.val(r'^Torque', sec='Engineering')[1]))      # engine torque (first Torque row)
            mo = c.val(r'Electric Motor \(horsepower')[1]
            r['electric_motor_hp'] = int(num(mo)) if mo else None
        # transmission, in plain words, from Honda's row labels
        paddles = bool(c.find(r'Paddle Shifters', std_only=True)); decel = bool(c.find(r'^Deceleration Selectors', std_only=True))
        tl = [l for l, v in c.find(r'Transmission|^Direct Drive Unit', std_only=True) if 'Cooler' not in l]
        t = None
        if tl:
            l = tl[0]
            if re.search(r'Continuously Variable', l): t = 'CVT'
            elif re.search(r'Direct Drive', l): t = 'e-CVT (2-motor hybrid)'
            else:
                mm = re.search(r'(\d+)-Speed (Manual|Automatic)', l); t = '%s-speed %s' % (mm.group(1), mm.group(2).lower())
            if paddles and 'Manual' not in l: t += ' with paddle shifters'
            if decel: t += ' with deceleration selectors'
        r['transmission'] = t
        # drivetrain
        r['drivetrain'] = {'2WD': 'FWD', 'AWD': 'AWD'}.get(drive) or ('AWD' if awd_std else 'FWD' if fwd else None)
        fuel = c.val(r'^(Recommended|Required) Fuel')[1]
        r['recommended_fuel'] = None if not fuel else 'premium' if re.search(r'Premium Recommended', fuel) else 'regular' if re.search(r'Regular', fuel) else None
        # ---- efficiency
        mpg = c.by_drive(r'EPA (MPG|Fuel Economy) Ratings|^MPG Ratings')
        tri = tuple(int(num(x)) for x in parts(mpg)) if mpg else None
        if tri and len(tri) == 3: r['mpg_city'], r['mpg_highway'], r['mpg_combined'] = tri
        else: r['mpg_city'] = r['mpg_highway'] = r['mpg_combined'] = None; tri = None
        # ---- EV
        r['electric_range_mi'] = thousands(c.by_drive(r'^Range Rating')) if ev else None
        r['battery_kwh'] = n1(r'^Battery Capacity \(kWh') if ev else None
        mpge = c.by_drive(r'^MPGe') if ev else None
        etri = tuple(int(num(x)) for x in parts(mpge)) if mpge else None
        r['mpge_combined'] = etri[2] if etri else None
        r['epa_annual_fuel_cost_usd'] = epa_cost(slug, etri if ev else tri) if (etri or tri) else None
        # ---- chassis and wheels
        w = c.val(r'^Wheels')[1]
        mm = re.search(r'(\d+(?:\.\d+)?)\s*(?:in\b|x\s)', w or '')
        r['wheel_size_in'] = float(mm.group(1)) if mm else None
        tire = None
        for l, v in c.find(r'Tires'):
            mm = re.search(r'(\d{3})\s*/\s*(\d{2})\s*/?\s*(Z?R)\s*(\d{2})', v)
            if mm: tire = '%s/%s%s%s' % mm.groups(); break
        r['tire_size'] = tire
        r['spare_tire'] = ('full-size' if c.find(r'^Full-Size Spare') else 'compact' if c.find(r'^Compact Spare') else 'repair kit' if c.find(r'^Tire Repair Kit') else None)
        # ---- safety
        av = lambda pat: 'standard' if c.find(pat, std_only=True) else 'not available'
        r['driver_assist_suite'] = 'Honda Sensing' if [1 for s2, l, v in c.rows if re.search('Honda Sensing', s2) and v == 'Std'] else None
        r['adaptive_cruise'] = av(r'Adaptive Cruise Control')
        r['blind_spot_monitoring'] = av(r'Blind Spot Information|Side Blind Zone Alert')
        r['camera_360'] = av(r'Multiview Camera System|Surround Vision')
        # ---- tech
        def inch(pat):
            h = c.find(pat, std_only=True)
            return float(re.match(r'([\d.]+)-?\s?inch', h[0][0], re.I).group(1)) if h else None
        r['touchscreen_in'] = inch(r'^[\d.]+-inch Color Touchsc')
        r['digital_cluster_in'] = inch(r'^[\d.]+-inch (TFT Meter|Meter Display|Digital Instrument Cluster)')
        r['carplay_android_auto'] = ('wireless' if c.find(r'^Wireless Apple CarPlay', std_only=True) else 'wired' if c.find(r'^Apple CarPlay', std_only=True) else 'not available')
        snd = c.find(r'(Audio|Sound) System with', std_only=True)
        r['sound_system'] = re.sub(r'[®™]', '', snd[0][0]).strip() if snd else None
        r['head_up_display'] = av(r'Head-Up Display')
        r['wireless_charging'] = av(r'^Wireless (Phone Charger|Charging Pad)')
        r['google_built_in'] = av(r'^Google built-in')
        # ---- comfort
        seat = None
        for l, v in c.find(r'Leather|HondaTex|Cloth|Suede', std_only=True):
            if re.search(r'Steering|Shift|Dashboard|Door|Wrapped', l): continue
            if re.search(r'Cloth', l) and re.search(r'Leather|HondaTex', l): seat = 'other'
            elif re.search(r'Synthetic Leather|HondaTex', l): seat = 'synthetic leather'
            elif re.search(r'Suede', l) and not re.search(r'Leather', l): seat = 'other'
            elif re.search(r'Leather', l): seat = 'leather'
            break
        if seat is None:   # Honda's spec page has no seat row for this trim: use the Build & Price trim line
            seat = {'cloth': 'cloth', 'leather': 'leather', 'honda-tex': 'synthetic leather'}.get(seat_raw.get(tname), 'other')
        r['seat_material'] = seat
        r['heated_front_seats'] = av(r'^Heated Front Seats|Driver & Passenger Heated Seat')
        r['ventilated_front_seats'] = av(r'^Ventilated Front Seats')
        r['power_driver_seat'] = av(r"Driver's Seat with \d+-Way Power")
        r['climate_zones'] = 3 if c.find(r'Tri-Zone', std_only=True) else 2 if c.find(r'Dual.Zone', std_only=True) else 1 if c.find(r'Climate Control|^Air Conditioning', std_only=True) else None
        moon = c.find(r'Moonroof', std_only=True)
        r['sunroof'] = 'standard' if moon else 'not available'
        r['sunroof_type'] = None if not moon else 'panoramic' if re.search('Panoramic', moon[0][0]) else 'standard'
        r['heated_steering_wheel'] = av(r'^Heated Steering Wheel')
        r['keyless_push_start'] = av(r'Push ?button Start')
        rows.append(r)
    return rows

# ---------- outside sources, per trim ----------
def outside(r):
    s, t = r['_model'], r['_trim']
    hyb, gas = r['powertrain_type'] == 'hybrid', r['powertrain_type'] == 'gas'
    z = None; ts = None; nh = None; ii = None
    if s == 'civic-sedan': z = 6.2 if hyb else 9.7          # reviewed Civic sheet (gas: Consumer Reports)
    elif s == 'civic-hatchback': z = 6.1 if hyb else None    # no timed test of the gas hatchback
    elif s == 'civic-si-sedan': z = 6.8
    elif s == 'civic-type-r': z = 4.9; ts = 169
    elif s == 'accord-sedan': z = 6.7 if hyb else 8.0
    elif s == 'prelude': z = 6.5
    elif s == 'hr-v': z = 9.4
    elif s == 'cr-v': z = 7.3 if t.startswith('TrailSport') else 7.1 if hyb else 8.3
    elif s == 'passport': z = 7.1 if t.startswith('RTL') else 7.3
    elif s == 'pilot': z = 7.2
    elif s == 'odyssey': z = 6.4
    elif s == 'ridgeline': z = 6.0
    elif s == 'prologue': z = 5.9 if r['drivetrain'] == 'AWD' else None   # no test of the single-motor car
    # NHTSA overall stars (outside-sources.json)
    if s in ('civic-sedan', 'civic-hatchback', 'civic-si-sedan', 'accord-sedan', 'hr-v', 'cr-v', 'pilot', 'odyssey', 'ridgeline', 'prologue'): nh = 5
    elif s == 'passport': nh = 5 if t.startswith('RTL') else None       # TrailSport: overall not rated
    # IIHS 2026 awards that name this model year
    ii = {'civic-hatchback': 'Top Safety Pick', 'accord-sedan': 'Top Safety Pick', 'hr-v': 'Top Safety Pick+'}.get(s)
    r['zero_to_sixty_s'], r['top_speed_mph'], r['nhtsa_overall_stars'], r['iihs_award'] = z, ts, nh, ii
    for k in ('frunk_cu_ft', 'max_dc_charge_kw', 'dc_charge_10_80_min', 'level2_charge_hrs', 'charging_port', 'epa_url', 'nhtsa_url'): r[k] = None

MODELS = {  # slug: (assembly_plant, generation, powertrain_warranty, ev_battery_warranty)
 'civic-sedan': ('Alliston, Ontario, Canada', '11th generation (all-new for 2022, refreshed for 2025)', '5 yr / 60,000 mi', None),
 'civic-hatchback': ('Greensburg, Indiana (Indiana Auto Plant)', '11th generation (all-new for 2022, refreshed for 2025)', '5 yr / 60,000 mi', None),
 'civic-si-sedan': ('Alliston, Ontario, Canada', 'Based on the 11th-generation Civic (all-new for 2022, refreshed for 2025)', '5 yr / 60,000 mi', None),
 'civic-type-r': ('Yorii, Japan', 'Based on the 11th-generation Civic (all-new for 2023)', '5 yr / 60,000 mi', None),
 'accord-sedan': ('Marysville, Ohio (Marysville Auto Plant)', '11th generation (all-new for 2023)', '5 yr / 60,000 mi', '8 yr / 100,000 mi'),
 'prelude': ('Yorii, Japan', '6th generation (new for 2026)', '5 yr / 60,000 mi', '8 yr / 100,000 mi'),
 'hr-v': ('Celaya, Guanajuato, Mexico', 'All-new for 2023', '5 yr / 60,000 mi', None),
 'cr-v': ('East Liberty, Ohio; Greensburg, Indiana; Alliston, Ontario, Canada', '6th generation (all-new for 2023)', '5 yr / 60,000 mi', None),
 'passport': ('Lincoln, Alabama (Alabama Auto Plant)', '4th generation (all-new for 2026)', '5 yr / 60,000 mi', None),
 'pilot': ('Lincoln, Alabama (Alabama Auto Plant)', '4th generation (all-new for 2023, refreshed for 2026)', '5 yr / 60,000 mi', None),
 'odyssey': ('Lincoln, Alabama (Alabama Auto Plant)', '5th generation (all-new for 2018)', '5 yr / 60,000 mi', None),
 'ridgeline': ('Lincoln, Alabama (Alabama Auto Plant)', '2nd generation (last full redesign for 2017)', '5 yr / 60,000 mi', None),
 'prologue': ('Ramos Arizpe, Coahuila, Mexico (built by General Motors)', '1st generation (new for 2024)', None, '8 yr / 100,000 mi'),
}


def all_rows():
    M = load(); rows = []
    for slug in DB:
        rs = build(slug, M[slug])
        for r in rs: outside(r)
        rows += rs
    return rows, M

def q(v):
    if v is None: return 'null'
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

if __name__ == '__main__':
    R, M = all_rows()
    cols = [k for k in R[0] if not k.startswith('_')]
    data_cols = [c for c in cols if c != 'trim_id' and any(r[c] is not None for r in R)]
    C = ['trim_id'] + data_cols
    sql = 'insert into public.trim_specs (' + ', '.join(C) + ') values\n'
    sql += ',\n'.join('(' + ', '.join(q(r[c]) for c in C) + ')' for r in R)
    sql += '\non conflict (trim_id) do update set ' + ', '.join('%s = excluded.%s' % (c, c) for c in data_cols) + ', updated_at = now();\n'
    open(HERE + 'specs-load.sql', 'w').write(sql)
    out = []
    for slug, (plant, gen, pt, ev) in MODELS.items():
        maint = any(l.startswith('Honda Maintenance Program 1yr / 12k miles') and all(c == 'Std' for c in cells) for sec, l, cells in M[slug]['rows'])
        out.append("update public.models set assembly_plant = %s, generation = %s, basic_warranty = '3 yr / 36,000 mi', powertrain_warranty = %s, ev_battery_warranty = %s, complimentary_maintenance = %s where slug = %s and brand_id = (select id from public.brands where slug = 'honda');"
                   % (q(plant), q(gen), q(pt), q(ev), q('1 yr / 12,000 mi (Honda Maintenance Program)' if maint else None), q(slug)))
    open(HERE + 'specs-models.sql', 'w').write('\n'.join(out) + '\n')
    print(len(R), 'trims;', len(data_cols), 'fields with data;', len(MODELS), 'models')
    for c in data_cols:
        print('%-26s empty on %2d trims' % (c, len([r for r in R if r[c] is None])))
    if len(sys.argv) > 1: json.dump(R, open(sys.argv[1], 'w'))
