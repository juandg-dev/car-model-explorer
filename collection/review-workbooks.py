# Builds the two review workbooks for a brand from its collected files. Usage (from the collection folder):
#   python3 review-workbooks.py acura /path/to/output/folder
# It only copies what is in <brand>/raw, <brand>/specs and <brand>/specs/outside-sources.json. Nothing is calculated.
# Juan types into the yellow "Juan's flag" column; an empty flag means "looks right".
import sys, os, json
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

B = sys.argv[1]; OUT = sys.argv[2]; NAME = B.capitalize()
ARIAL = Font(name='Arial', size=10); BOLD = Font(name='Arial', size=10, bold=True); HEAD = Font(name='Arial', size=10, bold=True, color='FFFFFF')
DARK = PatternFill('solid', fgColor='333333'); YELLOW = PatternFill('solid', fgColor='FFF2A8'); GRAY = PatternFill('solid', fgColor='EEEEEE')
TYPE = {'P': 'Package', 'W': 'Wheels', 'E': 'Exterior', 'I': 'Interior', 'L': 'Electronic', 'F': 'Factory package'}
FLAG = "Juan's flag"

def sheet(wb, title, header, rows, widths, flag=True, section_col=None):
    ws = wb.create_sheet(title[:31]); head = header + ([FLAG] if flag else [])
    ws.append(head)
    for c in ws[1]: c.font = HEAD; c.fill = DARK; c.alignment = Alignment(wrap_text=True, vertical='center')
    for r in rows:
        ws.append(list(r) + ([''] if flag else []))
        for c in ws[ws.max_row]: c.font = ARIAL; c.alignment = Alignment(wrap_text=True, vertical='top')
        if flag: ws.cell(ws.max_row, len(head)).fill = YELLOW
        if section_col is not None and r[section_col] and all(v == '' for i, v in enumerate(r) if i != section_col):
            for c in ws[ws.max_row]: c.font = BOLD; c.fill = GRAY
            if flag: ws.cell(ws.max_row, len(head)).fill = GRAY
    for i, w in enumerate(widths + ([30] if flag else [])): ws.column_dimensions[get_column_letter(i + 1)].width = w
    ws.freeze_panes = 'A2'; return ws

def readme(wb, lines):
    ws = wb.active; ws.title = 'Read me'
    for i, l in enumerate(lines):
        ws.append([l]); ws.cell(i + 1, 1).font = BOLD if i == 0 else ARIAL; ws.cell(i + 1, 1).alignment = Alignment(wrap_text=True, vertical='top')
    ws.column_dimensions['A'].width = 120
    ws.append(['']); ws.append(['Example of a flag: "Price is $815 on the site, not $701"']); ws.cell(ws.max_row, 1).font = ARIAL; ws.cell(ws.max_row, 1).fill = YELLOW

# ---------- options workbook ----------
raw = {}
for f in sorted(os.listdir(f'{B}/raw')):
    L = open(f'{B}/raw/{f}', encoding='utf8').read().strip().split('\n'); hd = L[0][1:].split('|')
    raw[hd[0]] = dict(hd=hd, T=[l.split(';') for l in L if l.startswith('T;')], C=[l.split(';') for l in L if l.startswith('C;')],
                      I=[l.split(';') for l in L if l[:2] in ('P;', 'W;', 'E;', 'I;', 'L;', 'F;')], R=[l[2:] for l in L if l.startswith('R;')])
order = [m for m in ['integra', 'adx', 'rdx', 'mdx'] if m in raw] + [m for m in raw if m not in ('integra', 'adx', 'rdx', 'mdx')]
wb = Workbook()
readme(wb, [f'{NAME} options review',
    f'Source: {NAME} Build & Price, read Nov 14, 2026. Facts only: names, prices, install times, rules, paints and interior colors.',
    'How to review: read each tab. If something is wrong or looks odd, type a note in the yellow "Juan\'s flag" column on that row. Leave it empty if the row is right.',
    'Tabs: "Trims" and "Paints" for the whole brand, one tab per model with every package and accessory, and "Left out" with entries that are in the carmaker\'s data but not offered on their own in its menu.',
    'On a model tab, "Yes" under a trim means the item is offered on that trim. Prices are in dollars as the menu shows them. Install hours are empty when the carmaker lists none.',
    '"Can\'t combine with", "Requires" and "Includes" are the carmaker\'s rules, written with the item names.',
    f'Things Claude already noticed are listed in collection/{B}/NOTES.md under "Odd values for Juan to look at".'])
sheet(wb, 'Trims', ['Model', 'Year', 'Trim', 'MSRP ($)', 'Destination fee ($)', 'Seat material', 'Carmaker model code'],
      [[raw[m]['hd'][1], int(raw[m]['hd'][2]), t[1], int(t[2]), raw[m]['hd'][4], t[4], t[3]] for m in order for t in raw[m]['T']], [12, 8, 34, 12, 16, 24, 22])
