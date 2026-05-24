module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end();

  if (!url.includes('onepiece-cardgame.com')) {
    return res.status(403).end();
  }

  try {
    const domain = url.includes('fr.onepiece') ? 'https://fr.onepiece-cardgame.com/' 
                 : url.includes('en.onepiece') ? 'https://en.onepiece-cardgame.com/'
                 : 'https://en.onepiece-cardgame.com/';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': domain,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return res.status(response.status).end();

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).end();
  }
}
