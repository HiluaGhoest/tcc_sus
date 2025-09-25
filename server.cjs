const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir arquivos estáticos do build do Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Endpoint para buscar código IBGE do município e UF
app.get('/api/ibge-codes', async (req, res) => {
  const { uf, municipio } = req.query;
  if (!uf || !municipio) {
    return res.status(400).json({ error: 'Parâmetros uf e municipio são obrigatórios.' });
  }
  try {
    // Buscar lista de estados
    const estadosResp = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
    const estados = await estadosResp.json();
    const estado = estados.find(e => e.nome.toLowerCase() === uf.toLowerCase() || e.sigla.toLowerCase() === uf.toLowerCase());
    if (!estado) {
      return res.status(404).json({ error: 'UF não encontrada no IBGE.' });
    }
    // Buscar lista de municípios do estado
    const municipiosResp = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado.id}/municipios`);
    const municipiosList = await municipiosResp.json();
    // Tenta encontrar o município por nome (case insensitive)
    const municipioObj = municipiosList.find(m => m.nome.toLowerCase() === municipio.toLowerCase());
    if (!municipioObj) {
      return res.status(404).json({ error: 'Município não encontrado no IBGE.' });
    }
    res.json({ codigo_uf: estado.id, codigo_municipio: municipioObj.id, uf: estado.sigla, municipio: municipioObj.nome });
  } catch (err) {
    console.error('[IBGE Codes] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar código IBGE', details: err.message });
  }
});

// Endpoint para geocodificação reversa usando Nominatim
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Parâmetros lat e lon são obrigatórios.' });
  }
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'sisvida-proxy/1.0 (contato@seudominio.com)'
      }
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição Nominatim: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
  // Extrai UF e município do resultado
  const address = data.address || {};
  const uf = address.state || null;
  // Prioriza municipality, city, town, village, suburb, depois county
  const municipio = address.municipality || address.city || address.town || address.village || address.suburb || address.county || null;
  res.json({ uf, municipio, address });
  } catch (err) {
    console.error('[Reverse Geocode] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar dados de localização', details: err.message });
  }
});

// Proxy para DataSUS
app.get('/api/unidades', async (req, res) => {
  console.log('Received request for /api/unidades'); // Debug log
  const uf = req.query.uf || '35';  // Default para São Paulo
  const municipio = req.query.municipio || 352440; // Permite busca por município se fornecido
  let url = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_uf=${uf}&status=1&limit=100&offset=0&codigo_municipio=${municipio || ''}`;

  
  let allData = [];  // Store all paginated data

  try {
    let offset = 0;
    let totalResults = 0;
    let hasMore = true;

    // Loop to fetch paginated results
    while (hasMore) {
      const response = await fetch(`${url}&offset=${offset}`);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('URL', url);
      console.log(`Received ${data.estabelecimentos.length} items from offset ${offset}`);

      if (data.estabelecimentos.length === 0) {
        hasMore = false; // No more data to fetch
      } else {
        allData = allData.concat(data.estabelecimentos);
        offset += 20;  // Increment offset for the next batch
      }

      // If totalResults is set (for pagination), check if there are more pages
      totalResults = data.totalResults || 0;
      hasMore = offset < totalResults;
    }

    res.json({ estabelecimentos: allData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar unidades do DataSUS', details: err.message });
  }
});

// Fallback para SPA (React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});
