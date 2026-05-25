const fs   = require('fs');
const path = require('path');

const SITE     = 'https://www.nakamabinder.com';
const IMG_BASE = 'https://raw.githubusercontent.com/aurardjohnny-stack/op-tcg-images/main';
const CARDS_FILE = path.join(__dirname, 'public', 'cards.json');
const OUT_DIR    = path.join(__dirname, 'public', 'carte');
const SITEMAP    = path.join(__dirname, 'public', 'sitemap-cards.xml');

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function cardSlug(card) {
  return slugify(card.name) + '-' + slugify(card.code) + '-' + card.lang.toLowerCase();
}

function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function rarityLabel(r) {
  var map = {
    COMMON: 'Common', UNCOMMON: 'Uncommon', RARE: 'Rare',
    SUPERRARE: 'Super Rare', SUPER_RARE: 'Super Rare',
    SECRETRARE: 'Secret Rare', SECRET_RARE: 'Secret Rare',
    LEADER: 'Leader', PROMO: 'Promo', DON: 'DON!!'
  };
  return map[r] || r || '';
}

function buildHtml(card, slug) {
  var name    = esc(card.name);
  var code    = esc(card.code);
  var set     = esc(card.set);
  var rarity  = rarityLabel(card.rarity);
  var type    = esc(card.type);
  var color   = esc(card.color);
  var effect  = esc(stripHtml(card.effect));
  var uiLang  = card.lang === 'FR' ? 'fr' : 'en';
  var cmLang  = card.lang === 'FR' ? 'fr' : 'en';
  var imgUrl  = IMG_BASE + '/' + esc(card.code) + '.webp';
  var url     = SITE + '/carte/' + slug + '/';
  var cmUrl   = 'https://www.cardmarket.com/' + cmLang + '/OnePiece/Products/Search?searchString=' + encodeURIComponent(card.code);

  var title = name + ' ' + code + ' - One Piece Card Game | Nakama Binder';
  var desc  = effect
    ? (name + ' (' + code + ') - ' + rarity + ' - ' + set + '. ' + effect.slice(0, 120) + '...')
    : (name + ' (' + code + ') - Carte One Piece Card Game ' + rarity + ' du set ' + set + '. Prix sur Cardmarket et collection sur Nakama Binder.');

  var ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": card.name,
    "description": stripHtml(card.effect) || (card.name + ' - One Piece Card Game'),
    "image": imgUrl,
    "sku": card.code,
    "brand": { "@type": "Brand", "name": "One Piece Card Game" },
    "category": card.type || "Carte One Piece",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "EUR",
      "url": cmUrl,
      "seller": { "@type": "Organization", "name": "Cardmarket" }
    }
  });

  return '<!DOCTYPE html>\n' +
