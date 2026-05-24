/**
 * patch-pages.mjs
 * Ajoute à chaque page /carte/*.html :
 *  1. Zoom plein écran sur la carte (clic)
 *  2. Prix live via /api/prices
 *  3. Offers dans le schema JSON-LD
 *
 * Usage : node patch-pages.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARTE_DIR  = path.join(__dirname, 'carte');

// ─── Le code à injecter dans chaque page ─────────────────────────

// 1. CSS zoom overlay — inséré juste avant </style>
const ZOOM_CSS = `
/* ZOOM OVERLAY */
.zoom-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:9999;align-items:center;justify-content:center;cursor:zoom-out}
.zoom-overlay.open{display:flex}
.zoom-overlay img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:14px;border:1px solid rgba(212,160,23,.35);box-shadow:0 0 60px rgba(0,0,0,.8)}
.card-frame{cursor:zoom-in}
.zoom-hint{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#f0c040;font-size:10px;padding:3px 10px;border-radius:10px;pointer-events:none;letter-spacing:.05em}
/* PRIX LIVE */
.price-loading{opacity:.5;font-size:.9rem}
.price-live{color:#f0c040}
.price-error{font-size:.85rem;color:var(--muted)}
`;

// 2. HTML zoom overlay + prix — inséré juste avant </body>
const ZOOM_HTML = `
<div class="zoom-overlay" id="zoom-overlay" onclick="this.classList.remove('open')">
  <img id="zoom-img" src="" alt="Zoom carte">
</div>
`;

// 3. Script zoom + prix — inséré juste avant </body>
const SCRIPT = `
<script>
// ── Zoom ──────────────────────────────────────────────────────────
(function(){
  var frame = document.querySelector('.card-frame');
  var overlay = document.getElementById('zoom-overlay');
  var zoomImg = document.getElementById('zoom-img');
  if (!frame || !overlay) return;

  // Ajoute le hint visuel
  var hint = document.createElement('div');
  hint.className = 'zoom-hint';
  hint.textContent = '🔍 Cliquer pour zoomer';
  frame.style.position = 'relative';
  frame.appendChild(hint);

  frame.addEventListener('click', function(){
    var src = document.getElementById('main-img').src;
    zoomImg.src = src;
    overlay.classList.add('open');
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') overlay.classList.remove('open');
  });
})();

// ── Prix live ─────────────────────────────────────────────────────
(function(){
  var priceEl = document.querySelector('.price-val');
  var noteEl  = document.querySelector('.price-note');
  if (!priceEl) return;

  // Récupère le code de la carte depuis le SKU dans le JSON-LD
  var ldScript = document.querySelector('script[type="application/ld+json"]');
  var cardCode = '';
  try {
    var data = JSON.parse(ldScript.textContent);
    cardCode = data.sku || (data.additionalProperty || []).find(function(p){ return p.name === 'Code'; })?.value || '';
  } catch(e) {}

  if (!cardCode) return;

  priceEl.textContent = '…';
  priceEl.className = 'price-val price-loading';

  fetch('/api/prices?name=' + encodeURIComponent(cardCode))
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (data.success && data.price) {
        priceEl.textContent = data.price.toFixed(2).replace('.', ',') + ' €';
        priceEl.className = 'price-val price-live';
        if (noteEl) noteEl.textContent = 'Prix Cardmarket (indicatif)';

        // Met aussi à jour le JSON-LD avec le prix trouvé
        try {
          var s = document.querySelector('script[type="application/ld+json"]');
          var schema = JSON.parse(s.textContent);
          if (schema['@type'] === 'Product') {
            schema.offers = {
              '@type': 'Offer',
              'url': window.location.href,
              'price': String(data.price),
              'priceCurrency': 'EUR',
              'availability': 'https://schema.org/InStock'
            };
            s.textContent = JSON.stringify(schema);
          }
        } catch(e) {}
      } else {
        priceEl.textContent = 'Voir prix';
        priceEl.className = 'price-val price-error';
      }
    })
    .catch(function(){
      priceEl.textContent = 'Voir prix';
      priceEl.className = 'price-val price-error';
    });
})();
</script>
`;

// ─── Traitement de chaque fichier ────────────────────────────────

async function patchFile(filePath) {
  let html = await fs.readFile(filePath, 'utf8');

  // Évite de patcher deux fois
  if (html.includes('zoom-overlay')) return 'already_done';

  // 1. Ajoute offers dans le JSON-LD si absent
  html = html.replace(
    /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/,
    function(match, open, json, close) {
      try {
        const schema = JSON.parse(json);
        if (schema['@type'] === 'Product' && !schema.offers) {
          schema.offers = {
            '@type': 'Offer',
            'url': schema.url || '',
            'availability': 'https://schema.org/InStock',
            'priceCurrency': 'EUR'
          };
          return open + JSON.stringify(schema) + close;
        }
      } catch(e) {}
      return match;
    }
  );

  // 2. Injecte le CSS zoom avant </style>
  html = html.replace('</style>', ZOOM_CSS + '</style>');

  // 3. Injecte l'overlay + le script avant </body>
  html = html.replace('</body>', ZOOM_HTML + SCRIPT + '</body>');

  await fs.writeFile(filePath, html, 'utf8');
  return 'patched';
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Scan du dossier /carte/ ...');
  const files    = await fs.readdir(CARTE_DIR);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  console.log(`📄 ${htmlFiles.length} fichiers trouvés\n`);

  let patched = 0, skipped = 0, errors = 0;

  for (let i = 0; i < htmlFiles.length; i++) {
    const filePath = path.join(CARTE_DIR, htmlFiles[i]);
    try {
      const result = await patchFile(filePath);
      if (result === 'patched') {
        patched++;
        if (patched % 500 === 0) console.log(`  ✓ ${patched} pages mises à jour...`);
      } else {
        skipped++;
      }
    } catch(e) {
      console.error(`  ✗ ${htmlFiles[i]}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Terminé !`);
  console.log(`   Patchées : ${patched}`);
  console.log(`   Déjà ok  : ${skipped}`);
  console.log(`   Erreurs  : ${errors}`);
}

main().catch(err => { console.error(err); process.exit(1); });
