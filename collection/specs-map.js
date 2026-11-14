// Maps Honda's "Features & Specs" tables onto the project's spec fields.
// Every value is copied from a row of Honda's table; nothing is computed or guessed. Unmatched fields stay empty.
const fs = require('fs');
const text = fs.readFileSync(process.argv[2], 'utf8');
// kind 'v': measured value (cell text). kind 'f': feature (the row label when the cell says Std, or "label: value").
const FIELDS = [
  ['Dimensions', 'Length (in)', 'v', /^Length \(in/i], ['Dimensions', 'Width (in)', 'v', /^Width \(in/i], ['Dimensions', 'Height (in)', 'v', /^Height \(in/i],
  ['Dimensions', 'Wheelbase (in)', 'v', /^Wheelbase/i], ['Dimensions', 'Ground clearance (in)', 'v', /^Ground Clearance/i], ['Dimensions', 'Turning circle (ft)', 'v', /^Turning Diameter/i],
  ['Interior space', 'Seating capacity', 'f', /\d-Person Seating Capacity|Seating Capacity/i], ['Interior space', 'Headroom (in)', 'v', /^Headroom/i], ['Interior space', 'Legroom (in)', 'v', /^Legroom/i],
  ['Interior space', 'Shoulder room (in)', 'v', /^Shoulder Room/i], ['Interior space', 'Passenger volume (cu ft)', 'v', /Passenger Volume/i], ['Interior space', 'Cargo volume (cu ft)', 'v', /Cargo Volume|Cargo Capacity|^Bed Volume|In-Bed Trunk.*Volume|Trunk Volume/i],
  ['Weight and capacity', 'Curb weight (lb)', 'v', /^Curb Weight/i], ['Weight and capacity', 'Gross vehicle weight rating (lb)', 'v', /GVWR|Gross Vehicle Weight/i], ['Weight and capacity', 'Payload (lb)', 'v', /Payload/i],
  ['Weight and capacity', 'Towing capacity (lb)', 'v', /Towing Capacity/i], ['Weight and capacity', 'Fuel tank capacity (gal)', 'v', /^Fuel Tank Capacity/i], ['Weight and capacity', 'Bed length (in)', 'v', /^Bed Length|Bed Length \(/i],
  ['Powertrain', 'Engine', 'v', /^Engine Type/i], ['Powertrain', 'Displacement (cc)', 'v', /^Displacement/i], ['Powertrain', 'Horsepower', 'v', /^Horsepower|^Total System Horsepower/i], ['Powertrain', 'Torque (lb-ft)', 'v', /^Torque|Total System Torque/i],
  ['Powertrain', 'Electric motor output', 'v', /Electric Motor.*\((horsepower|hp|kW)|^Motor (Power|Output)/i], ['Powertrain', 'Transmission', 'f', /Transmission|^Direct Drive Unit|Single-Speed|eCVT/i],
  ['Powertrain', 'Drivetrain', 'f', /^Front-Wheel Drive|All-Wheel Drive|AWD System|Real Time AWD|Single Motor|Dual Motor|Four-Wheel Drive/i], ['Powertrain', 'Fuel', 'v', /^(Recommended|Required) Fuel/i],
  ['Efficiency', 'EPA MPG (city / highway / combined)', 'v', /EPA (MPG|Fuel Economy|Mileage) Ratings?|MPG Ratings/i],
  ['EV and plug-in hybrid', 'Range, battery and charging', 'v', /Range Rating|MPGe|Charge Time|Battery Capacity/i],
  ['Chassis and wheels', 'Wheels', 'v', /^Wheels/i], ['Chassis and wheels', 'Tires', 'v', /Tires$|^Tires|Tires \(/i], ['Chassis and wheels', 'Spare tire', 'f', /Spare Tire|Tire Repair Kit/i],
  ['Safety', 'Driver-assist suite', 'f', /^Honda Sensing/i], ['Safety', 'Adaptive cruise control', 'f', /Adaptive Cruise Control/i], ['Safety', 'Blind-spot monitoring', 'f', /Blind (Spot|Zone)/i], ['Safety', 'Cameras and parking sensors', 'f', /Camera|Parking Sensors/i],
  ['Tech', 'Touchscreen', 'f', /Touch-?Screen|Color Touch|Display Audio/i], ['Tech', 'Apple CarPlay / Android Auto', 'f', /Apple CarPlay|Android Auto/i], ['Tech', 'Digital gauge cluster', 'f', /Driver Information Interface|Digital Instrument|Instrument Cluster|Meter Display/i],
  ['Tech', 'Sound system', 'f', /Speakers|Bose|Audio System/i], ['Tech', 'Head-up display', 'f', /Head-Up Display/i], ['Tech', 'Wireless phone charging', 'f', /Wireless (Phone )?Charg/i], ['Tech', 'Google built-in', 'f', /^Google built-in/i],
  ['Comfort', 'Seat material', 'f', /Leather-Trimmed|Cloth Seat|Seat Trim|Seating Surfaces|^Leather Seat|HondaTex|Suede|Combination Seat|Fabric Seat/i], ['Comfort', 'Heated front seats', 'f', /Heated Front Seats|Driver & Passenger Heated Seat/i], ['Comfort', 'Ventilated front seats', 'f', /Ventilated Front Seats|Heated and Ventilated/i],
  ['Comfort', 'Power driver seat', 'f', /Driver's Seat with .*Power|Power Adjust.*Driver/i], ['Comfort', 'Climate control', 'f', /Climate Control|^Air Conditioning/i], ['Comfort', 'Moonroof', 'f', /Moonroof/i],
  ['Comfort', 'Heated steering wheel', 'f', /Heated.*Steering Wheel/i], ['Comfort', 'Keyless entry and start', 'f', /Smart Entry|Push ?[Bb]utton Start|Remote Entry|Walk Away|Keyless/i]
];
const RESEARCH = [['Safety', 'NHTSA overall rating', 'NHTSA'], ['Safety', 'IIHS award', 'IIHS'], ['Efficiency', 'EPA annual fuel cost', 'fueleconomy.gov'], ['Performance', '0-60 mph', 'A trusted road test (shown with the info mark)'], ['Performance', 'Top speed', 'Honda does not list it'],
  ['Warranty', 'Basic / powertrain / battery warranty', 'Honda warranty page'], ['Background', 'Assembly plant', 'Honda news'], ['Background', 'Generation / redesign year', 'Honda news, IIHS']];
const out = [];
text.trim().split(/\n\n(?=## )/).forEach((block) => {
  const L = block.split('\n'); const [slug, title, url] = L[0].slice(3).split(' | ');
  const trims = L[1].split('|'); const n = trims.length;
  let section = ''; const rows = [];
  L.slice(2).forEach((l) => { if (!l.includes('|')) { section = l.replace(/[">]/g, '').trim(); return; } const c = l.split('|'); if (/^Starting at/.test(c[0])) return; if (c.length === n + 1) rows.push({ section, label: c[0], cells: c.slice(1) }); });
  const prices = (L[2] || '').split('|').map((p) => (p.match(/\$[\d,]+/) || [''])[0]);
  const sheet = FIELDS.map(([cat, name, kind, re]) => {
    const hit = rows.filter((r) => re.test(r.label) && r.section !== 'Key Features'); const used = [...new Set(hit.map((r) => r.label))];
    const vals = trims.map((t, i) => { const parts = []; hit.forEach((r) => { const c = (r.cells[i] || '').trim(); if (!c || c === '-') return; if (kind === 'v' && c !== 'Std') parts.push(hit.length > 1 ? r.label + ': ' + c : c); else parts.push(c === 'Std' ? r.label : r.label + ': ' + c); }); return [...new Set(parts)].join('; '); });
    if (name === 'Driver-assist suite') { const hs = rows.filter((r) => /Honda Sensing/i.test(r.section) || /Honda Sensing/i.test(r.label)); return { cat, name, vals: trims.map((t, i) => (hs.some((r) => (r.cells[i] || '') === 'Std') ? 'Honda Sensing' : '')), used: hs.length ? ['Honda Sensing section'] : [] }; }
    return { cat, name, vals, used };
  });
  out.push({ slug, title, url, trims, prices, rows, sheet });
});
fs.writeFileSync(process.argv[3], JSON.stringify({ models: out, research: RESEARCH }));
out.forEach((m) => { const empty = m.sheet.filter((f) => f.vals.every((v) => !v)).map((f) => f.name); console.log(m.slug.padEnd(16), m.rows.length + ' rows,', m.sheet.length - empty.length + '/' + m.sheet.length + ' fields found; empty:', empty.join(', ')); });
