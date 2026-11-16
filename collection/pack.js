// Shorthand for carrying raw files from the browser to the repo.
// Why: Claude copies every collected file by hand (no downloads). Big brands repeat the same names thousands of
// times, so the browser first writes the files in a shorthand. This script expands the shorthand again,
// writes one raw file per model and prints each checksum. The checksum is always taken on the finished file,
// so it still proves that the saved file equals what the collector produced.
//
// The shorthand:
//   ~3        a repeated piece of text (a field, or one trim's entry on a paint line), listed at the top
//   ^1f;...   a repeated item (letter, name, price, install time and code), listed in the second block;
//             what follows is its trim mask and its three rule lists. "*" as the mask means "every trim".
//   x*4       on a paint line: the same entry four trims in a row
//
// In the browser:   packForCopy([text1, text2, ...])      -> one shorthand text
// Here:             node collection/pack.js <shorthand file> <brand>/raw
//                   (prints "<checksum> <file>" for every model, same numbers as collection/checksum.js)

const packForCopy = (texts) => {
  const lines = texts.join('\n').split('\n');
  const isItem = (l) => 'PWEILF'.includes(l[0]) && l[1] === ';' && l.split(';').length === 9;
  const itemKey = (f) => f.slice(0, 4).concat(f[8]).join(';');
  const atoms = (l) => l.split(';').map((f, i) => (l[0] === 'C' && i === 4 ? f.split(',') : [f]));
  const keyCount = {}; lines.forEach((l) => { if (isItem(l)) { const k = itemKey(l.split(';')); keyCount[k] = (keyCount[k] || 0) + 1; } });
  const keys = Object.keys(keyCount).filter((k) => keyCount[k] > 1), keyMark = {}; keys.forEach((k, i) => { keyMark[k] = '^' + i.toString(36); });
  const plain = (l) => !(isItem(l) && keyMark[itemKey(l.split(';'))]);
  const count = {};
  lines.filter(plain).forEach((l) => atoms(l).forEach((fs) => fs.forEach((a) => { if ('~^'.includes(a[0]) || (l[0] === 'C' && /\*\d+$/.test(a))) throw new Error('A field looks like shorthand: ' + a); count[a] = (count[a] || 0) + 1; })));
  const dict = Object.keys(count).filter((a) => (count[a] - 1) * (a.length - 3) > 8).sort((a, b) => count[b] * b.length - count[a] * a.length);
  const mark = {}; dict.forEach((a, i) => { mark[a] = '~' + i.toString(36); });
  const runs = (list) => { const out = []; for (let i = 0; i < list.length;) { let j = i; while (j < list.length && list[j] === list[i]) j++; if (j - i > 2) out.push(list[i] + '*' + (j - i)); else for (let k = i; k < j; k++) out.push(list[i]); i = j; } return out; };
  let full = '';
  const body = lines.map((l, n) => {
    if (l[0] === '#') { let t = 0; while (lines[n + 1 + t] && lines[n + 1 + t].startsWith('T;')) t++; full = ((1n << BigInt(t)) - 1n).toString(); }
    if (plain(l)) return atoms(l).map((fs, i) => (l[0] === 'C' && i === 4 ? runs(fs.map((a) => mark[a] || a)) : fs.map((a) => mark[a] || a)).join(',')).join(';');
    const f = l.split(';');
    return [keyMark[itemKey(f)], f[4] === full ? '*' : f[4], f[5], f[6], f[7]].join(';').replace(/;+$/, '');
  });
  return dict.concat(['~~~'], keys, ['^^^'], body).join('\n');
};

const unpack = (packed) => {
  const all = packed.replace(/\n+$/, '').split('\n');
  const c1 = all.indexOf('~~~'), c2 = all.indexOf('^^^'), dict = all.slice(0, c1), keys = all.slice(c1 + 1, c2), body = all.slice(c2 + 1);
  const back = (a) => (a[0] === '~' ? dict[parseInt(a.slice(1), 36)] : a);
  const unrun = (list) => { const out = []; list.forEach((e) => { const m = /^(.*)\*(\d+)$/.exec(e); if (m) for (let i = 0; i < +m[2]; i++) out.push(m[1]); else out.push(e); }); return out; };
  let full = '';
  return body.map((l, n) => {
    if (l[0] === '^') {
      const f = l.split(';'), k = keys[parseInt(f[0].slice(1), 36)].split(';');
      return k.slice(0, 4).concat(f[1] === '*' ? full : f[1], f[2] || '', f[3] || '', f[4] || '', k[4]).join(';');
    }
    const out = l.split(';').map((f, i) => (l[0] === 'C' && i === 4 ? unrun(f.split(',')).map(back).join(',') : back(f))).join(';');
    if (out[0] === '#') { let t = 0; while (body[n + 1 + t] && /^(T|~[0-9a-z]+);/.test(body[n + 1 + t]) && back(body[n + 1 + t].split(';')[0]) === 'T') t++; full = ((1n << BigInt(t)) - 1n).toString(); }
    return out;
  });
};

if (typeof window !== 'undefined') window.packForCopy = packForCopy;
else if (require.main === module) {
  const fs = require('fs'), path = require('path');
  const checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };
  const [, , file, outDir] = process.argv;
  let cur = null; const files = [];
  unpack(fs.readFileSync(file, 'utf8')).forEach((l) => { if (l[0] === '#') { cur = { id: l.slice(1).split('|')[0], lines: [] }; files.push(cur); } cur.lines.push(l); });
  fs.mkdirSync(outDir, { recursive: true });
  files.forEach((f) => { const text = f.lines.join('\n'), p = path.join(outDir, f.id + '.txt'); fs.writeFileSync(p, text + '\n'); console.log(checksum(text), p); });
}
if (typeof module !== 'undefined') module.exports = { packForCopy, unpack };
