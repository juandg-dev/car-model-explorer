// Acura spec-table collector.
// Where it runs: pasted into the browser on any www.acura.com page.
// What it does: reads each model's "Specs & Pricing" comparison tables (facts only: row labels and per-trim values)
// and saves all of them as ONE text file in the Downloads folder. The file is then read from Downloads,
// checked against the checksum printed here, and split into collection/acura/specs/<model>.txt.
//
// File format (the same as Honda's, so review.py can read it): a block per model, separated by a blank line.
//   ## <model> | <page title> | <source URL>
//   <trim>|<trim>|...                       (the table's column headings; Acura calls them packages)
//   $…|$…|…                                 (the first starting-price row)
//   <Section name>                          (a line with no "|" starts a section: Pricing, Powertrain, Chassis, ...)
//   <row label>|<value for trim 1>|<value for trim 2>|…     ("Std" = Acura's "Yes", "-" = empty cell, not offered)
//
// How Acura's page differs from Honda's:
//  - Acura writes "Yes" where Honda shows a check mark. It is saved as "Std" so both brands read the same way.
//  - Some rows are grouped under a heading row (for example "Headroom" with "Front" and "Rear" under it).
//    They are saved as "Headroom: Front". A group with one unnamed row (Engine Type) is saved under the group's name.
//  - Models sold with two drives have one price row per drive. All price rows are kept in the "Pricing" section.

const MODELS = [['integra', '/cars/integra/pricing-and-specs'], ['adx', '/suvs/adx/pricing-and-specs'], ['rdx', '/suvs/rdx/pricing-and-specs'], ['mdx', '/suvs/mdx/pricing-and-specs']];

const parseSpecs = (doc) => {
  const tx = (e) => { const c = e.cloneNode(true); c.querySelectorAll('sup').forEach((s) => s.remove()); return c.textContent.replace(/&reg;?|[®™]/g, '').replace(/\|/g, '/').replace(/\s+/g, ' ').replace(/ :$/, '').trim(); };
  const tables = [...doc.querySelectorAll('table')];
  const trims = [...tables[0].querySelectorAll('th.package_column')].map(tx);
  const out = [trims.join('|')];
  // The section title is the first heading found before the table.
  const title = (t) => { let e = t; for (let k = 0; k < 8 && e; k++) { let s = e.previousElementSibling; while (s) { const h = s.matches('h2,h3,h4') ? s : s.querySelector('h2,h3,h4'); if (h && tx(h)) return tx(h); s = s.previousElementSibling; } e = e.parentElement; } return ''; };
  tables.slice(1).forEach((table, ti) => {
    const lines = []; let group = '';
    table.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children]; const first = cells[0];
      // A label cell can hold two parts (drive + "Starting Price:"); join them with a space.
      // Footnote marks leave stray colons behind ("Recommended Fuel :"); tidy them.
      const label = ([...first.children].map(tx).filter(Boolean).join(' ') || tx(first)).replace(/\s+:/g, ':').replace(/:+/g, ':').replace(/:$/, '').trim();
      const vals = cells.slice(1).map((c) => { const t = tx(c); return t === 'Yes' ? 'Std' : t || '-'; });
      const filler = cells.slice(1).every((c) => c.classList.contains('filler_cell'));
      if (filler) { group = label; return; }
      if (!tr.classList.contains('in_subgroup') && !tr.classList.contains('subgroup_last')) group = '';
      const name = (group ? (label ? group + ': ' + label : group) : label).replace(/:+/g, ':');
      if (name.length > 120 && vals.every((v) => v === '-')) return; // a legal note, not a spec row
      lines.push(name + '|' + vals.join('|'));
      if (tr.classList.contains('subgroup_last')) group = '';
    });
    if (ti === 0) out.push(lines[0].split('|').slice(1).join('|')); // the price line
    out.push(title(table) || 'Section ' + (ti + 1));
    lines.forEach((l) => out.push(l));
  });
  return out;
};

window.collectAcuraSpecs = async (fileName) => {
  const parts = [];
  for (const [m, path] of MODELS) {
    const html = await (await fetch(path)).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = (doc.title || '').replace(/\s*\|\s*/g, ' - ').replace(/\s+/g, ' ').trim();
    parts.push('## ' + m + ' | ' + title + ' | https://www.acura.com' + path + '\n' + parseSpecs(doc).join('\n'));
  }
  const text = parts.join('\n\n') + '\n';
  let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007;
  window.acuraSpecsText = text;
  if (fileName) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); }
  return { characters: text.length, checksum: h };
};
// Usage:  await collectAcuraSpecs('acura-specs-2026-11-14.txt')
