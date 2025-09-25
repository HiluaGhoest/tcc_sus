import fetch from "node-fetch";

export default async function handler(req, res) {
  const { uf, municipio } = req.query;
  if (!uf || !municipio) {
    return res.status(400).json({ error: "Parâmetros uf e municipio são obrigatórios." });
  }

  try {
    const estadosResp = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados");
    const estados = await estadosResp.json();
    const estado = estados.find(
      (e) => e.nome.toLowerCase() === uf.toLowerCase() || e.sigla.toLowerCase() === uf.toLowerCase()
    );
    if (!estado) return res.status(404).json({ error: "UF não encontrada no IBGE." });

    const municipiosResp = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.id}/municipios`
    );
    const municipiosList = await municipiosResp.json();
    const municipioObj = municipiosList.find((m) => m.nome.toLowerCase() === municipio.toLowerCase());
    if (!municipioObj) return res.status(404).json({ error: "Município não encontrado no IBGE." });

    res.json({
      codigo_uf: estado.id,
      codigo_municipio: municipioObj.id,
      uf: estado.sigla,
      municipio: municipioObj.nome,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar código IBGE", details: err.message });
  }
}