'<html lang="' + uiLang + '">\n' +
'<head>\n' +
'<meta charset="UTF-8"/>\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
'<title>' + title + '</title>\n' +
'<meta name="description" content="' + desc.slice(0, 160) + '"/>\n' +
'<link rel="canonical" href="' + url + '"/>\n' +
'<meta property="og:type" content="product"/>\n' +
'<meta property="og:title" content="' + name + ' ' + code + ' - One Piece Card Game"/>\n' +
'<meta property="og:description" content="' + desc.slice(0, 160) + '"/>\n' +
'<meta property="og:image" content="' + imgUrl + '"/>\n' +
'<meta property="og:url" content="' + url + '"/>\n' +
'<meta property="og:site_name" content="Nakama Binder"/>\n' +
'<meta name="twitter:card" content="summary_large_image"/>\n' +
'<script type="application/ld+json">' + ldJson + '</script>\n' +
'<style>\n' +
'*{box-sizing:border-box;margin:0;padding:0}\n' +
':root{--bg:#080c10;--surface:#0e141c;--surface2:#141e2a;--border:#ffffff14;--red:#c0392b;--gold:#f0c040;--text:#e8edf2;--muted:#7a8a99;--green:#1D9E75}\n' +
'body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;padding:1.5rem 1rem}\n' +
'a{color:var(--gold);text-decoration:none}\n' +
'.wrap{max-width:800px;margin:0 auto}\n' +
'.breadcrumb{font-size:12px;color:#4a5a6a;margin-bottom:1.5rem}\n' +
'.breadcrumb a{color:var(--muted)}\n' +
'.breadcrumb span{margin:0 6px}\n' +
'.layout{display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap}\n' +
'.img-col{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:.75rem}\n' +
'.img-col img{width:220px;border-radius:10px;border:1px solid var(--border)}\n' +
'.badge{font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;background:#4a2a0a;color:var(--gold)}\n' +
'.info{flex:1;min-width:260px;display:flex;flex-direction:column;gap:.75rem}\n' +
'.set-tag{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}\n' +
'h1{font-size:1.5rem;font-weight:700;line-height:1.2}\n' +
'.code{font-size:13px;color:var(--muted);margin-top:2px}\n' +
'.divider{height:1px;background:var(--border)}\n' +
'.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n' +
'.meta-item{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 12px}\n' +
'.meta-label{font-size:10px;color:#4a5a6a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}\n' +
'.meta-val{font-size:13px;font-weight:500;color:#c8d8e8}\n' +
'.effect-box{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem}\n' +
'.effect-label{font-size:10px;color:#4a5a6a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:.5rem}\n' +
'.effect-text{font-size:13px;line-height:1.7;color:#b0bec5}\n' +
'.price-box{background:#0a1f12;border:1px solid #1e4d28;border-radius:10px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}\n' +
'.price-label{font-size:10px;color:#3a7a4a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}\n' +
'.price-val{font-size:1.2rem;font-weight:700;color:var(--green)}\n' +
'.price-sub{font-size:11px;color:#3a6a4a;margin-top:3px}\n' +
'.cm-btn{display:inline-flex;align-items:center;gap:7px;background:var(--green);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap}\n' +
'.cm-logo{font-size:17px;font-weight:900;font-style:italic}\n' +
'.actions{display:flex;gap:.5rem;flex-wrap:wrap}\n' +
'.btn{padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;display:inline-block}\n' +
'.btn-primary{background:var(--red);color:#fff}\n' +
'.btn-sec{background:var(--surface2);color:var(--muted);border:1px solid var(--border)}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div class="wrap">\n' +
'  <p class="breadcrumb"><a href="' + SITE + '">Nakama Binder</a><span>›</span><a href="' + SITE + '/?set=' + encodeURIComponent(card.set) + '">Cartes ' + set + '</a><span>›</span><span style="color:#e8edf2">' + name + ' ' + code + '</span></p>\n' +
'  <div class="layout">\n' +
'    <div class="img-col">\n' +
'      <img src="' + imgUrl + '" alt="' + name + ' ' + code + ' One Piece Card Game" loading="eager"/>\n' +
'      <span class="badge">' + rarity.toUpperCase() + '</span>\n' +
'    </div>\n' +
'    <div class="info">\n' +
'      <div><p class="set-tag">' + set + '</p><h1>' + name + '</h1><p class="code">' + code + (type ? ' · ' + type : '') + (color ? ' · ' + color : '') + '</p></div>\n' +
'      <div class="divider"></div>\n' +
'      <div class="meta-grid">\n' +
'        <div class="meta-item"><p class="meta-label">Rareté</p><p class="meta-val">' + rarity + '</p></div>\n' +
'        <div class="meta-item"><p class="meta-label">Set</p><p class="meta-val">' + set + '</p></div>\n' +
(type ? '        <div class="meta-item"><p class="meta-label">Type</p><p class="meta-val">' + type + '</p></div>\n' : '') +
(color ? '        <div class="meta-item"><p class="meta-label">Couleur</p><p class="meta-val">' + color + '</p></div>\n' : '') +
'      </div>\n' +
(effect ? '      <div class="effect-box"><p class="effect-label">Effet</p><p class="effect-text">' + effect + '</p></div>\n' : '') +
'      <div class="price-box">\n' +
'        <div><p class="price-label">Prix du marché</p><p class="price-val">Voir sur Cardmarket</p><p class="price-sub">Données en temps réel · vendeurs certifiés</p></div>\n' +
'        <a href="' + cmUrl + '" target="_blank" rel="noopener" class="cm-btn"><span class="cm-logo">cm</span> Voir les prix</a>\n' +
'      </div>\n' +
'      <div class="actions"><a href="' + SITE + '" class="btn btn-primary">Voir sur Nakama Binder</a></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</div>\n' +
'</body>\n' +
'</html>';
}

function main() {
  console.log('Lecture de cards.json...');
  var raw   = fs.readFileSync(CARDS_FILE, 'utf8');
  var data  = JSON.parse(raw);
  var cards = Array.isArray(data) ? data : data.cards;
  console.log(cards.length + ' cartes au total');

  var targets = cards.filter(function(c) {
    return (c.lang === 'FR' || c.lang === 'EN') && c.variant === 'base' && c.name && c.code;
  });
  console.log(targets.length + ' cartes FR/EN a generer');

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  var slugsSeen = {};
  var sitemapUrls = [];
  var generated = 0;
  var skipped = 0;

  for (var i = 0; i < targets.length; i++) {
    var card = targets[i];
    var slug = cardSlug(card);
    if (slugsSeen[slug]) { skipped++; continue; }
    slugsSeen[slug] = true;

    var dir = path.join(OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildHtml(card, slug), 'utf8');
    sitemapUrls.push(SITE + '/carte/' + slug + '/');
    generated++;

    if (generated % 500 === 0) process.stdout.write('  -> ' + generated + ' pages...\r');
  }

  console.log('\n' + generated + ' pages generees (' + skipped + ' doublons ignores)');

  console.log('Generation du sitemap...');
  var today = new Date().toISOString().split('T')[0];
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (var j = 0; j < sitemapUrls.length; j++) {
    xml += '  <url><loc>' + sitemapUrls[j] + '</loc><lastmod>' + today + '</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n';
  }
  xml += '</urlset>';
  fs.writeFileSync(SITEMAP, xml, 'utf8');
  console.log('sitemap-cards.xml genere (' + sitemapUrls.length + ' URLs)');
  console.log('\nPROCHAINES ETAPES :');
  console.log('  git add public/carte public/sitemap-cards.xml');
  console.log('  git commit -m "fix: images webp depuis GitHub"');
  console.log('  git push');
}

main();
