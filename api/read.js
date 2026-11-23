// Vercel Serverless Function: POST /api/read
// Body: { image: <base64>, mimeType: "image/jpeg" }
// Balasan: { items: [{ no: 1, awb: "JP1234567890" }] }
// Perlu environment variable: ANTHROPIC_API_KEY

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Gunakan metode POST" });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY belum diisi di Vercel" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const image = body && body.image;
  const mimeType = (body && body.mimeType) || "image/jpeg";
  if (!image) return res.status(400).json({ error: "Gambar kosong" });

  const prompt =
    "Ini foto resi pengiriman J&T Express (bisa lebih dari satu resi). " +
    "Baca semua nomor resi/AWB. Formatnya 2 huruf diawali J (contoh JP, JD, JX) diikuti 9-13 angka. " +
    "Urutkan dari atas ke bawah, kiri ke kanan. " +
    'Balas HANYA JSON tanpa teks lain: {"items":[{"no":1,"awb":"JP1234567890"}]}. ' +
    'Jika tidak ada resi, balas {"items":[]}.';

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data && data.error && data.error.message) || "Gagal memanggil AI" });
    }
    const text = (data.content || []).map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    let out = { items: [] };
    try { out = JSON.parse(clean); } catch (e) {}
    if (!out || !Array.isArray(out.items)) out = { items: [] };
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
};
