// Honda options collector.
// Where it runs: pasted into the browser on any automobiles.honda.com page (it calls Honda's own Build & Price data).
// What it returns: one text block per model in the raw format described in collection/README.md.
// It reads facts only (names, prices, install times, rules, paint and interior availability). No images, no marketing text.
//
// Usage in the page:   await collectHonda('prelude', 'Prelude', 2027, 'prelude', 'sedan')
//                      checksum(text)   // compare with the checksum of the saved file (collection/checksum.js)

window.checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };

window.collectHonda = async (id, name, year, series, body) => {
  const res = await fetch('/platform/api/v1/vehicles/details/' + year + '/' + series);
  if (!res.ok) throw new Error('Honda returned ' + res.status + ' for ' + year + ' ' + series);
  const d = await res.json();
  if (!d.TrimGroups || !d.TrimGroups.length) throw new Error('No trims for ' + year + ' ' + series + ': ' + JSON.stringify(d.ErrorMessage));
  const dec = (t) => { try { return decodeURIComponent(t || '').replace(/\s+/g, ' ').trim(); } catch (e) { return t || ''; } };
  const clean = (t) => t.replace(/[™®]/g, '').replace(/\s+/g, ' ').trim();
  const models = []; d.TrimGroups.forEach((g) => g.Models.forEach((m) => models.push([g.Name, m])));

  // 1. Which menu section each option code belongs to, and the name Honda shows shoppers.
  const SECTION = { 'Accessory Packages': 'P', Wheels: 'W', Exterior: 'E', Interior: 'I', Electronic: 'L' };
  const catOf = {}, menuName = {}, groups = [];
  const walk = (n, cat) => {
    (n.NavigationItems || []).forEach((it) => {
      const put = (c, label) => { catOf[c] = cat; menuName[c] = (label || '').replace(/\s+/g, ' ').trim(); };
      (it.OpCode || []).forEach((c) => put(c, it.Name));
      if ((it.OpCode || []).length > 1) groups.push({ name: (it.Name || '').replace(/\s+/g, ' ').trim(), codes: it.OpCode.slice() });
      (it.Duplicates || []).forEach((x) => (x.OpCode || []).forEach((c) => put(c, it.Name)));
      (it.SubItems || []).forEach((x) => (x.OpCode || []).forEach((c) => put(c, x.Name || it.Name)));
    });
    (n.NavigationSections || []).forEach((s) => walk(s, cat));
  };
  d.Navigation.forEach((n) => walk(n, SECTION[n.Name] || 'Factory:' + n.Name));

  // 2. Every option on every trim, merged by code. mask = which trims offer it (bit 0 = first trim).
  const opts = {}, order = [];
  models.forEach(([g, m], i) => m.ModelOptionList.forEach((o) => {
    if (!opts[o.OpCode]) {
      opts[o.OpCode] = { cat: catOf[o.OpCode] || 'Other', raw: dec(o.OptionName), menu: menuName[o.OpCode] || '', price: +o.OptionPrice, hrs: o.OptionLaborTime === '' || o.OptionLaborTime == null ? null : +o.OptionLaborTime, mask: 0, x: new Set(), req: new Set(), inc: new Set(), ppo: !!o.IsPPO };
      order.push(o.OpCode);
    }
    const r = opts[o.OpCode]; r.mask |= 1 << i;
    (o.ExcludeList || []).forEach((c) => r.x.add(c)); (o.RequiredList || []).forEach((c) => r.req.add(c)); (o.IncludeList || []).forEach((c) => r.inc.add(c));
  }));

  // 2b. A menu entry made of several parts (wheels with tires, a hitch with its harness) becomes ONE item:
  //     part prices and install times are added up, and it is offered only on trims that have every part.
  //     The parts are listed on the R line as "Sold together as ...".
  const sold = [];
  groups.forEach((g) => {
    const parts = g.codes.filter((c) => opts[c]); if (parts.length < 2) return;
    const all = parts.map((c) => opts[c]); const mask = all.reduce((s, o) => s & o.mask, -1); if (!mask) return;
    const sum = (f) => Math.round(all.reduce((s, o) => s + (f(o) || 0), 0) * 100) / 100;
    const m = { cat: catOf[parts[0]] || 'Other', raw: all[0].raw, menu: g.name, price: sum((o) => o.price), hrs: all.some((o) => o.hrs != null) ? sum((o) => o.hrs) : null, mask, x: new Set(), req: new Set(), inc: new Set(), ppo: all.every((o) => o.ppo), group: true };
    all.forEach((o) => { o.x.forEach((c) => m.x.add(c)); o.req.forEach((c) => m.req.add(c)); o.inc.forEach((c) => m.inc.add(c)); });
    parts.forEach((c) => { m.x.delete(c); m.req.delete(c); m.inc.delete(c); });
    sold.push('Sold together as ' + g.name + ': ' + all.map((o) => o.raw + ' $' + o.price).join(' + '));
    opts[parts[0]] = m; parts.slice(1).forEach((c) => { opts[c].part = true; });
  });

  // 3. Keep what is in Honda's configurator menu; merge rows that differ only by code; list the rest as "left out".
  const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  const keep = [], left = [], map = {}, byKey = {};
  order.forEach((code, i) => {
    const o = opts[code]; const shown = o.menu || o.raw;
    const letter = o.cat.length === 1 ? o.cat : o.cat.startsWith('Factory') ? 'F' : null;
    if (o.part) return; // counted inside a "sold together" item
    const mismatch = !o.group && o.menu && o.menu !== o.raw && !words(o.raw).some((w) => words(o.menu).includes(w));
    if (!letter || (o.ppo && letter !== 'F') || mismatch) { left.push((o.cat === 'Other' ? '' : o.cat.replace(/^[PWEIL]$/, (c) => ({ P: 'Package', W: 'Wheels', E: 'Exterior', I: 'Interior', L: 'Electronic' }[c])) + ':') + o.raw + (mismatch ? ' [menu: ' + o.menu + ']' : '') + ' $' + o.price + (o.ppo ? ' ppo' : '')); return; }
    const key = [letter, shown, o.price, o.hrs].join('|');
    if (byKey[key] == null) { byKey[key] = keep.length; keep.push({ letter, name: shown, price: o.price, hrs: o.hrs, mask: 0, x: [], req: [], inc: [], code: code.replace(/^[A-Z-]+/, '') }); }
    const k = keep[byKey[key]]; k.mask |= o.mask; map[i] = byKey[key];
    k.x.push(...[...o.x].map((c) => order.indexOf(c))); k.req.push(...[...o.req].map((c) => order.indexOf(c))); k.inc.push(...[...o.inc].map((c) => order.indexOf(c)));
  });
  const refs = (list, self) => [...new Set(list.map((i) => map[i]).filter((i) => i != null && i !== self))].join(',');

  // 4. Paints: price and, per trim, the interior colors offered with that paint (0 = paint not offered on that trim).
  const paints = {}, porder = [];
  models.forEach(([g, m], i) => (m.ExteriorColors || []).forEach((c) => {
    const k = c.ColorMfgCode || c.ColorCode;
    if (!paints[k]) { paints[k] = { name: dec(c.ColorName), price: 0, per: models.map(() => 0) }; porder.push(k); }
    const combo = (m.ColorComboList || {})[k] || (m.ColorComboList || {})[c.ColorCode] || {};
    paints[k].price = Math.max(paints[k].price, +(combo.PriceDelta || 0) || 0);
    const lookup = (code) => { const f = (m.InteriorColors || []).find((x) => x.ColorCode === code || x.ColorMfgCode === code || x.ColorIdent === code); return f ? dec(f.ColorName) : code; };
    const ic = combo.InteriorColors; let names = [];
    if (Array.isArray(ic)) names = ic.map((x) => (typeof x === 'string' ? lookup(x) : dec(x.ColorName) || lookup(x.ColorCode)));
    else if (ic && typeof ic === 'object') names = Object.keys(ic).map(lookup);
    paints[k].per[i] = [...new Set(names)].join('/') || 'Yes';
  }));

  // 5. Trims. When two trims share a name (2WD and AWD versions), add the drivetrain to the label.
  const count = {}; models.forEach(([g]) => { count[g] = (count[g] || 0) + 1; });
  const lines = ['#' + [id, name, year, series, [...new Set(models.map(([g, m]) => +m.DestinationHandling))].join(','), body].join('|')];
  models.forEach(([g, m]) => { const full = dec(m.ModelName); let label = g; if (count[g] > 1) label += /AWD|4WD/.test(full) ? ' AWD' : /2WD|FWD/.test(full) ? ' 2WD' : ' ' + full; lines.push(['T', label, +m.MSRP, m.ModelId, /leather/.test(m.FabricType || '') ? 'leather' : m.FabricType || 'cloth'].join(';')); });
  porder.forEach((k) => lines.push(clean(['C', paints[k].name, k, paints[k].price, paints[k].per.join(',')].join(';'))));
  keep.forEach((k, i) => lines.push([k.letter, clean(k.name), k.price, k.hrs == null ? '' : k.hrs, k.mask, refs(k.x, i), refs(k.req, i), refs(k.inc, i), k.code].join(';')));
  lines.push(clean('R;' + left.concat(sold).join(' // ')));
  return lines.join('\n');
};
