import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Unidades agora serão buscadas da API CNES

export default function AgendarConsulta() {
  // Função para salvar consulta marcada
  async function salvarConsulta() {
    // Obter id do usuário autenticado via Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user || !userData.user.id) {
      alert('Usuário não identificado. Faça login novamente.');
      return;
    }
    const uuid = userData.user.id;
    // Montar objeto da consulta
    const novaConsulta = {
      data: dataSelecionadaFormatada,
      horario: horarioSelecionado,
      unidade: unidadeSelecionada ? unidadeSelecionada.nome : null,
      unidade_cnes: unidadeSelecionada ? unidadeSelecionada.cnes : null,
      medico: medicoSelecionado ? medicoSelecionado.nome : null,
      medico_id: medicoSelecionado ? medicoSelecionado.id : null,
      tipo: tipoConsultaSelecionado
    };
    // Buscar registro do cliente
    const { data, error } = await supabase
      .from('logistica_cliente')
      .select('consultas_marcadas')
      .eq('id', uuid)
      .single();
    if (error) {
      alert('Erro ao buscar dados do usuário.');
      return;
    }
    let consultas = [];
    if (data && data.consultas_marcadas) {
      try {
        consultas = Array.isArray(data.consultas_marcadas) ? data.consultas_marcadas : JSON.parse(data.consultas_marcadas);
      } catch {
        consultas = [];
      }
    }
    consultas.push(novaConsulta);
    // Atualizar registro
    const { error: updateError } = await supabase
      .from('logistica_cliente')
      .update({ consultas_marcadas: consultas })
      .eq('id', uuid);
    if (updateError) {
      alert('Erro ao salvar consulta.');
    } else {
      // Atualizar consultas_marcadas do médico
      if (medicoSelecionado && medicoSelecionado.id) {
        // Buscar consultas já marcadas do médico
        const { data: medicoData, error: medicoError } = await supabase
          .from('logistica_medico')
          .select('consultas_marcadas')
          .eq('id', medicoSelecionado.id)
          .single();
        let consultasMedico = [];
        if (medicoData && medicoData.consultas_marcadas) {
          try {
            consultasMedico = Array.isArray(medicoData.consultas_marcadas) ? medicoData.consultas_marcadas : JSON.parse(medicoData.consultas_marcadas);
          } catch {
            consultasMedico = [];
          }
        }
        consultasMedico.push({
          data: dataSelecionadaFormatada,
          horario: horarioSelecionado,
          paciente_id: uuid,
          unidade: unidadeSelecionada ? unidadeSelecionada.nome : null
        });
        await supabase
          .from('logistica_medico')
          .update({ consultas_marcadas: consultasMedico })
          .eq('id', medicoSelecionado.id);
      }
      alert('Consulta agendada com sucesso!');
      navigate('/');
    }
  }
  const [searchUnidade, setSearchUnidade] = useState("");
  // Estado para unidades dinâmicas
  const [unidades, setUnidades] = useState([]);
  const [unidadesOrdenadas, setUnidadesOrdenadas] = useState([]);
  // Função para calcular distância entre dois pontos (Haversine)
  function calcularDistancia(lat1, lng1, lat2, lng2) {
    function toRad(x) { return x * Math.PI / 180; }
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Obtém localização do usuário salva no localStorage
  const [userLocation, setUserLocation] = useState(null);
  React.useEffect(() => {
    const loc = localStorage.getItem('userLocation');
    if (loc) {
      try {
        setUserLocation(JSON.parse(loc));
      } catch {
        setUserLocation(null);
      }
    } else {
      setUserLocation(null);
    }
  }, []);

    React.useEffect(() => {
    if (userLocation) {
      // Primeiro, busca UF e município via reverse-geocode
      const geoUrl = `/api/reverse-geocode?lat=${userLocation.lat}&lon=${userLocation.lng}`;
      console.log('[Geolocalização] Buscando UF e município...', geoUrl);
      fetch(geoUrl)
        .then(res => res.json())
        .then(geoData => {
          console.log('[Geolocalização] Dados recebidos:', geoData);
          if (!geoData.uf || !geoData.municipio) {
            throw new Error('Não foi possível obter UF ou município da localização.');
          }
          // Busca os códigos IBGE
          return fetch('/api/ibge-codes?uf=' + encodeURIComponent(geoData.uf) + '&municipio=' + encodeURIComponent(geoData.municipio))
            .then(res => res.json())
            .then(codes => {
              if (!codes.codigo_uf || !codes.codigo_municipio) {
                throw new Error('Não foi possível obter os códigos IBGE.');
              }
              // Remove o último dígito do código do município
              const municipioCode = codes.codigo_municipio.toString().slice(0, -1);
              console.log('[IBGE Codes] Códigos recebidos:', codes, 'Código município ajustado:', municipioCode);
              const unidadesUrl = `/api/unidades?uf=${codes.codigo_uf}&municipio=${municipioCode}`;
              console.log('[Proxy CNES] Buscando unidades via backend...', unidadesUrl);
              return fetch(unidadesUrl);
            });
        })
        .then(async res => {
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('[Proxy CNES] Falha ao fazer parse do JSON:', e, '\nResposta bruta:', text);
            throw e;
          }
          console.log('[Proxy CNES] Resposta bruta:', text);
          console.log('[Proxy CNES] Resposta JSON:', data);
          const unidadesApi = (data.estabelecimentos || []).map(u => ({
            nome: u.nome_fantasia || u.nome_razao_social,
            endereco: `${u.tipo_logradouro || ''} ${u.logradouro || ''}, ${u.numero_estabelecimento || ''} - ${u.bairro_estabelecimento || ''}`,
            lat: parseFloat(u.latitude_estabelecimento_decimo_grau),
            lng: parseFloat(u.longitude_estabelecimento_decimo_grau),
            cnes: u.codigo_cnes
          })).filter(u => !isNaN(u.lat) && !isNaN(u.lng));
          setUnidades(unidadesApi);
          console.log('[Proxy CNES] Unidades recebidas:', unidadesApi);
        })
        .catch(err => {
          console.error('[Proxy CNES] Erro ao buscar unidades:', err);
        });
    }
    }, [userLocation]);


  // Ordena unidades pela distância quando userLocation ou unidades mudam
  React.useEffect(() => {
    console.log("[DEBUG] userLocation:", userLocation);
    console.log("[DEBUG] unidades:", unidades);
    if (userLocation) {
      console.log("[Unidades] Calculando distâncias das unidades para:", userLocation);
      const unidadesComDist = unidades.map(u => ({
        ...u,
        distanciaCalc: calcularDistancia(userLocation.lat, userLocation.lng, u.lat, u.lng)
      }));
      console.log("[Unidades] Unidades com distância:", unidadesComDist);
      unidadesComDist.sort((a, b) => a.distanciaCalc - b.distanciaCalc);
      console.log("[Unidades] Unidades ordenadas:", unidadesComDist.map(u => ({ nome: u.nome, distancia: u.distanciaCalc })));
      setUnidadesOrdenadas(unidadesComDist);
    } else {
      console.log("[Unidades] Sem localização do usuário. Usando ordem padrão.");
      setUnidadesOrdenadas(unidades);
    }
  }, [userLocation, unidades]);
  const today = new Date();
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const tiposConsulta = [
    "Cardiologista",
    "Reumatologista",
    "Ginecologista",
    "Pediatra",
    "Otorinolaringologista",
    "Dentista",
    "Pneumologista",
    "Dermatologista",
    "Neurologista",
    "Psiquiatra",
    "Obstetrícia",
    "Ortopedista",
    "Traumatologista",
    "Endocrinologista",
    "Urologista",
    "Anestesista",
    "Oftalmologista"
  ];
  // Função para encontrar a primeira data válida após uma semana
  const getFirstValidDate = () => {
    const diasNoMes = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let i = today.getDate() + 7; i <= diasNoMes; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      if (d.getDay() !== 0 && d.getDay() !== 6) return d;
    }
    // Se não houver, retorna o primeiro dia útil do próximo mês
    for (let i = 1; i <= 31; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, i);
      if (d.getDay() !== 0 && d.getDay() !== 6) return d;
    }
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  };
  // Calcula a data inicial e o mês/ano dela
  const dataInicial = getFirstValidDate();
  const [dataSelecionada, setDataSelecionada] = useState(dataInicial);
  const [mesAtual, setMesAtual] = useState(dataInicial.getMonth());
  const [anoAtual, setAnoAtual] = useState(dataInicial.getFullYear());
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [unidadeSelecionada, setUnidadeSelecionada] = useState(unidades[1]);
  // Resetar horários disponíveis ao trocar unidade
  useEffect(() => {
    setHorariosDisponiveis([]);
    setHorarioSelecionado("");
    setMedicoSelecionado(null);
  }, [unidadeSelecionada]);

  // Debug: log unidade selecionada
  useEffect(() => {
    console.log('[DEBUG] Unidade selecionada:', unidadeSelecionada);
    // Buscar médicos da unidade selecionada
    async function fetchMedicos() {
      if (!unidadeSelecionada || !unidadeSelecionada.nome) {
        setMedicos([]);
        return;
      }
      console.log('[DEBUG] Buscando médicos para unidade:', unidadeSelecionada.nome);
      const { data, error } = await supabase
        .from('logistica_medico')
        .select('*')
        .eq('unit_cnes', unidadeSelecionada.cnes);
      if (error) {
        console.error('[DEBUG] Erro ao buscar médicos:', error);
        setMedicos([]);
      } else {
        console.log('[DEBUG] Médicos encontrados:', data);
        setMedicos(data || []);
      }
    }
    fetchMedicos();
  }, [unidadeSelecionada]);
  const [tipoConsultaSelecionado, setTipoConsultaSelecionado] = useState(tiposConsulta[0]);
  const [medicos, setMedicos] = useState([]);
  const [medicoSelecionado, setMedicoSelecionado] = useState(null);

  // Debug: log médicos buscados/renderizados
  useEffect(() => {
    console.log('[DEBUG] Médicos carregados:', medicos);
  }, [medicos]);

  // Debug: log médico selecionado
  useEffect(() => {
    console.log('[DEBUG] Médico selecionado:', medicoSelecionado);
  }, [medicoSelecionado]);
  const [generoFiltro, setGeneroFiltro] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);

  // Atualiza horários disponíveis conforme data selecionada, especialidade e unidade
  useEffect(() => {
    if (!dataSelecionada || !unidadeSelecionada) {
      setHorariosDisponiveis([]);
      return;
    }
    // Obtém o dia da semana em inglês
    const diasSemana = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const diaSemana = diasSemana[dataSelecionada.getDay()];
    // Filtra médicos da especialidade e unidade
    const medicosFiltrados = medicos.filter(m =>
      m.specialty && m.specialty.trim().toLowerCase() === tipoConsultaSelecionado.trim().toLowerCase() &&
      m.unit_cnes === unidadeSelecionada.cnes
    );
    // Junta todos horários disponíveis dos médicos para aquele dia
    let horarios = [];
    medicosFiltrados.forEach(m => {
      if (m.agenda && m.agenda[diaSemana]) {
        horarios = horarios.concat(m.agenda[diaSemana]);
      }
    });
    // Remove duplicados
    horarios = Array.from(new Set(horarios));
    // Para cada horário, verifica se pelo menos um médico está livre
    const horariosDisponiveis = horarios.map(h => {
      // Médicos livres nesse horário
      const livres = medicosFiltrados.filter(m => {
        // Verifica se o médico tem esse horário na agenda
        const temHorario = m.agenda && m.agenda[diaSemana] && m.agenda[diaSemana].includes(h);
        // Verifica se não está ocupado
        let ocupados = [];
        if (m.consultas_marcadas) {
          try {
            const arr = Array.isArray(m.consultas_marcadas) ? m.consultas_marcadas : JSON.parse(m.consultas_marcadas);
            ocupados = arr.filter(c => c.data === dataSelecionadaFormatada).map(c => c.horario);
          } catch {
            ocupados = [];
          }
        }
        return temHorario && !ocupados.includes(h);
      });
      return { horario: h, medicosLivres: livres };
    }).filter(h => h.medicosLivres.length > 0);
    setHorariosDisponiveis(horariosDisponiveis);
    setMedicoSelecionado(null); // Resetar médico ao trocar horário
  }, [dataSelecionada, unidadeSelecionada, tipoConsultaSelecionado, medicos]);

  // Debug: log horários disponíveis
  useEffect(() => {
    console.log('[DEBUG] Horários disponíveis:', horariosDisponiveis);
  }, [horariosDisponiveis]);
  const navigate = useNavigate();

  // Calcula o primeiro dia da semana do mês atual
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  // Calcula o número de dias do mês atual
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  // Data selecionada formatada
  const dataSelecionadaFormatada = `${dataSelecionada.getDate()} de ${meses[dataSelecionada.getMonth()]}, ${dataSelecionada.getFullYear()}`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-lg font-bold">+</span>
            </div>
            <h1 className="text-xl font-bold text-blue-600">SISVida</h1>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2 mt-8">Agendar Consulta</h2>
          <p className="text-gray-500 text-center mb-8">Escolha a data, médico e unidade para seu atendimento</p>
          <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Bloco da esquerda: Data e Médico */}
              <div>
                {/* Data */}
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📅</span> <span>Escolha a Data</span>
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <button
                    className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    onClick={() => {
                      let novoMes = mesAtual;
                      let novoAno = anoAtual;
                      if (mesAtual === 0) {
                        novoMes = 11;
                        novoAno = anoAtual - 1;
                      } else {
                        novoMes = mesAtual - 1;
                      }
                      setMesAtual(novoMes);
                      setAnoAtual(novoAno);
                    }}
                  >
                    &#8592;
                  </button>
                  <span className="font-semibold text-gray-700">{meses[mesAtual]} {anoAtual}</span>
                  <button
                    className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    onClick={() => {
                      let novoMes = mesAtual;
                      let novoAno = anoAtual;
                      if (mesAtual === 11) {
                        novoMes = 0;
                        novoAno = anoAtual + 1;
                      } else {
                        novoMes = mesAtual + 1;
                      }
                      setMesAtual(novoMes);
                      setAnoAtual(novoAno);
                    }}
                  >
                    &#8594;
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2 text-gray-500 text-xs">
                  <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-6">
                  {[...Array(primeiroDiaSemana)].map((_, i) => (
                    <span key={"empty" + i}></span>
                  ))}
                  {[...Array(diasNoMes)].map((_, i) => {
                    const dia = i + 1;
                    const dataAtual = new Date(anoAtual, mesAtual, dia);
                    // Verifica se é final de semana
                    const isWeekend = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
                    // Verifica se está dentro dos 5 dias a partir de hoje ou antes
                    const diffDias = Math.floor((dataAtual - today) / (1000 * 60 * 60 * 24));
                    const isWithin5Days = anoAtual === today.getFullYear() && mesAtual === today.getMonth() && diffDias >= 0 && diffDias < 5;
                    const isPast =
                      anoAtual < today.getFullYear() ||
                      (anoAtual === today.getFullYear() && mesAtual < today.getMonth()) ||
                      (anoAtual === today.getFullYear() && mesAtual === today.getMonth() && dia < today.getDate());
                    const isCurrentDay = anoAtual === today.getFullYear() && mesAtual === today.getMonth() && dia === today.getDate();
                    let btnClass = "py-1 px-2 rounded transition-all font-medium text-sm border ";
                    const isSelected =
                      dataSelecionada.getDate() === dia &&
                      dataSelecionada.getMonth() === mesAtual &&
                      dataSelecionada.getFullYear() === anoAtual;
                    const disabled = isPast || isCurrentDay || isWeekend || isWithin5Days;
                    if (isSelected) {
                      btnClass += "bg-blue-600 text-white border-blue-600 ";
                    } else if (disabled) {
                      btnClass += "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed ";
                    } else {
                      btnClass += "bg-white hover:bg-blue-50 border-gray-200 ";
                    }
                    return (
                      <button
                        key={dia}
                        className={btnClass}
                        onClick={() => {
                          if (!disabled) setDataSelecionada(new Date(anoAtual, mesAtual, dia));
                        }}
                        disabled={disabled}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
                {/* Médico */}
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">⏰</span> <span>Escolha o Horário</span>
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {horariosDisponiveis.length > 0 ? horariosDisponiveis.map(h => (
                    <button
                      key={h.horario}
                      className={`py-2 rounded-lg font-medium text-sm border transition-all ${horarioSelecionado === h.horario ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 hover:bg-blue-50 border-gray-200"}`}
                      onClick={() => {
                        console.log('[DEBUG] Médicos disponíveis para o horário', h.horario, h.medicosLivres);
                        setHorarioSelecionado(h.horario);
                      }}
                    >
                      {h.horario}
                    </button>
                  )) : <span className="text-gray-400">Nenhum horário disponível para este dia.</span>}
                </div>
                {/* Após selecionar horário, exibe médicos livres */}
                {horarioSelecionado && (
                  <>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-blue-600">👨‍⚕️</span> <span>Escolha o Médico</span>
                    </h3>
                    <div className="mb-2">
                      <label className="mr-2 text-gray-600 font-medium">Filtrar por gênero:</label>
                      <select
                        className="p-1 border rounded bg-gray-100 text-gray-700"
                        value={generoFiltro}
                        onChange={e => setGeneroFiltro(e.target.value)}
                      >
                        <option value="">Todos</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 mb-6 max-h-72 overflow-y-auto">
                      {(horariosDisponiveis.find(h => h.horario === horarioSelecionado)?.medicosLivres || [])
                        .filter(m => {
                          if (!generoFiltro) return true;
                          if (!m.gender) return false;
                          return m.gender.trim().toLowerCase() === generoFiltro.trim().toLowerCase();
                        })
                        .map(m => (
                          <label key={m.id} className={`border rounded-xl p-3 flex flex-col cursor-pointer transition-all ${medicoSelecionado && medicoSelecionado.id === m.id ? "border-blue-600 bg-blue-50 shadow" : "border-gray-200 bg-white"}`}>
                            <input
                              type="radio"
                              name="medico"
                              className="hidden"
                              checked={medicoSelecionado && medicoSelecionado.id === m.id}
                              onChange={() => {
                                setMedicoSelecionado(m);
                              }}
                            />
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">{m.nome || "(Sem nome)"}</span>
                              <span className="text-gray-500 text-xs">{m.specialty || ""}</span>
                              {medicoSelecionado && medicoSelecionado.id === m.id && (
                                <span className="ml-2 text-blue-600 text-lg">●</span>
                              )}
                            </div>
                            <span className="text-gray-500 text-sm mt-1">Gênero: {m.gender || ""}</span>
                          </label>
                        ))}
                    </div>
                  </>
                )}
              </div>
              {/* Bloco da direita: Unidades e Tipo de Consulta */}
              
              <div>
                {/* Tipo de Consulta */}
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">🩺</span> <span>Tipo de Consulta</span>
                </h3>
                <select
                  className="mb-4 w-full p-2 border rounded-lg bg-gray-100 text-gray-700 font-medium "
                  value={tipoConsultaSelecionado}
                  onChange={e => setTipoConsultaSelecionado(e.target.value)}
                >
                  {tiposConsulta.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {/* Unidades */}
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-blue-600">📍</span> <span>Escolha a Unidade</span>
                </h3>
                <input
                  type="text"
                  className="mb-3 p-2 border rounded-lg w-full bg-gray-100 text-gray-700"
                  placeholder="Buscar unidade..."
                  value={searchUnidade}
                  onChange={e => setSearchUnidade(e.target.value)}
                />
                <div className="flex flex-col gap-3 mb-6 max-h-72 overflow-y-auto">
                  {unidadesOrdenadas
                    .filter(u => u.nome.toLowerCase().includes(searchUnidade.toLowerCase()))
                    .map((u, idx) => (
                      <label key={u.nome} className={`border rounded-xl p-4 flex flex-col cursor-pointer transition-all ${unidadeSelecionada && unidadeSelecionada.nome === u.nome ? "border-blue-600 bg-blue-50 shadow" : "border-gray-200 bg-white"}`}>
                        <input
                          type="radio"
                          name="unidade"
                          className="hidden"
                          checked={unidadeSelecionada && unidadeSelecionada.nome === u.nome}
                          onChange={() => setUnidadeSelecionada(u)}
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{u.nome}</span>
                          {unidadeSelecionada && unidadeSelecionada.nome === u.nome && (
                            <span className="ml-2 text-blue-600 text-lg">●</span>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm mt-1">{u.endereco}</span>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span> {userLocation && u.distanciaCalc ? `${u.distanciaCalc.toFixed(2)} km` : "-"}</span>
                        </div>
                        {unidadeSelecionada && unidadeSelecionada.nome === u.nome && !isNaN(u.lat) && !isNaN(u.lng) && (
                          <button
                            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                            onClick={() => {
                              const query = encodeURIComponent(`${u.nome} CNES ${u.cnes} Brasil`);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                            }}
                            >
                            Ver no mapa
                          </button>
                        )}
                      </label>
                    ))}
                </div>
              </div>
            </div>
            {/* Resumo do Agendamento */}
            <div className="bg-gray-50 rounded-xl p-6 mb-2 border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-4">Resumo do Agendamento</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div className="text-gray-500">Data:</div>
                  <div className="font-medium text-gray-700">{dataSelecionadaFormatada}</div>
                  <div className="text-gray-500">Horário:</div>
                  <div className="font-medium text-gray-700">{horarioSelecionado || "-"}</div>
                  <div className="text-gray-500">Unidade:</div>
                  <div className="font-medium text-gray-700">{unidadeSelecionada ? unidadeSelecionada.nome : "-"}</div>
                  <div className="text-gray-500">Médico:</div>
                  <div className="font-medium text-gray-700">{medicoSelecionado ? medicoSelecionado.nome : "-"}</div>
                  <div className="text-gray-500">Serviço:</div>
                  <div className="font-medium text-gray-700">{tipoConsultaSelecionado}</div>
                </div>
            </div>
            {/* Botões */}
            <div className="flex justify-between gap-4 mt-2">
              <button
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium border border-gray-300 hover:bg-gray-200 transition"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium border border-blue-600 shadow hover:bg-blue-700 transition"
                onClick={salvarConsulta}
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}