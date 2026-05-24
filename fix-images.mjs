import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARTE_DIR = path.join(__dirname, 'carte');

async function fixFile(fp) {
  let html = await fs.readFile(fp, 'utf8');
  html = html.replace(/\/api\/img\?url=([^"'\s>]+)/g, function(match, encoded) {
    try {
      const original = decodeURIComponent(encoded);
      if(original.includes('onepiece-cardgame.com')) {
        const clean = original.replace('https://','').replace('http://','');
        return 'https://images.weserv.nl/?url=' + clean + '&maxage=7d';
      }
    } catch(e){}
    return match;
  });
  await fs.writeFile(fp, html, 'utf8');
}

async function main() {
  const entries = await fs.readdir(CARTE_DIR, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);
  console.log(folders.length + ' pages trouvees');
  let done = 0;
  for(const folder of folders) {
    const fp = path.join(CARTE_DIR, folder, 'index.html');
    try { await fs.access(fp); await fixFile(fp); done++; } catch(e){}
    if(done % 500 === 0 && done > 0) console.log(done + ' pages...');
  }
  console.log('Termine : ' + done + ' pages');
}

main().catch(err => { console.error(err); process.exit(1); });
