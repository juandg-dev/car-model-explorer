// Lexus options collector.
// Where it runs: pasted into the browser on a www.lexus.com/build page. It asks Lexus's own Build data
//   service (api.build.orc.lexus.com) the same questions the page asks.
// What it returns: { text, stats }. `text` is one model in the raw format described in collection/README.md.
//   `stats` is only for NOTES.md; it is not saved.
// It reads facts only (names, prices, availability, rules, paint and interior combinations). No images, no descriptions.
//
// How Lexus differs from Toyota:
//   - Lexus is the same company and the same kind of service, but a different address and a different shape of answer.
//   - The service wants a ZIP code with every question. LEXUS_ZIP below is Lexus's own head office in Plano, Texas.
//     The service answers with its NATIONAL list for that ZIP.
//   - Rules are found the same way as for Toyota: select an item and read what the service marks "not compatible",
//     and ask it what a blocked item needs.
//   - Lexus publishes no install times and no seat-material field, so both stay empty.
//
// Usage in the page:   r = await collectLexus('rx', 2027, 'RX', 'suv')
//                      checksum(r.text)   // compare with the checksum of the saved file (collection/checksum.js)

window.checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };
window.LEXUS_ZIP = '75024';
// Lexus's accessory menu sections -> the category letters of the raw format. Sections not listed here become 'E'.
window.LEXUS_SECTIONS = { Packages: 'P', Wheels: 'W', Lighting: 'L', Interior: 'I', Storage: 'I', Pet: 'I', 'Coolers/Freezers': 'I' };

