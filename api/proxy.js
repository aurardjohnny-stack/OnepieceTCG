export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url param');

  try {
    const target = decodeURIComponent(url);
    const targetUrl = new URL(target);
    const referer = targetUrl.origin + '/';

    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer,
        'Origin': targetUrl.origin,
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      }
    });

    if (!response.ok) return res.status(response.status).send('Image fetch failed');

    const contentType = response.headers.get('content-type') || 'image/png';
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).send('Proxy error: ' + e.message);
  }
}
