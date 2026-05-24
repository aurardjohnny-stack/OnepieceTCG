/**
 * patch-pages.mjs
 * Ajoute à chaque page /carte/*/index.html :
 *  1. Zoom plein écran sur la carte (clic)
 *  2. Prix live via /api/prices
 *  3. Offers dans le schema JSON-LD
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARTE_DIR  = path.join(__dirname, 'carte');

const ZOOM_CSS = `
/* ZOOM OVERLAY */
.zoom-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out}
.zoom-overlay.open{display:flex}
.zoom-overlay img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:14px;border:1px solid rgba(212,160,23,.35)}
.card-frame{cursor:zoom-in;position:relative}
.zoom-hint{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#f0c040;font-size:10px;padding:3px 10px;border-radius:10px;pointer-events:none;white-space:nowrap}
.price-loading{opacity:.5;font-size:.9rem}
.price-live{color:#f0c040}
`;

const ZOOM_HTML = `
<div class="zoom-overlay" id="zoom-overlay" onclick="this.classList.remove('open')">
  <img id="zoom-img" src="" alt="Zoom carte">
</div>
`;

const SCRIPT = `
<script>
(function(){
  // ZOOM
  var frame=document.querySelector('.card-frame');
  var overlay=document.getElementById('zoom-overlay');
  var zoomImg=document.getElementById('zoom-img');
  if(frame&&overlay){
    var hint=document.createElement('div');
    hint.className='zoom-hint';
    hint.textContent='🔍 Cliquer pour zoomer';
    frame.appendChild(hint);
    frame.addEventListener('click',function(){
      zoomImg.src=document.getElementById('main-img').src;
      overlay.classList.add('open');
    });
    document.addEventListener('keydown',function(e){
      if(e.key==='Escape')overlay.classList.remove('open');
    });
  }
  // PRIX LIVE
  var priceEl=document.querySelector('.price-val');
  var noteEl=document.querySelector('.price-note');
  if(!priceEl)return;
  var ldScript=document.querySelector('script[type="application/ld+json"]');
  var cardCode='';
  try{
    var data=JSON.parse(ldScript.textContent);
    cardCode=data.sku||'';
    if(!cardCode)(data.additionalProperty||[]).forEach(function(p){if(p.name==='Code')cardCode=p.value;});
  }catch(e){}
  if(!cardCode)return;
  priceEl.textContent='…';
  priceEl.className='price-val price-loading';
  fetch('/api/prices?name='+encodeURIComponent(cardCode))
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.success&&d.price){
        priceEl.textContent=d.price.toFixed(2).replace('.',',')+' €';
        priceEl.className='price-val price-live';
        if(noteEl)noteEl.textContent='Prix Cardmarket (indicatif)';
      }else{
        priceEl.textContent='Voir prix';
        priceEl.className='price-val';
      }
    })
    .catch(function(){priceEl.textContent='Voir prix';priceEl.className='price-val';});
})();
</script>
`;

async function patchFile(filePath) {
  let html = await fs.readFile(filePath, 'utf8');
  if(html.includes('zoom-overlay')) return 'already_done';

  html = html.replace(
    /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
    function(match, open, json, close) {
      try {
        const schema = JSON.parse(json);
        if(schema['@type']==='Product' && !schema.offers){
          schema.offers={'@type':'Offer','url':schema.url||'','availability':'https://schema.org/InStock','priceCurrency':'EUR'};
          return open+JSON.stringify(schema)+close;
        }
      } catch(e){}
      return match;
    }
  );

  html = html.replace('</style>', ZOOM_CSS + '</style>');
  html = html.replace('</body>', ZOOM_HTML + SCRIPT + '</body>');
  await fs.writeFile(filePath, html, 'utf8');
  return 'patched';
}

async function main() {
  console.log('Scan de /carte/ ...');
  const entries = await fs.readdir(CARTE_DIR, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);
  console.log(folders.length + ' dossiers trouves\n');

  let patched=0, skipped=0, errors=0;

  for(const folder of folders){
    const filePath = path.join(CARTE_DIR, folder, 'index.html');
    try {
      await fs.access(filePath);
      const result = await patchFile(filePath);
      if(result==='patched'){
        patched++;
        if(patched%500===0) console.log('  ' + patched + ' pages mises a jour...');
      } else { skipped++; }
    } catch(e) { errors++; }
  }

  console.log('\nTermine !');
  console.log('   Patchees : ' + patched);
  console.log('   Deja ok  : ' + skipped);
  console.log('   Erreurs  : ' + errors);
}

main().catch(err=>{ console.error(err); process.exit(1); });
