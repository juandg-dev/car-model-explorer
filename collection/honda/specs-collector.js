// Honda spec-table collector.
// Where it runs: pasted into the browser on any automobiles.honda.com page.
// What it does: reads each model's "Features & Specs" comparison table (facts only: row labels and per-trim values)
// and saves all of them as ONE text file in the Downloads folder. The file is then read from Downloads,
// checked against the checksum printed here, and split into collection/honda/specs/<model>.txt.
//
// File format: a block per model, separated by a blank line.
//   ## <model page name> | <page title> | <source URL>
//   <trim>|<trim>|...                       (the table's column headings)
//   Starting at $… BUILD|…                  (price row)
//   <Section name>                          (a line with no "|" starts a section)
//   <row label>|<value for trim 1>|<value for trim 2>|…     ("Std" = standard, "-" = not offered)

const MODELS = ['civic-sedan', 'civic-hatchback', 'civic-si-sedan', 'civic-type-r', 'accord-sedan', 'prelude', 'hr-v', 'cr-v', 'passport', 'pilot', 'odyssey', 'ridgeline', 'prologue'];

const parseTables = (doc) => {
  const tx = (e) => e.textContent.replace(/\s+/g, ' ').replace(/\*/g, '').trim();
  const out = [];
  doc.querySelectorAll('table').forEach((table, ti) => {
    if (ti === 0) return; // the first table is only the trim chooser
    table.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children].map((c) => { const t = tx(c); if (t) return t; const h = c.innerHTML; return /check|icon-yes|standard/i.test(h) ? 'Std' : /dash|not-available|icon-no/i.test(h) ? '-' : ''; });
      const line = cells.join('|');
      if (line && !/Select trims to compare/.test(line)) out.push(line);
    });
  });
  return out;
};

window.collectHondaSpecs = async (fileName) => {
  const parts = [];
  for (const m of MODELS) {
    const url = 'https://automobiles.honda.com/' + m + '/specs-features-trim-comparison';
    const html = await (await fetch('/' + m + '/specs-features-trim-comparison')).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = ((doc.querySelector('h1') || {}).textContent || doc.title || '').replace(/\s+/g, ' ').trim();
    parts.push('## ' + m + ' | ' + title + ' | ' + url + '\n' + parseTables(doc).join('\n'));
  }
  const text = parts.join('\n\n') + '\n';
  let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
  return { characters: text.length, checksum: h };
};
// Usage:  await collectHondaSpecs('honda-specs-2026-11-14.txt')