sheet(wb, 'Paints', ['Model', 'Paint', 'Paint code', 'Price ($)', 'Trim', 'Interior colors offered with this paint'],
      [[raw[m]['hd'][1], c[1], c[2], float(c[3]), raw[m]['T'][i][1], ('Not offered' if v == '0' else v.replace('/', ', '))] for m in order for c in raw[m]['C'] for i, v in enumerate(c[4].split(','))], [12, 30, 12, 10, 34, 44])
for m in order:
    r = raw[m]; names = [t[1] for t in r['T']]; I = r['I']
    ref = lambda s: '; '.join(I[int(x)][1] + ' ($' + I[int(x)][2] + ')' for x in s.split(',') if x)
    rows = [[TYPE[it[0]], it[1], float(it[2]), (float(it[3]) if it[3] else '')] + ['Yes' if int(it[4]) >> i & 1 else '' for i in range(len(names))] + [ref(it[5]), ref(it[6]), ref(it[7]), it[8]] for it in I]
    sheet(wb, r['hd'][1], ['Type', 'Item', 'Price ($)', 'Install hours'] + names + ["Can't combine with", 'Requires', 'Includes', 'Carmaker code'], rows, [16, 44, 11, 9] + [13] * len(names) + [40, 34, 40, 12])
left = [[raw[m]['hd'][1], ('Sold together (parts inside one menu price)' if e.startswith('Sold together') else 'Left out'), e] for m in order for line in raw[m]['R'] for e in line.split(' // ') if e]
sheet(wb, 'Left out', ['Model', 'Kind', 'Entry (name and price as in the carmaker\'s data)'], left, [12, 40, 110])
wb.save(f'{OUT}/{NAME} options review.xlsx')

# ---------- specs workbook ----------
wb = Workbook()
readme(wb, [f'{NAME} specs review',
    f'Source: {NAME} "Specs & Pricing" pages, read Nov 14, 2026, plus outside sources (NHTSA, EPA, IIHS, road tests) on the "Outside sources" tab.',
    'How to review: read each tab. If a value is wrong or looks odd, type a note in the yellow "Juan\'s flag" column on that row. Leave it empty if the row is right.',
    'On a model tab every row of the carmaker\'s spec table is shown as collected. "Std" means standard on that trim (the carmaker wrote "Yes"). "-" means the cell was empty: not offered or not applicable.',
    'Trims that come with two drives share one column; values that differ by drive are separate rows (price, MPG, curb weight, towing).',
    'On "Outside sources", entries marked "confirm" or "as reported by" were not read at the original source. Where two numbers are listed for one car, say which one to show.',
    f'Nothing is estimated. A value the carmaker does not publish is not in this workbook. Open questions are in collection/{B}/NOTES.md.'])
for m in order:
    L = open(f'{B}/specs/{raw[m]["hd"][3]}.txt', encoding='utf8').read().strip().split('\n'); trims = L[1].split('|'); rows = []
    for l in L[3:]:
        c = l.split('|')
        rows.append([c[0]] + [''] * len(trims) if len(c) == 1 else c[:len(trims) + 1] + [''] * (len(trims) + 1 - len(c)))
    ws = sheet(wb, raw[m]['hd'][1], ['Spec (as on the carmaker\'s page)'] + trims, rows, [58] + [24] * len(trims), section_col=0)
    ws.append([]); ws.append(['Source: ' + L[0].split(' | ')[-1]]); ws.cell(ws.max_row, 1).font = ARIAL
o = json.load(open(f'{B}/specs/outside-sources.json')); KIND = {'nhtsa': 'NHTSA rating', 'epa': 'EPA annual fuel cost', 'iihs': 'IIHS award', 'warranty': 'Warranty', 'plant': 'Assembly plant', 'zero_to_60': '0-60 mph', 'top_speed': 'Top speed', 'generation': 'Generation'}
rows = []
for k, label in KIND.items():
    sec = o.get(k, {}); rows.append([label, '', '', '']); rows.append(['', 'All', 'Where it comes from: ' + sec.get('source', '') + (' Note: ' + sec['note'] if sec.get('note') else ''), ''])
    for m in order:
        for e in sec.get(raw[m]['hd'][3], []):
            text, _, url = e.partition(' | '); rows.append(['', raw[m]['hd'][1], text, url])
sheet(wb, 'Outside sources', ['What', 'Model', 'Value', 'Link'], rows, [22, 10, 100, 60], section_col=0)
wb.save(f'{OUT}/{NAME} specs review.xlsx')
print('written to', OUT)
