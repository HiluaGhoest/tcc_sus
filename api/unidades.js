import fetch from "node-fetch";

export default async function handler(req, res) {
  const uf = req.query.uf || "35";
  const municipio = req.query.municipio || 352440;
  let url = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_uf=${uf}&status=1&limit=20&codigo_municipio=${municipio || ""}`;

  let allData = [];
  try {
    let offset = 0;
    let totalResults = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(`${url}&offset=${offset}`);
      if (!response.ok) throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);

      const data = await response.json();
      if (data.estabelecimentos.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data.estabelecimentos);
        offset += 20;
      }

      totalResults = data.totalResults || 0;
      hasMore = offset < totalResults;
    }

    res.json({ estabelecimentos: allData });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar unidades do DataSUS", details: err.message });
  }
}
