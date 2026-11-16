// Toyota options collector (also used for Lexus: pass 'LEXUS' as the last argument).
// Where it runs: pasted into the browser on a www.toyota.com/configurator page. It asks Toyota's own
//   Build & Price data service (the address is in window.vcrHost on that page) the same questions the page asks.
// What it returns: { text, stats }. `text` is one model in the raw format described in collection/README.md.
//   `stats` is only for NOTES.md (counts and Toyota's own category names); it is not saved.
// It reads facts only (names, prices, availability, rules, paint and interior combinations). No images, no descriptions.
//
// How Toyota differs from Honda and Acura:
//   - Toyota has no data file per model. The page asks a GraphQL service one question per trim.
//   - Accessories depend on the sales region. This collector always asks for Toyota's NATIONAL list (no ZIP code).
//   - Rules are not listed. They are found the way the page finds them: select an item, then read which
//     other items the service now marks "not compatible", and ask it what a blocked item needs.
//   - Toyota publishes no install times, so that field is always empty.
//
// Usage in the page:   r = await collectToyota('camry', 2027, 'camry', 'sedan')
//                      (leave out the last value and the collector picks 'sedan' or 'suv' from Toyota's categories)
//                      checksum(r.text)   // compare with the checksum of the saved file (collection/checksum.js)

window.checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };

// Toyota's accessory menu sections -> the category letters of the raw format. Sections not listed here become 'E'.
window.TOYOTA_SECTIONS = { Wheels: 'W', 'Accessory Packages': 'P', 'Accessory Package': 'P', Technology: 'L', Lighting: 'L', Interior: 'I', Storage: 'I', 'Pet Products': 'I' };

