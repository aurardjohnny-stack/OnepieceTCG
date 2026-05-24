/**
 * update-prices.mjs
 * Lit seo-cards.json, va chercher le prix de chaque carte sur Cardmarket,
 * et met à jour le fichier avec les prix trouvés.
 *
 * Usage : node update-prices.mjs
 * Prérequis : node-fetch + cheerio  →  npm install node-fetch cheerio
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config ──────────────────────────────────────────────────────
const CARDS_FILE  = path.join(__dirname, 'seo-cards.json');
const DELAY_MS    = 1800;   // pause entre chaque requête (sois gentil avec Cardmarket)
const MAX_RETRIES = 2;      // tentatives si erreur réseau
const BASE_URL    = 'https://www.cardmarket.com/fr/OnePiece/Products/Search';

// ─── Helpers ─────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parsePrice(text) {
  // "0,49 €"  ou  "1.23 €"  ou  "ab 0,49 €"
  const match = text.match(/(\d+)[,.](\d{1,2})/);
  if (!match) return null;
  return parseFloat(`${match[1]}.${match[2]}`);
}

async function fetchPrice(code, name, attempt = 0) {
  const q = encodeURIComponent(code || name);
  const url = `${BASE_URL}?searchString=${q}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept':          'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Cardmarket affiche le prix "à partir de" dans ces sélecteurs
    // (si ça change, ajuste ici)
    const candidates = [
      $('.price-container .color-primary').first().text(),
      $('[class*="priceContainer"] .color-primary').first().text(),
      $('.article-row .price').first().text(),
      $('span.color-primary').first().text(),
    ];

    for (const text of candidates) {
      const price = parsePrice(text.trim());
      if (price !== null && price > 0) return price;
    }

    // Fallback : cherche le premier pattern "X,XX €" dans tout le HTML
    const rawMatch = html.match(/(\d+),(\d{2})\s*€/);
    if (rawMatch) return parseFloat(`${rawMatch[1]}.${rawMatch[2]}`);

    return null;

  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await sleep(DELAY_MS * 2);
      return fetchPrice(code, name, attempt + 1);
    }
    console.error(`  ✗ Erreur pour ${code || name}: ${err.message}`);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log('📦 Lecture de seo-cards.json...');
  const raw  = await fs.readFile(CARDS_FILE, 'utf8');
  const data = JSON.parse(raw);
  const cards = data.cards || data; // supporte {cards:[...]} ou [...]

  let updated = 0;
  let skipped = 0;
  let errors  = 0;

  console.log(`🃏 ${cards.length} cartes trouvées. Début de la mise à jour...\n`);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const code = card.code || card.cardCode || '';
    const name = card.name || card.title || '';

    if (!code && !name) { skipped++; continue; }

    process.stdout.write(`[${i+1}/${cards.length}] ${code || name} → `);

    const price = await fetchPrice(code, name);

    if (price !== null) {
      card.price = price;
      process.stdout.write(`${price}€ ✓\n`);
      updated++;
    } else {
      // Garde l'ancien prix s'il existait
      if (!card.price) delete card.price;
      process.stdout.write(`non trouvé\n`);
      errors++;
    }

    await sleep(DELAY_MS);
  }

  // Sauvegarde
  const out = data.cards ? { ...data, cards } : cards;
  await fs.writeFile(CARDS_FILE, JSON.stringify(out, null, 2), 'utf8');

  console.log(`\n✅ Terminé !`);
  console.log(`   Mis à jour : ${updated}`);
  console.log(`   Non trouvés : ${errors}`);
  console.log(`   Ignorés : ${skipped}`);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});
