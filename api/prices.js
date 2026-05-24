export default async function handler(req, res) {
  try {
    const { name } = req.query

    if (!name) {
      return res.status(400).json({
        error: "missing card name"
      })
    }

    const search = encodeURIComponent(name)

    // recherche Cardmarket publique
    const url =
      `https://www.cardmarket.com/fr/OnePiece/Products/Search?searchString=${search}`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    })

    const html = await response.text()

    // extraction ultra simple du premier prix visible
    const match =
      html.match(/Price Trend[\s\S]*?([0-9]+,[0-9]+)/i)

    if (!match) {
      return res.status(200).json({
        success: false,
        price: null
      })
    }

    const price = match[1]

    return res.status(200).json({
      success: true,
      price
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    })
  }
}
