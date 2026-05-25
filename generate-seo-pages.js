/**
 * generate-seo-pages.js
 * Lance avec : node generate-seo-pages.js
 */

const fs   = require('fs');
const path = require('path');

const SITE = 'https://www.nakamabinder.com';
const CARDS_FILE = path.join(__dirname, 'public', 'cards.json');
const OUT_DIR    = path.join(__dirname, 'public', 'carte');
const SITEMAP    = path.join(__dirname, 'public', 'sitemap-cards.xml');

/* ── helpers ─────────────────────────────────────────────────── */

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cardSlug(card) {
  return `${slugify(card.name)}-${slugify(card.code)}-${card.lang.toLowerCase()}`;
}

function escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function langLabel(lang) {
  return { FR: 'Français', EN: 'English', JP: '日本語' }[lang] || lang;
}

function rarityLabel(r) {
  const map = {
    COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare',
    SUPERRARE: 'Super Rare', SECRETRARE: 'Secret Rare',
    SUPER_RARE: 'Super Rare', SECRET_RARE: 'Secret Rare',
    LEADER: 'Leader', PROMO: 'Promo', DON: 'DON!!'
  };
  return map[r] || r || '';
}

function cardmarketUrl(card) {
  // URL de recherche Cardmarket par code de carte — fonctionne pour toutes les cartes
  const lang = card.lang === 'FR' ? 'fr' : 'en';
  const code = encodeURIComponent(card.code);
  return `https://www.cardmarket.com/${lang}/OnePiece/Products/Search?searchString=${code}`;
}

/* ── template HTML ───────────────────────────────────────────── */

