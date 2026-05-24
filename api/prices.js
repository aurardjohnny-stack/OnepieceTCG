export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'missing card name' });

  const search = encodeURIComponent(name);
  const url = `https://www.cardmarket.com/fr/OnePiece/Products/Search?searchString=${search}&sortBy=price_asc&onlyAvailable=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.cardmarket.com/fr/OnePiece',
      }
    });

    if (!response.ok) {
      return res.status(200).json({ success: false, price: null, reason: `HTTP ${response.status}` });
    }

    const html = await response.text();

    // Essaie plusieurs patterns pour trouver le prix
    const patterns = [
      /class="[^"]*color-primary[^"]*font-weight-bold[^"]*"[^>]*>([\d,]+)\s*€/i,
      /class="[^"]*font-weight-bold[^"]*color-primary[^"]*"[^>]*>([\d,]+)\s*€/i,
      /"priceFrom"[^>]*>([\d,]+)\s*€/i,
      /à partir de[^>]*>([\d,]+)\s*€/i,
      /from[^>]*>([\d,]+)\s*€/i,
      /([\d]+,[\d]{2})\s*€/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const price = parseFloat(match[1].replace(',', '.'));
        if (price > 0 && price < 10000) {
          return res.status(200).json({ success: true, price });
        }
      }
    }

    return res.status(200).json({ success: false, price: null, reason: 'price not found in page' });

  } catch (err) {
    return res.status(200).json({ success: false, price: null, reason: err.message });
  }
}