window.collectLexus = async (id, year, series, body) => {
  const zipCode = window.LEXUS_ZIP;
  const ask = async (path, q) => {
    const res = await fetch('https://api.build.orc.lexus.com/' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ zipCode, ...q }) });
    if (!res.ok) throw new Error('Lexus returned ' + res.status + ' for ' + year + ' ' + series);
    const j = await res.json(); if (j.errors) throw new Error(year + ' ' + series + ': ' + j.errors[0]); return j.data;
  };
  const clean = (t) => (t || '').replace(/<[^>]*>/g, ' ').replace(/\[[a-z0-9_]+\]/gi, ' ').replace(/&[nm]dash;?/gi, '-').replace(/&(reg|trade|copy);?/gi, '').replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').replace(/[™®]/g, '').replace(/;/g, ',').replace(/\s+/g, ' ').replace(/ ([,.)])/g, '$1').trim();

  // 1. The trims, in Lexus's order.
  window.lexusSeries = window.lexusSeries || await ask('series', {});
  const sd = window.lexusSeries.find((s) => s.id === series), ys = sd && sd.yearSpecificData.find((y) => y.year === year);
  if (!ys || !ys.trims.length) throw new Error('No trims for ' + year + ' ' + series);
  const trims = ys.trims.map((t) => ({ code: t.code, label: clean(t.name), listPrice: t.msrp.price }));

  const stats = { sections: {}, dealerInstalled: 0, portInstalled: 0, otherGroups: {}, calls: 1, allAccessoriesFlagged: 0, listPriceMinusFee: 0 };
  const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  const notes = {}; const note = (msg, i) => { (notes[msg] = notes[msg] || new Set()).add(i); };
  let name = sd.name; const dphs = new Set();
  const KINDS = ['packages', 'options', 'wheels', 'accessories'];

  // 2. One trim: what it offers, at what price, and its rules.
  const readTrim = async (t, i) => {
    const cur = { seriesId: series, year, trimCode: t.code };
    const cfg = await ask('configuration', { currentConfig: cur }); stats.calls++;
    const tr = cfg.trim, def = cfg.defaultConfig;
    name = cfg.seriesName || name; dphs.add(+tr.dph.price); t.msrp = +tr.msrp.price;
    if (t.listPrice !== t.msrp + tr.dph.price) stats.listPriceMinusFee++;
    // What is selected at the start, in the words the service expects back.
    const start = { packages: [], options: [], accessories: [] };
    Object.keys(def).forEach((k) => { const v = def[k]; if (!k.includes('Code') && v != null && v !== '' && !(Array.isArray(v) && !v.length)) start[k] = v; });
    const ok = (x) => x.compatibilityWithCurrentConfig.isCompatible && !x.compatibilityWithCurrentConfig.disabled;
    const withItem = (kind, code, more) => { const sel = { ...cur, ...start }; (more || []).concat([[kind, code]]).forEach(([k, c]) => { if (Array.isArray(sel[k])) sel[k] = sel[k].concat(c); else sel[k] = c; }); return sel; };
    const change = (kind, code) => ({ itemCode: code, itemType: kind, changeType: kind === 'wheels' || /Colors$/.test(kind) ? 'UPDATE' : 'ADD' });
    const select = async (kind, code, more) => { stats.calls++; return (await ask('configuration', { currentConfig: withItem(kind, code, more), latestItemsSelected: [change(kind, code)] })).trim; };
    const needsOf = async (kind, code) => { stats.calls++; return ask('validate', { currentConfig: withItem(kind, code), latestItemSelected: change(kind, code), latestItemsSelected: [change(kind, code)], configData: cfg, regionName: cfg.regionName }); };

    ['roofs', 'spoilers', 'seatMaterials', 'scuffPlates', 'exteriorAccentTrims', 'roofTopColors', 'convertibleInteriorColors'].forEach((g) => { if ((tr[g] || []).length) { stats.otherGroups[g] = (stats.otherGroups[g] || 0) + tr[g].length; note('Not collected: ' + tr[g].length + ' ' + g, i); } });
    const wheels = tr.wheels.filter((w) => w.type !== 'STANDARD');
    t.items = {}; t.rules = [];
    const add = (kind, x, letter) => { t.items[kind + ':' + x.code] = { letter, name: clean(x.name), price: x.msrp && x.msrp.price != null ? +x.msrp.price : '', code: x.code }; };
    tr.packages.forEach((p) => add('packages', p, 'P')); tr.options.forEach((p) => add('options', p, 'F')); wheels.forEach((w) => add('wheels', w, 'W'));
    tr.accessories.forEach((a) => { const sec = ((a.categories || [])[0] || {}).name || ''; add('accessories', a, window.LEXUS_SECTIONS[sec] || 'E'); bump(stats.sections, sec); if (a.dealerInstalled) stats.dealerInstalled++; else stats.portInstalled++; });
    const label = (kind, code) => { const it = t.items[kind + ':' + code]; if (it) return it.name; const col = (tr[kind] || []).find((x) => x.code === code); return (kind === 'exteriorColors' ? 'paint ' : kind === 'interiorColors' ? 'interior ' : kind + ' ') + (col ? clean(col.name) : code); };
    const choosable = tr.packages.map((p) => ['packages', p]).concat(tr.options.map((p) => ['options', p]), wheels.map((w) => ['wheels', w]));

    // Rules, part 1: what the service says a blocked item needs.
    const needs = {};
    await Promise.all(choosable.map(async ([kind, x]) => {
      const k = kind + ':' + x.code; needs[k] = []; if (ok(x)) return;
      const rec = await needsOf(kind, x.code);
      (rec.commonChanges || []).forEach((ch) => (ch.itemCodes || []).forEach((code) => {
        const other = ch.itemType + ':' + code;
        if (ch.changeType === 'ADD' && t.items[other]) { t.rules.push(['req', k, other]); needs[k].push([ch.itemType, code]); }
        else if (ch.changeType === 'REMOVE' && t.items[other]) t.rules.push(['x', k, other]);
        else note('Rule not stored: ' + clean(x.name) + ' needs ' + ch.changeType.toLowerCase() + ' ' + label(ch.itemType, code), i);
      }));
      if ((rec.ors || []).length) note('Rule not stored: ' + clean(x.name) + ' also needs one of ' + rec.ors.length + ' choices', i);
      if (!(rec.commonChanges || []).length && !(rec.ors || []).length) note('Not selectable, no reason given: ' + clean(x.name), i);
    }));

    // Rules, part 2: select each package, option or wheel (with what it needs) and see what becomes unavailable.
    const flags = (u) => { const m = {}; KINDS.concat(['exteriorColors', 'interiorColors']).forEach((kind) => (u[kind] || []).forEach((x) => { m[kind + ':' + x.code] = ok(x); })); return m; };
    const before = flags(tr);
    await Promise.all(choosable.map(async ([kind, x]) => {
      const k = kind + ':' + x.code, after = flags(await select(kind, x.code, needs[k]));
      Object.keys(after).forEach((f) => {
        if (!before[f] || after[f] || f === k || needs[k].some(([a, b]) => a + ':' + b === f)) return; const [fk, code] = f.split(':');
        if (t.items[f]) t.rules.push(['x', k, f]); else if (/Colors$/.test(fk)) note('Rule not stored: ' + clean(x.name) + ' not with ' + label(fk, code), i);
      });
    }));

    // Rules, part 3: all accessories selected at once. Counted if the service marks any as clashing.
    if (tr.accessories.length) { stats.calls++; const u = (await ask('configuration', { currentConfig: { ...cur, ...start, accessories: tr.accessories.map((a) => a.code) }, latestItemsSelected: tr.accessories.map((a) => change('accessories', a.code)) })).trim; const bad = u.accessories.filter((a) => !ok(a) && before['accessories:' + a.code]); stats.allAccessoriesFlagged += bad.length; bad.forEach((a) => note('Accessory marked not compatible when all accessories are selected: ' + clean(a.name), i)); }

    // Paints: price and the interiors offered with each paint on this trim (read from the interior's side, as for Toyota).
    const offered = {}; tr.exteriorColors.forEach((p) => { offered[p.code] = []; });
    await Promise.all(tr.interiorColors.map(async (x) => {
      let u = tr;
      if (x.code !== start.interiorColors) {
        const more = [];
        if (!ok(x)) { // not offered at the start: ask what it needs (another paint, a package) and select that too
          const rec = await needsOf('interiorColors', x.code);
          const known = (rec.commonChanges || []).length && !(rec.ors || []).length && rec.commonChanges.every((ch) => (ch.itemType === 'exteriorColors' && ch.changeType === 'UPDATE') || (['packages', 'options'].includes(ch.itemType) && ch.changeType === 'ADD'));
          if (!known) { note('Interior with unknown paint combinations: ' + clean(x.name), i); return; }
          rec.commonChanges.forEach((ch) => ch.itemCodes.forEach((code) => { more.push([ch.itemType, code]); if (ch.itemType !== 'exteriorColors') note('Rule not stored: interior ' + clean(x.name) + ' needs ' + label(ch.itemType, code), i); }));
        }
        u = await select('interiorColors', x.code, more);
      }
      tr.exteriorColors.forEach((p) => { const f = u.exteriorColors.find((y) => y.code === p.code); if (f && ok(f)) offered[p.code].push(x.code); });
    }));
    t.paints = tr.exteriorColors.map((p) => {
      const good = tr.interiorColors.filter((x) => offered[p.code].includes(x.code)).map((x) => clean(x.name).replace(/\//g, '-').replace(/,/g, ''));
      if (!good.length) note('Paint with no interior found: ' + clean(p.name), i);
      return { name: clean(p.name), code: p.code, price: +(p.msrp || {}).price || 0, interiors: [...new Set(good)].join('/') || 'Yes' };
    });
  };
  for (let i = 0; i < trims.length; i += 2) await Promise.all(trims.slice(i, i + 2).map((t, j) => readTrim(t, i + j))); // two trims at a time, to stay gentle

  // 3. Merge items across trims. Same letter, name, price and code = one line; mask = which trims offer it (bit 0 = first trim).
  const keep = [], byKey = {}; const lineOf = trims.map(() => ({}));
  trims.forEach((t, i) => Object.keys(t.items).forEach((k) => {
    const it = t.items[k], key = [it.letter, it.name, it.price, it.code].join('|');
    if (byKey[key] == null) { byKey[key] = keep.length; keep.push({ ...it, mask: 0n, x: new Set(), req: new Set(), inc: new Set() }); }
    keep[byKey[key]].mask |= 1n << BigInt(i); lineOf[i][k] = byKey[key];
  }));
  trims.forEach((t, i) => t.rules.forEach(([kind, a, b]) => { const la = lineOf[i][a], lb = lineOf[i][b]; if (la == null || lb == null || la === lb) return; keep[la][kind].add(lb); if (kind === 'x') keep[lb].x.add(la); })); // a clash counts both ways

  // 4. Paints, merged the same way.
  const paints = [], pKey = {};
  trims.forEach((t, i) => t.paints.forEach((p) => { const key = [p.code, p.name, p.price].join('|'); if (pKey[key] == null) { pKey[key] = paints.length; paints.push({ ...p, per: trims.map(() => 0) }); } paints[pKey[key]].per[i] = p.interiors; }));

  // 5. Write the file.
  const list = (s) => [...s].sort((a, b) => a - b).join(',');
  const lines = ['#' + [id, clean(name), year, series, [...dphs].join(','), body].join('|')];
  trims.forEach((t) => lines.push(['T', t.label, t.msrp, t.code, ''].join(';')));
  paints.forEach((p) => lines.push(['C', p.name, p.code, p.price, p.per.join(',')].join(';')));
  keep.forEach((k) => lines.push([k.letter, k.name, k.price, '', k.mask.toString(), list(k.x), list(k.req), list(k.inc), k.code].join(';')));
  lines.push('R;' + Object.keys(notes).sort().map((m) => m + ' (' + (notes[m].size === trims.length ? 'all trims' : (notes[m].size > 2 ? notes[m].size + ' trims, first: ' : '') + [...notes[m]].sort((a, b) => a - b).slice(0, notes[m].size > 2 ? 1 : 2).map((i) => trims[i].label).join(', ')) + ')').join(' // '));
  stats.trims = trims.length; stats.paints = paints.length; stats.items = keep.length; stats.notes = Object.keys(notes).length;
  return { text: lines.join('\n'), stats };
};