function buildHtml(card, slug) {
  const name    = escHtml(card.name);
  const code    = escHtml(card.code);
  const set     = escHtml(card.set);
  const rarity  = rarityLabel(card.rarity);
  const type    = escHtml(card.type);
  const color   = escHtml(card.color);
  const effect  = escHtml(stripHtml(card.effect));
  const lang    = langLabel(card.lang);
  const imgFull = `${SITE}${escHtml(card.image)}`;
  const url     = `${SITE}/carte/${slug}/`;
  const cmUrl   = cardmarketUrl(card);
  const uiLang  = card.lang === 'FR' ? 'fr' : 'en';

  const title = `${name} ${code} - One Piece Card Game | Nakama Binder`;
  const desc  = effect
    ? `${name} (${code}) - ${rarity} - ${set}. ${effect.slice(0, 120)}...`
    : `${name} (${code}) - Carte One Piece Card Game ${rarity} du set ${set}. Prix sur Cardmarket et collection sur Nakama Binder.`;

  const ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": card.name,
    "description": stripHtml(card.effect) || `${card.name} - One Piece Card Game`,
    "image": card.original_image || `${SITE}${card.image}`,
    "sku": card.code,
    "brand": { "@type": "Brand", "name": "One Piece Card Game" },
    "category": card.type || "Carte One Piece",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "EUR",
      "url": cmUrl,
      "seller": {
        "@type": "Organization",
        "name": "Cardmarket",
        "url": "https://www.cardmarket.com"
      }
    }
  });

  return `<!DOCTYPE html>
<html lang="${uiLang}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
<meta name="description" content="${desc.slice(0, 160)}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:type" content="product"/>
<meta property="og:title" content="${name} ${code} - One Piece Card Game"/>
<meta property="og:description" content="${desc.slice(0, 160)}"/>
<meta property="og:image" content="${imgFull}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:site_name" content="Nakama Binder"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${name} ${code} - One Piece Card Game"/>
<meta name="twitter:image" content="${imgFull}"/>
<script type="application/ld+json">${ldJson}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#080c10;--surface:#0e141c;--surface2:#141e2a;--border:#ffffff14;--red:#c0392b;--gold:#d4a017;--gold2:#f0c040;--text:#e8edf2;--muted:#7a8a99;--green:#1D9E75}
body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;padding:1.5rem 1rem}
a{color:var(--gold);text-decoration:none}
.wrap{max-width:800px;margin:0 auto}
.breadcrumb{font-size:12px;color:#4a5a6a;margin-bottom:1.5rem}
.breadcrumb a{color:var(--muted)}
.breadcrumb span{margin:0 6px}
.card-layout{display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap}
.img-col{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:.75rem}
.img-col img{width:220px;border-radius:10px;border:1px solid var(--border)}
.badge{font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px}
.badge-sr{background:#4a2a0a;color:var(--gold2)}
.badge-r{background:#1a2a3a;color:#7ab8f5}
.badge-c{background:#1a2535;color:var(--muted)}
.info-col{flex:1;min-width:260px;display:flex;flex-direction:column;gap:.75rem}
.set-tag{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
h1{font-size:1.6rem;font-weight:700;line-height:1.2}
.code{font-size:13px;color:var(--muted);margin-top:2px}
.divider{height:1px;background:var(--border);margin:.25rem 0}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.meta-item{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px}
.meta-label{font-size:10px;color:#4a5a6a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
.meta-val{font-size:13px;font-weight:500;color:#c8d8e8}
.effect-box{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem}
.effect-label{font-size:10px;color:#4a5a6a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem}
.effect-text{font-size:13px;line-height:1.7;color:#b0bec5}
.price-box{background:#0a1f10;border:1px solid #1a4a20;border-radius:10px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.price-left{}
.price-label{font-size:10px;color:#3a7a4a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.price-val{font-size:1.4rem;font-weight:700;color:var(--green)}
.price-sub{font-size:11px;color:#3a6a4a;margin-top:2px}
.cm-btn{display:inline-flex;align-items:center;gap:6px;background:#1D9E75;color:#fff;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;transition:opacity .15s}
.cm-btn:hover{opacity:.85;color:#fff}
.cm-logo{font-size:16px;font-weight:900;font-style:italic}
.actions{display:flex;gap:.5rem;flex-wrap:wrap}
.btn{padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface2);color:var(--muted)}
.btn-primary{background:var(--red);color:#fff;border-color:var(--red)}
</style>
</head>
<body>
<div class="wrap">
  <p class="breadcrumb">
    <a href="${SITE}">Nakama Binder</a>
    <span>›</span>
    <a href="${SITE}/?set=${encodeURIComponent(card.set)}">Cartes ${escHtml(card.set)}</a>
    <span>›</span>
    <span>${name} ${code}</span>
  </p>

  <div class="card-layout">
    <div class="img-col">
      <img src="${imgFull}" alt="${name} ${code} One Piece Card Game" loading="eager"/>
      <span class="badge ${card.rarity === 'SUPERRARE' || card.rarity === 'SUPER_RARE' ? 'badge-sr' : card.rarity === 'RARE' ? 'badge-r' : 'badge-c'}">${rarity}</span>
    </div>

    <div class="info-col">
      <div>
        <p class="set-tag">${escHtml(card.set)}</p>
        <h1>${name}</h1>
        <p class="code">${code}${type ? ' · ' + type : ''}${color ? ' · ' + color : ''} · ${lang}</p>
      </div>

      <div class="divider"></div>

      <div class="meta-grid">
        <div class="meta-item">
          <p class="meta-label">Rareté</p>
          <p class="meta-val">${rarity}</p>
        </div>
        <div class="meta-item">
          <p class="meta-label">Set</p>
          <p class="meta-val">${escHtml(card.set)}</p>
        </div>
        ${type ? `<div class="meta-item"><p class="meta-label">Type</p><p class="meta-val">${type}</p></div>` : ''}
        ${color ? `<div class="meta-item"><p class="meta-label">Couleur</p><p class="meta-val">${color}</p></div>` : ''}
      </div>

      ${effect ? `
      <div class="effect-box">
        <p class="effect-label">Effet</p>
        <p class="effect-text">${escHtml(stripHtml(card.effect))}</p>
      </div>` : ''}

      <div class="price-box">
        <div class="price-left">
          <p class="price-label">Prix du marché</p>
          <p class="price-val">Voir sur Cardmarket</p>
          <p class="price-sub">Données en temps réel · vendeurs certifiés</p>
        </div>
        <a href="${cmUrl}" target="_blank" rel="noopener" class="cm-btn">
          <span class="cm-logo">cm</span> Voir les prix
        </a>
      </div>

      <div class="actions">
        <a href="${SITE}/?card=${encodeURIComponent(slug)}" class="btn btn-primary">Voir sur Nakama Binder</a>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/* ── main ────────────────────────────────────────────────────── */

function main() {
  console.log('📖 Lecture de cards.json...');
  const raw   = fs.readFileSync(CARDS_FILE, 'utf8');
  const data  = JSON.parse(raw);
  const cards = Array.isArray(data) ? data : data.cards;

  console.log(`📦 ${cards.length} cartes au total`);

  const targets = cards.filter(c =>
    ['FR', 'EN'].includes(c.lang) && c.variant === 'base' && c.name && c.code
  );
  console.log(`🎯 ${targets.length} cartes FR/EN (variant base) à générer`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugsSeen = new Set();
  const sitemapUrls = [];
  let generated = 0, skipped = 0;

  for (const card of targets) {
    const slug = cardSlug(card);
    if (slugsSeen.has(slug)) { skipped++; continue; }
    slugsSeen.add(slug);

    const dir = path.join(OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildHtml(card, slug), 'utf8');
    sitemapUrls.push(`${SITE}/carte/${slug}/`);
    generated++;

    if (generated % 500 === 0) process.stdout.write(`  → ${generated} pages...\r`);
  }

  console.log(`\n✅ ${generated} pages générées  (${skipped} doublons ignorés)`);

  console.log('🗺️  Génération du sitemap...');
  const today = new Date().toISOString().split('T')[0];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapUrls.map(u =>
      `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    ),
    '</urlset>'
  ].join('\n');

  fs.writeFileSync(SITEMAP, xml, 'utf8');
  console.log(`✅ sitemap-cards.xml généré (${sitemapUrls.length} URLs)`);
  console.log('\n📋 PROCHAINES ÉTAPES :');
  console.log('  1. git add public/carte public/sitemap-cards.xml');
  console.log('  2. git commit -m "feat: SEO static pages + Cardmarket prices"');
  console.log('  3. git push → Vercel redéploie automatiquement');
  console.log('  4. Soumettre sitemap-cards.xml dans la Search Console');
}

main();
