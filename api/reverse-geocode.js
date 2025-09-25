import fetch from "node-fetch";

export default async function handler(req, res) {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "Parâmetros lat e lon são obrigatórios." });
  }
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "sisvida-proxy/1.0 (contato@seudominio.com)" },
    });
    if (!response.ok) throw new Error(`Erro na requisição Nominatim: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const address = data.address || {};
    const uf = address.state || null;
    const municipio =
      address.municipality ||
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      null;

    res.json({ uf, municipio, address });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar dados de localização", details: err.message });
  }
}
