// api/img.js - Proxy d'images pour contourner le blocage hotlink
export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end();

  // Sécurité : on n'accepte que les images onepiece-cardgame.com
  if (!url.includes('onepiece-cardgame.com')) {
    return res.status(403).end();
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://en.onepiece-cardgame.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(response.status).end();

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Cache 24h CDN — les images ne bougent pas
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).end();
  }
}
