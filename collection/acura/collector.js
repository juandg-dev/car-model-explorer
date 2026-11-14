// Acura options collector.
// Where it runs: pasted into the browser on any www.acura.com page (it calls Acura's own Build & Price data).
// What it returns: one text block per model in the raw format described in collection/README.md.
// It reads facts only (names, prices, install times, rules, paint and interior availability). No images, no marketing text.
//
// How Acura differs from Honda:
//  - Acura calls its trims "packages" (Technology, A-Spec, Advance, Type S). Each one is a T line here.
//  - Two data files are used per model:
//      /platform/api/v1/vehicles/details/<year>/<series>             the list of trims, and each accessory's install time
//      /platform/api/v1/vehicles/<year>/<series>/configurator?modelId=<trim>   the Build & Price menu for one trim:
//        the names and prices shoppers see, the menu section, the rules, and the paint and interior combinations
//  - The menu marks some entries "hidden": parts that are never offered on their own (a hitch harness, tire sensors).
//    When a menu item requires hidden parts and Acura gives one price for the set, that set price is used here and
//    the parts are listed on the R line as "Sold together as ...". All other hidden entries go on the R line too.
//
// Usage in the page:   await collectAcura('rdx', 'RDX', 2026, 'rdx', 'suv')
//                      checksum(text)   // compare with the checksum of the saved file (collection/checksum.js)

window.checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };

window.collectAcura = async (id, name, year, series, body) => {
  const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error('Acura returned ' + r.status + ' for ' + url); return r.json(); };
  const d = await get('/platform/api/v1/vehicles/details/' + year + '/' + series);
  if (!d.TrimGroups || !d.TrimGroups.length) throw new Error('No trims for ' + year + ' ' + series);
  const dec = (t) => { try { return decodeURIComponent(t || ''); } catch (e) { return t || ''; } };
  // Plain text only: drop HTML tags and trademark signs, and keep ";" out because it separates fields.
  const clean = (t) => dec(t).replace(/<[^>]*>/g, '').replace(/&reg;|&trade;|[™®]/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/;/g, ',').replace(/\s+/g, ' ').trim();
  const num = (t) => Math.round(parseFloat(String(t).replace(/,/g, '')) * 100) / 100;
  const models = []; d.TrimGroups.forEach((g) => g.Models.forEach((m) => models.push(m)));
  const cfgs = []; for (const m of models) cfgs.push(await get('/platform/api/v1/vehicles/' + year + '/' + series + '/configurator?modelId=' + m.ModelId));
  const warn = [];

  // 1. Trims. When two trims share a name, add what tells them apart: the drive (FWD, AWD, SH-AWD) or the gearbox (CVT, 6MT).
  const DRIVE = { fwd: 'FWD', awd: 'AWD', 'sh-awd': 'SH-AWD' }, GEAR = { 'continuously-variable-transmission': 'CVT', '6-speed-manual': '6MT' };
  const base = cfgs.map((c) => clean(c.settings.model.packageName));
  const labels = base.map((b, i) => {
    const same = base.map((x, j) => (x === b ? j : -1)).filter((j) => j >= 0); if (same.length < 2) return b;
    const pt = (j) => cfgs[j].settings.powertrain; const drv = (j) => DRIVE[pt(j).drivetrain.replace(/-(6MT|type-s)$/, '')] || pt(j).drivetrain;
    if (new Set(same.map(drv)).size === same.length) return b + ' ' + drv(i);
    return b + ' ' + (GEAR[pt(i).transmission] || pt(i).transmission);
  });
  // Seat material, in Acura's own words, from the trim's standard-feature list (empty when the list doesn't say).
  const seat = (c) => {
    const f = c.features.flatMap((x) => x.items.map((y) => clean(y.name))).filter((n) => /leather|suede/i.test(n) && /seat|interior|insert/i.test(n) && !/steering|shift/i.test(n)).join(' ').toLowerCase();
    const parts = []; if (/leatherette/.test(f)) parts.push('leatherette'); else if (/leather/.test(f)) parts.push('leather');
    if (/microsuede/.test(f)) parts.push('microsuede'); if (/ultrasuede/.test(f)) parts.push('ultrasuede');
    return parts.join('/');
  };

  // 2. Every menu item on every trim, merged by code. mask = which trims offer it (bit 0 = first trim).
  const opts = {}, order = [], left = {}, sold = {};
  models.forEach((m, i) => {
    const a = cfgs[i].accessories; const items = a.items.concat((cfgs[i].charging || {}).items || []);
    const byCode = {}; items.forEach((it) => { byCode[it.opCode] = it; });
    const hours = {}; m.ModelOptionList.forEach((o) => { hours[o.OpCode] = o.OptionLaborTime === '' || o.OptionLaborTime == null ? null : +o.OptionLaborTime; });
    const cat = {}; (a.categories || []).forEach((c) => c.subcategories.forEach((s) => { cat[c.id + '|' + s.id] = c.name === 'Packages' ? (s.name === 'Manufacturer' ? 'F' : 'P') : c.name === 'Exterior' ? 'E' : c.name === 'Interior' ? 'I' : null; }));
    const charging = new Set(((cfgs[i].charging || {}).items || []).map((x) => x.opCode));
    items.filter((it) => !it.hidden).forEach((it) => {
      let letter = charging.has(it.opCode) ? 'F' : cat[it.category + '|' + it.subcategory];
      const nm = clean(it.name); if (letter === 'E' && /alloy wheels/i.test(nm)) letter = 'W';
      // When Acura gives a set price, the hidden parts this item requires are part of that price ("sold together").
      // Without a set price the item keeps its own price and the hidden requirement is noted on the R line.
      const hiddenReq = (it.rules.requires || []).filter((c) => byCode[c] && byCode[c].hidden);
      const parts = it.priceBundle == null ? [] : hiddenReq;
      let price = num(it.price), hrs = hours[it.opCode] == null ? null : hours[it.opCode];
      if (!parts.length && hiddenReq.length) left[nm + ' $' + price + ' requires ' + hiddenReq.map((c) => clean(byCode[c].name) + ' $' + num(byCode[c].price)).join(' + ') + ' [required part not in menu]'] = 1;
      if (parts.length) {
        const sum = Math.round((num(it.price) + parts.reduce((s, c) => s + num(byCode[c].price), 0)) * 100) / 100;
        if (num(it.priceBundle) !== sum) warn.push(nm + ': set price ' + it.priceBundle + ' vs parts ' + sum);
        price = num(it.priceBundle);
        if (hrs != null || parts.some((c) => hours[c] != null)) hrs = Math.round(((hrs || 0) + parts.reduce((s, c) => s + (hours[c] || 0), 0)) * 100) / 100;
        sold['Sold together as ' + nm + ': ' + [it].concat(parts.map((c) => byCode[c])).map((p) => clean(p.name) + ' $' + num(p.price)).join(' + ')] = 1;
      } else if (it.priceBundle != null && num(it.priceBundle) !== num(it.price)) warn.push(nm + ': set price ' + it.priceBundle + ' but no hidden parts');
      if (!letter) { left[nm + ' $' + price + ' [no menu section]'] = 1; return; }
      if (!opts[it.opCode]) { opts[it.opCode] = { letter, name: nm, price, hrs, mask: 0, x: new Set(), req: new Set(), inc: new Set() }; order.push(it.opCode); }
      const r = opts[it.opCode]; r.mask |= 1 << i;
      if (r.price !== price || r.hrs !== hrs || r.name !== nm) warn.push(nm + ': differs between trims under one code ' + it.opCode);
      (it.rules.excludes || []).forEach((c) => r.x.add(c)); (it.rules.requires || []).forEach((c) => r.req.add(c)); (it.rules.includes || []).forEach((c) => r.inc.add(c));
    });
    // Left out: hidden menu entries, and anything in Acura's data that is not in the menu at all.
    items.filter((it) => it.hidden).forEach((it) => { left[clean(it.name) + ' $' + num(it.price)] = 1; });
    m.ModelOptionList.forEach((o) => { if (!byCode[o.OpCode]) left[clean(o.OptionName) + ' $' + num(o.OptionPrice) + ' [not in menu]'] = 1; });
  });

  // 3. Merge rows that differ only by code (same section, name, price and install time).
  const keep = [], map = {}, byKey = {};
  order.forEach((code, i) => {
    const o = opts[code]; const key = [o.letter, o.name, o.price, o.hrs].join('|');
    if (byKey[key] == null) { byKey[key] = keep.length; keep.push({ letter: o.letter, name: o.name, price: o.price, hrs: o.hrs, mask: 0, x: [], req: [], inc: [], code: code.replace(/^[A-Z-]+/, '') }); }
    const k = keep[byKey[key]]; k.mask |= o.mask; map[i] = byKey[key];
    k.x.push(...[...o.x].map((c) => order.indexOf(c))); k.req.push(...[...o.req].map((c) => order.indexOf(c))); k.inc.push(...[...o.inc].map((c) => order.indexOf(c)));
  });
  const refs = (list, self) => [...new Set(list.map((i) => map[i]).filter((i) => i != null && i !== self))].join(',');

  // 4. Paints: price and, per trim, the interior colors offered with that paint (0 = paint not offered on that trim).
  const paints = {}, porder = [];
  cfgs.forEach((c, i) => c.exteriors.colorCombinations.forEach((cc) => {
    const k = cc.color.manufacturingCode || cc.color.code;
    if (!paints[k]) { paints[k] = { name: clean(cc.color.name), price: num(cc.color.deltaPrice || 0), per: models.map(() => 0) }; porder.push(k); }
    if (paints[k].price !== num(cc.color.deltaPrice || 0)) warn.push(paints[k].name + ': paint price differs between trims'); paints[k].price = Math.max(paints[k].price, num(cc.color.deltaPrice || 0));
    paints[k].per[i] = [...new Set(cc.interiors.map((x) => clean(x.name)))].join('/') || 'Yes';
  }));

  // 5. Write the file.
  const dest = [...new Set(cfgs.map((c) => num(c.settings.model.destinationCharge)))].join(',');
  const lines = ['#' + [id, name, year, series, dest, body].join('|')];
  models.forEach((m, i) => { if (num(cfgs[i].settings.model.msrp) !== num(m.MSRP)) warn.push(labels[i] + ': price differs between the two data files'); lines.push(['T', labels[i], num(m.MSRP), m.ModelId, seat(cfgs[i])].join(';')); });
  porder.forEach((k) => lines.push(['C', paints[k].name, k, paints[k].price, paints[k].per.join(',')].join(';')));
  keep.forEach((k, i) => lines.push([k.letter, k.name, k.price, k.hrs == null ? '' : k.hrs, k.mask, refs(k.x, i), refs(k.req, i), refs(k.inc, i), k.code].join(';')));
  lines.push('R;' + Object.keys(left).concat(Object.keys(sold)).join(' // '));
  window.acuraWarnings = warn; // anything the script could not reconcile; must be empty or explained in NOTES.md
  return lines.join('\n');
};