window.collectToyota = async (id, year, series, body, brand = 'TOYOTA') => {
  const region = { regionName: 'NATIONAL' }, language = 'EN';
  // "random" is the value Toyota's own page sends; the service is public and has no real key.
  const ask = async (query, variables) => {
    const res = await fetch(window.vcrHost, { method: 'POST', headers: { 'content-type': 'application/json; charset=UTF-8', 'x-api-key': 'random' }, body: JSON.stringify({ query, variables }) });
    if (!res.ok) throw new Error('Toyota returned ' + res.status + ' for ' + year + ' ' + series);
    const j = await res.json(); if (j.errors) throw new Error(year + ' ' + series + ': ' + j.errors[0].message); return j.data;
  };
  const clean = (t) => (t || '').replace(/<[^>]*>/g, ' ').replace(/\[[a-z0-9_]+\]/gi, ' ').replace(/[™®;]/g, '').replace(/\s+/g, ' ').trim();
  const tags = (t) => ((t || '').match(/\[[a-z0-9_]+\]/gi) || []);

  // The questions. Same fields the page asks for, minus images, descriptions and disclaimers.
  const C = 'compatibilityWithCurrentConfig { availableWithTrims isCompatible requiredItems { itemCode itemType } }';
  const V = '{ code ' + C + ' value }', M = 'msrp { value }';
  const TRIM = '{ accessoryIds { id ' + M + ' } cabBed { code ' + C + ' id label } code ' + C + ' defaultColorId exteriorColorIds fuelType interiorColorIds isDefaultTrim ' + M + ' packageIds { id ' + M + ' } powertrain { ' + C + ' drive ' + V + ' engine ' + V + ' horsepower { ' + C + ' value } transmission ' + V + ' } drive ' + V + ' engine ' + V + ' transmission ' + V + ' seating ' + V + ' title wheelCodes }';
  const Q_TRIM = 'query GetConfigByGrade($configInputGrade: ConfigInputGrade!) { getConfigByGrade(configInputGrade: $configInputGrade) { accessories { code ' + C + ' id includedAccessoryIds installPoint title type } categories { id value } defaultConfig { accessoryIds exteriorColorId interiorColorId packageIds trimId wheelsId } dph exteriorColors { code ' + C + ' id isExtraCostColor ' + M + ' title } grade { baseMsrp { value } exteriorColorIds gradeName hasSeatingOptions interiorColorIds trims ' + TRIM + ' } interiorColors { code ' + C + ' id material ' + M + ' name title } ' + M + ' packages { availability category code ' + C + ' id installPoint subCategories title type } seating seriesId seriesName trim ' + TRIM + ' wheels { code ' + C + ' title type ... on OptionWheel { ' + M + ' } } year } }';
  const c = 'compatibilityWithCurrentConfig { isCompatible requiredItems { itemCode itemType } }';
  const Q_SELECT = 'query GetUpdatedConfig($config: ConfigInput! $currentSelectedConfig: CurrentSelectedConfig! $latestItemSelected: [LatestItemSelected!]) { getUpdatedConfig(config: $config currentSelectedConfig: $currentSelectedConfig latestItemSelected: $latestItemSelected) { accessories { id code ' + c + ' } packages { id code ' + c + ' } exteriorColors { id code ' + c + ' } interiorColors { id code ' + c + ' } } }';
  const Q_NEEDS = 'query GetRecommendation($config: ConfigInput! $currentSelectedConfig: CurrentSelectedConfig! $latestItemSelected: LatestItemSelected!) { getRecommendation(config: $config currentSelectedConfig: $currentSelectedConfig latestItemSelected: $latestItemSelected) { isConfigValid resolveSteps { applicableTrimId requiredChanges { changeType itemCode itemType } weight } } }';
  const Q_SERIES = 'query GetSeries($brand: Brand! $language: Language $region: Region! $seriesId: String $showApplicableSeriesForVisualizer: Boolean $year: Int) { getSeries(brand: $brand language: $language region: $region seriesId: $seriesId showApplicableSeriesForVisualizer: $showApplicableSeriesForVisualizer year: $year) { seriesData { id name yearSpecificData { year grades { gradeName trims { code } } } } } }';

  // 1. The trims, in Toyota's order (grade by grade).
  const sd = (await ask(Q_SERIES, { brand, seriesId: series, year, region, showApplicableSeriesForVisualizer: true, language })).getSeries.seriesData.find((s) => s.id === series);
  const ys = sd && sd.yearSpecificData.find((y) => y.year === year);
  if (!ys || !ys.grades.length) throw new Error('No trims for ' + year + ' ' + series);
  const trims = []; ys.grades.forEach((g) => g.trims.forEach((t) => trims.push({ grade: g.gradeName, code: t.code })));

  const stats = { sections: {}, tags: {}, installPoints: {}, availability: {}, wheels: 0, calls: 0, allAccessoriesFlagged: 0, defaultTrimMismatch: 0, sameCodeTwice: 0 };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const notes = {}; const note = (msg, i) => { (notes[msg] = notes[msg] || new Set()).add(i); };
  let name = sd.name, dphs = new Set(), cats = [];

  // 2. One trim: what it offers, at what price, and its rules.
  const readTrim = async (t, i) => {
    const cfg = (await ask(Q_TRIM, { configInputGrade: { brand, seriesId: series, year, region, language, trimId: t.code } })).getConfigByGrade; stats.calls++;
    cfg.accessories.forEach((a) => { a.warranty = ''; }); // the service wants this field back; the text itself is not collected
    const tr = cfg.grade.trims.find((x) => x.code === t.code); if (!tr) throw new Error('Trim ' + t.code + ' missing in ' + series);
    if (cfg.defaultConfig.trimId !== t.code) stats.defaultTrimMismatch++;
    name = cfg.seriesName || name; dphs.add(+cfg.dph); cats = (cfg.categories || []).map((x) => x.id);
    const pt = tr.powertrain || {};
    t.msrp = +tr.msrp.value; t.title = clean(tr.title);
    t.attrs = { drive: (pt.drive || {}).value || '', cab: (tr.cabBed || {}).label || '', engine: (pt.engine || {}).value || '', transmission: (pt.transmission || {}).value || '', seats: (tr.seating || {}).value || '' };
    const cur = { brand, seriesId: series, grade: t.grade, trim: t.code, year, exteriorColorCode: cfg.defaultConfig.exteriorColorId, interiorColorCode: cfg.defaultConfig.interiorColorId, packageCodes: [], accessoryCodes: [] };
    const select = async (change, latest) => { stats.calls++; return (await ask(Q_SELECT, { config: cfg, currentSelectedConfig: { ...cur, ...change }, latestItemSelected: latest })).getUpdatedConfig; };
    const ok = (x) => x.compatibilityWithCurrentConfig.isCompatible;

    // Items offered on this trim. key = kind:code. Packages and factory options come from Toyota's "packages" list.
    const priceOf = {}; tr.packageIds.forEach((p) => { priceOf[p.id] = p.msrp.value; }); tr.accessoryIds.forEach((a) => { priceOf[a.id] = a.msrp.value; });
    t.items = {}; t.rules = [];
    const add = (kind, x, letter) => { if (t.items[kind + ':' + x.code]) stats.sameCodeTwice++; t.items[kind + ':' + x.code] = { letter, name: clean(x.title), price: priceOf[x.id] == null || priceOf[x.id] === '' ? '' : +priceOf[x.id], code: x.code }; };
    const packs = cfg.packages.filter((p) => p.id in priceOf), accs = cfg.accessories.filter((a) => a.id in priceOf);
    packs.forEach((p) => { add('PACKAGE', p, p.type === 'PACKAGE' ? 'P' : 'F'); bump(stats.availability, p.type + '/' + p.availability + '/' + p.installPoint); });
    accs.forEach((a) => { add('ACCESSORY', a, window.TOYOTA_SECTIONS[a.type] || 'E'); bump(stats.sections, a.type); bump(stats.installPoints, a.installPoint); tags(a.title).forEach((g) => bump(stats.tags, g + ' ' + a.installPoint)); });
    if (cfg.wheels && cfg.wheels.length) stats.wheels += cfg.wheels.length;
    const label = (kind, code) => { const it = t.items[kind + ':' + code]; if (it) return it.name; const col = (kind === 'EXTERIOR_COLOR' ? cfg.exteriorColors : kind === 'INTERIOR_COLOR' ? cfg.interiorColors : []).find((x) => x.code === code); return (kind === 'EXTERIOR_COLOR' ? 'paint ' : kind === 'INTERIOR_COLOR' ? 'interior ' : kind.toLowerCase().replace('_', ' ') + ' ') + (col ? clean(col.title) : code); };

    // Rules, part 1: what the service says each item needs before anything is selected.
    // When it offers several ways to make a blocked item fit, what every way has in common is stored as a rule.
    const needs = {};
    await Promise.all(packs.concat(accs).map(async (x) => {
      const kind = packs.includes(x) ? 'PACKAGE' : 'ACCESSORY', k = kind + ':' + x.code; needs[k] = [];
      x.compatibilityWithCurrentConfig.requiredItems.forEach((r) => { t.rules.push(['req', k, r.itemType + ':' + r.itemCode]); needs[k].push({ ...r, changeType: 'ADD' }); });
      if (ok(x)) return;
      stats.calls++;
      const rec = (await ask(Q_NEEDS, { config: cfg, currentSelectedConfig: cur, latestItemSelected: { itemCode: x.code, itemType: kind, changeType: 'ADD', availableWithTrimIds: [] } })).getRecommendation;
      const steps = (rec.resolveSteps || []).filter((s) => !s.applicableTrimId || s.applicableTrimId === t.code).sort((a, b) => a.weight - b.weight);
      if (!steps.length) { note('Not selectable, no reason given: ' + clean(x.title), i); needs[k] = null; return; }
      const sig = (ch) => ch.changeType + ' ' + ch.itemType + ':' + ch.itemCode, stored = (ch) => (ch.changeType === 'ADD' || ch.changeType === 'REMOVE') && t.items[ch.itemType + ':' + ch.itemCode];
      const always = steps[0].requiredChanges.filter((ch) => steps.every((s) => s.requiredChanges.some((o) => sig(o) === sig(ch))));
      always.filter(stored).forEach((ch) => t.rules.push([ch.changeType === 'ADD' ? 'req' : 'x', k, ch.itemType + ':' + ch.itemCode]));
      const rest = steps[0].requiredChanges.filter((ch) => !(always.includes(ch) && stored(ch))).map((ch) => ch.changeType.toLowerCase() + ' ' + label(ch.itemType, ch.itemCode)).join(' + ');
      if (steps.length > 1) note('Rule not stored: ' + clean(x.title) + ' also needs one of ' + steps.length + ' choices, for example: ' + (rest || 'nothing more'), i);
      else if (rest) note('Rule not stored: ' + clean(x.title) + ' needs ' + rest, i);
      needs[k] = needs[k].concat(steps[0].requiredChanges);
    }));

    // Rules, part 2: select each package or factory option (with what it needs) and see what becomes unavailable.
    const flags = (u) => { const m = {}; u.packages.forEach((p) => { m['PACKAGE:' + p.code + ':' + p.id] = ok(p); }); u.accessories.forEach((a) => { m['ACCESSORY:' + a.code + ':' + a.id] = ok(a); }); u.exteriorColors.forEach((x) => { m['EXTERIOR_COLOR:' + x.code + ':' + x.id] = ok(x); }); u.interiorColors.forEach((x) => { m['INTERIOR_COLOR:' + x.code + ':' + x.id] = ok(x); }); return m; };
    const before = flags(cfg);
    const colorName = (kind, code) => { const list = kind === 'EXTERIOR_COLOR' ? cfg.exteriorColors : cfg.interiorColors; const f = list.find((x) => x.code === code); return (kind === 'EXTERIOR_COLOR' ? 'paint ' : 'interior ') + (f ? clean(f.title) : code); };
    await Promise.all(packs.map(async (p) => {
      const k = 'PACKAGE:' + p.code; if (!needs[k]) return;
      const codes = (type, how) => needs[k].filter((r) => r.itemType === type && r.changeType === how).map((r) => r.itemCode);
      if (codes('EXTERIOR_COLOR', 'UPDATE').length || codes('INTERIOR_COLOR', 'UPDATE').length) { note('Clashes not checked (needs a color change first): ' + clean(p.title), i); return; }
      const after = flags(await select({ packageCodes: [p.code].concat(codes('PACKAGE', 'ADD')), accessoryCodes: codes('ACCESSORY', 'ADD') }, [{ itemCode: p.code, itemType: 'PACKAGE', changeType: 'ADD' }]));
      Object.keys(after).forEach((f) => {
        if (!before[f] || after[f]) return; const [kind, code, fid] = f.split(':'); const other = kind + ':' + code;
        if (other === k || needs[k].some((r) => r.itemType + ':' + r.itemCode === other)) return;
        if (kind === 'PACKAGE' || kind === 'ACCESSORY') { if (fid in priceOf && t.items[other]) t.rules.push(['x', k, other]); }
        else if ((kind === 'EXTERIOR_COLOR' ? tr.exteriorColorIds : tr.interiorColorIds).includes(fid)) note('Rule not stored: ' + clean(p.title) + ' not with ' + colorName(kind, code), i);
      });
    }));

    // Rules, part 3: all accessories selected at once. Toyota marks none as clashing; if that ever changes it is counted here.
    if (accs.length) { const u = await select({ accessoryCodes: accs.map((a) => a.code) }, accs.map((a) => ({ itemCode: a.code, itemType: 'ACCESSORY', changeType: 'ADD' }))); const bad = u.accessories.filter((a) => a.id in priceOf && !ok(a) && before['ACCESSORY:' + a.code + ':' + a.id]); stats.allAccessoriesFlagged += bad.length; bad.forEach((a) => note('Accessory marked not compatible when all accessories are selected: ' + label('ACCESSORY', a.code), i)); }

    // Paints: price and the interiors offered with each paint on this trim.
    // The service answers this from the interior's side: select an interior, then read which paints stay available.
    const ints = cfg.interiorColors.filter((x) => tr.interiorColorIds.includes(x.id));
    t.materials = [...new Set(ints.map((x) => clean(x.material)).filter(Boolean))];
    const mine = cfg.exteriorColors.filter((x) => tr.exteriorColorIds.includes(x.id)), offered = {}; mine.forEach((p) => { offered[p.id] = []; });
    await Promise.all(ints.map(async (x) => {
      let u = cfg;
      if (x.code !== cur.interiorColorCode) {
        const change = { interiorColorCode: x.code };
        if (!ok(x)) { // not offered at the start: ask what it needs (another paint, a package) and select that too
          stats.calls++;
          const rec = (await ask(Q_NEEDS, { config: cfg, currentSelectedConfig: cur, latestItemSelected: { itemCode: x.code, itemType: 'INTERIOR_COLOR', changeType: 'UPDATE', availableWithTrimIds: [] } })).getRecommendation;
          const step = (rec.resolveSteps || []).filter((s) => !s.applicableTrimId || s.applicableTrimId === t.code).sort((a, b) => a.weight - b.weight)[0];
          const known = step && step.requiredChanges.every((ch) => (ch.itemType === 'EXTERIOR_COLOR' && ch.changeType === 'UPDATE') || (ch.itemType === 'PACKAGE' && ch.changeType === 'ADD'));
          if (!known) { note('Interior with unknown paint combinations: ' + clean(x.title), i); return; }
          step.requiredChanges.forEach((ch) => { if (ch.itemType === 'PACKAGE') { change.packageCodes = (change.packageCodes || []).concat(ch.itemCode); note('Rule not stored: interior ' + clean(x.title) + ' needs ' + label('PACKAGE', ch.itemCode), i); } else change.exteriorColorCode = ch.itemCode; });
        }
        u = await select(change, [{ itemCode: x.code, itemType: 'INTERIOR_COLOR', changeType: 'UPDATE' }]);
      }
      mine.forEach((p) => { const f = u.exteriorColors.find((y) => y.id === p.id); if (f && ok(f)) offered[p.id].push(x.id); });
    }));
    t.paints = mine.map((p) => {
      const good = ints.filter((x) => offered[p.id].includes(x.id)).map((x) => clean(x.title).replace(/\//g, '-').replace(/,/g, ''));
      if (!good.length) note('Paint with no interior found: ' + clean(p.title), i);
      return { id: p.id, name: clean(p.title), code: p.code, price: +p.msrp.value || 0, interiors: [...new Set(good)].join('/') || 'Yes' };
    });
    const order = cfg.exteriorColors.map((x) => x.id); t.paints.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  };
  for (let i = 0; i < trims.length; i += 3) await Promise.all(trims.slice(i, i + 3).map((t, j) => readTrim(t, i + j))); // three trims at a time, to stay gentle

  // 3. Trim labels: the grade name, plus whatever differs between trims of the same grade (drive, cab and bed, engine, gearbox, seats).
  const short = (v) => ({ 'Front-Wheel Drive': 'FWD', 'All-Wheel Drive': 'AWD', 'Rear-Wheel Drive': 'RWD', '4-Wheel Drive': '4WD', 'Four-Wheel Drive': '4WD' }[v] || clean(v));
  trims.forEach((t) => {
    const same = trims.filter((x) => x.grade === t.grade); t.label = clean(t.grade);
    if (same.length > 1) ['drive', 'cab', 'engine', 'transmission', 'seats'].forEach((a) => { if (new Set(same.map((x) => x.attrs[a])).size > 1 && t.attrs[a]) t.label += ' ' + (a === 'seats' ? t.attrs[a] + '-seat' : short(t.attrs[a])); });
  });
  trims.forEach((t) => { if (trims.filter((x) => x.label === t.label).length > 1) t.label += ' ' + t.code; });

  // 4. Merge items across trims. Same letter, name and price = one line; mask = which trims offer it (bit 0 = first trim).
  const keep = [], byKey = {}; const lineOf = trims.map(() => ({}));
  trims.forEach((t, i) => Object.keys(t.items).forEach((k) => {
    const it = t.items[k], key = [it.letter, it.name, it.price, it.code].join('|');
    if (byKey[key] == null) { byKey[key] = keep.length; keep.push({ ...it, mask: 0n, x: new Set(), req: new Set(), inc: new Set() }); }
    keep[byKey[key]].mask |= 1n << BigInt(i); lineOf[i][k] = byKey[key];
  }));
  trims.forEach((t, i) => t.rules.forEach(([kind, a, b]) => {
    const la = lineOf[i][a], lb = lineOf[i][b];
    if (la == null || lb == null) { note('Rule not stored: ' + (t.items[a] || {}).name + (kind === 'x' ? ' not with ' : ' needs ') + b.toLowerCase().replace(/_/g, ' ').replace(':', ' '), i); return; }
    if (la === lb) return;
    keep[la][kind].add(lb); if (kind === 'x') keep[lb].x.add(la); // a clash counts both ways
  }));

  // 5. Paints, merged the same way (same code, name and price = one line).
  const paints = [], pKey = {};
  trims.forEach((t, i) => t.paints.forEach((p) => { const key = [p.code, p.name, p.price].join('|'); if (pKey[key] == null) { pKey[key] = paints.length; paints.push({ ...p, per: trims.map(() => 0) }); } paints[pKey[key]].per[i] = p.interiors; }));

  // 6. Write the file.
  const list = (s) => [...s].sort((a, b) => a - b).join(',');
  body = body || (cats.includes('cars-minivan') && series !== 'sienna' ? 'sedan' : 'suv'); // only picks the placeholder drawing
  const lines = ['#' + [id, clean(name), year, series, [...dphs].join(','), body].join('|')];
  trims.forEach((t) => lines.push(['T', t.label, t.msrp, t.code, t.materials.join('/')].join(';')));
  paints.forEach((p) => lines.push(['C', p.name, p.code, p.price, p.per.join(',')].join(';')));
  keep.forEach((k) => lines.push([k.letter, k.name, k.price, '', k.mask.toString(), list(k.x), list(k.req), list(k.inc), k.code].join(';')));
  lines.push('R;' + Object.keys(notes).sort().map((m) => m + ' (' + (notes[m].size === trims.length ? 'all trims' : (notes[m].size > 2 ? notes[m].size + ' trims, first: ' : '') + [...notes[m]].sort((a, b) => a - b).slice(0, notes[m].size > 2 ? 1 : 2).map((i) => trims[i].label).join(', ')) + ')').join(' // '));
  stats.body = body; stats.trims = trims.length; stats.paints = paints.length; stats.items = keep.length; stats.notes = Object.keys(notes).length; stats.categories = cats;
  return { text: lines.join('\n'), stats };
};
