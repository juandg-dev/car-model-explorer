// Prints the checksum of one or more raw files, to compare with checksum(text) in the browser.
// Usage: node collection/checksum.js collection/honda/raw/prelude.txt
const fs = require('fs');
const checksum = (text) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 1000000007; return h; };
process.argv.slice(2).forEach((file) => console.log(checksum(fs.readFileSync(file, 'utf8').trim()), file));
