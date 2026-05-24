export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const { name } = req.query;
  if(!name) return res.status(400).json({ error: 'missing name' });

  // Essaie plusieurs URLs Cardmarket
  const urls = [
    `https://www.cardmarket.com/fr/OnePiece/Products/Search?searchString=${encodeURIComponent(name)}&sortBy=price_asc&onlyAvailable=1`,
    `https://www.cardmarket.com/en/OnePiece/Products/Search?searchString=${encodeURIComponent(name)}&sortBy=price_asc`,
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  for(const url of urls){
    try {
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if(!resp.ok) continue;

      const html = await resp.text();

      // Patterns pour trouver le prix dans le HTML Cardmarket
      const patterns = [
        /class="[^"]*color-primary[^"]*font-weight-bold[^"]*"[^>]*>([\d]+[,.][\d]{1,2})\s*€/i,
        /class="[^"]*font-weight-bold[^"]*color-primary[^"]*"[^>]*>([\d]+[,.][\d]{1,2})\s*€/i,
        /"priceFrom":\s*"?([\d]+[,.][\d]{1,2})"?/i,
        /ab\s+([\d]+[,.][\d]{2})\s*€/i,
        /from\s+([\d]+[,.][\d]{2})\s*€/i,
        /price[^>]*>\s*([\d]+[,.][\d]{2})\s*€/i,
        /([\d]+),([\d]{2})\s*€/,
      ];

      for(const pattern of patterns){
        const m = html.match(pattern);
        if(m){
          const raw = m[1] + (m[2] ? '.' + m[2] : '');
          const price = parseFloat(raw.replace(',','.'));
          if(price > 0 && price < 5000){
            return res.status(200).json({ success: true, price });
          }
        }
      }
    } catch(e) {
      // continue to next URL
    }
  }

  return res.status(200).json({ success: false, price: null });
}
