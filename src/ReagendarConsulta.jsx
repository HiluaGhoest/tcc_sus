import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function ReagendarConsulta() {
  const location = useLocation();
  const navigate = useNavigate();
  const { consulta, idx } = location.state || {};

  const [newDate, setNewDate] = useState(consulta?.data || "");
  const [newTime, setNewTime] = useState(consulta?.horario || "");
  const [motivo, setMotivo] = useState("");
  const [medicos, setMedicos] = useState([]);
  const [selectedMedico, setSelectedMedico] = useState(null);
  const [loading, setLoading] = useState(false);

  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  useEffect(() => {
    if (!consulta) {
      // nothing passed, go back
      navigate(-1);
    }
  }, [consulta, navigate]);

  // Fetch medicos for the same unit or same specialty when component mounts
  useEffect(() => {
    if (!consulta) return;
    const fetchMedicos = async () => {
      try {
        let query = supabase.from('logistica_medico').select('*');
        if (consulta.unidade_cnes) {
          query = query.eq('unit_cnes', consulta.unidade_cnes);
        } else if (consulta.tipo) {
          // match specialty case-insensitive
          query = query.ilike('specialty', `%${consulta.tipo}%`);
        }
        const { data, error } = await query;
        if (error) {
          console.error('Erro ao buscar médicos:', error);
          setMedicos([]);
          return;
        }
        setMedicos(data || []);
        // set default selected medico to the one from consulta if present
        const defaultMed = (data || []).find(m => m.id === consulta.medico_id || m.nome === consulta.medico);
        setSelectedMedico(defaultMed || null);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMedicos();
  }, [consulta]);

  const formatToStorageDate = (val) => {
    if (!val) return '';
    // if already in storage format (contains 'de'), return as-is
    if (typeof val === 'string' && val.includes(' de ')) return val;
    // if ISO yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const d = new Date(val + 'T00:00:00');
      return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
    }
    if (val instanceof Date) {
      const d = val;
      return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
    }
    return '';
  };

  const getAvailableSlotsForMedico = (medico, dateInput) => {
    if (!medico) return [];
    // determine day key
    const diasSemana = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    let dateObj;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) dateObj = new Date(dateInput + 'T00:00:00');
    else if (typeof dateInput === 'string' && dateInput.includes(' de ')) {
      // cannot reliably parse localized string -> skip availability
      return [];
    } else if (dateInput instanceof Date) dateObj = dateInput;
    else return [];
    const dayKey = diasSemana[dateObj.getDay()];
    const agenda = medico.agenda || {};
    const horarios = Array.isArray(agenda[dayKey]) ? [...agenda[dayKey]] : [];
    // determine occupied slots for that medico on that date
    let ocupados = [];
    if (medico.consultas_marcadas) {
      try {
        const arr = Array.isArray(medico.consultas_marcadas) ? medico.consultas_marcadas : JSON.parse(medico.consultas_marcadas);
        const formatted = formatToStorageDate(dateInput);
        ocupados = arr.filter(c => c.data === formatted).map(c => c.horario);
      } catch {
        ocupados = [];
      }
    }
    const disponiveis = horarios.filter(h => !ocupados.includes(h));
    return disponiveis;
  };

  // Calendar state (copied behavior from AgendarConsulta)
  const today = new Date();
  const getFirstValidDate = () => {
    const diasNoMesLocal = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let i = today.getDate() + 7; i <= diasNoMesLocal; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), i);
      if (d.getDay() !== 0 && d.getDay() !== 6) return d;
    }
    for (let i = 1; i <= 31; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + 1, i);
      if (d.getDay() !== 0 && d.getDay() !== 6) return d;
    }
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  };
  const dataInicial = getFirstValidDate();
  const [dataSelecionada, setDataSelecionada] = useState(dataInicial);
  const [mesAtual, setMesAtual] = useState(dataInicial.getMonth());
  const [anoAtual, setAnoAtual] = useState(dataInicial.getFullYear());
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [generoFiltro, setGeneroFiltro] = useState("");

  // keep newDate in sync (ISO yyyy-mm-dd)
  useEffect(() => {
    if (dataSelecionada instanceof Date) {
      const iso = dataSelecionada.toISOString().slice(0, 10);
      setNewDate(iso);
    }
  }, [dataSelecionada]);

  // Aggregate availability across medicos for the selected date
  useEffect(() => {
    if (!dataSelecionada || medicos.length === 0) {
      setHorariosDisponiveis([]);
      return;
    }
    const diasSemana = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
    const diaSemana = diasSemana[dataSelecionada.getDay()];
    // filter medicos by specialty/unit similar to earlier behavior
    const medicosFiltrados = medicos.filter(m => {
      if (consulta.unidade_cnes && m.unit_cnes !== consulta.unidade_cnes) return false;
      if (consulta.tipo && m.specialty && m.specialty.trim().toLowerCase() !== consulta.tipo.trim().toLowerCase()) return false;
      return true;
    });
    let horarios = [];
    medicosFiltrados.forEach(m => {
      if (m.agenda && m.agenda[diaSemana]) horarios = horarios.concat(m.agenda[diaSemana]);
    });
    horarios = Array.from(new Set(horarios));
    const disponiveis = horarios.map(h => {
      const medicosLivres = medicosFiltrados.filter(m => {
        const temHorario = m.agenda && m.agenda[diaSemana] && m.agenda[diaSemana].includes(h);
        if (!temHorario) return false;
        let ocupados = [];
        if (m.consultas_marcadas) {
          try {
            const arr = Array.isArray(m.consultas_marcadas) ? m.consultas_marcadas : JSON.parse(m.consultas_marcadas);
            ocupados = arr.filter(c => c.data === formatToStorageDate(dataSelecionada)).map(c => c.horario);
          } catch {
            ocupados = [];
          }
        }
        return !ocupados.includes(h);
      });
      return { horario: h, medicosLivres };
    }).filter(h => h.medicosLivres.length > 0);
    setHorariosDisponiveis(disponiveis);
    setHorarioSelecionado("");
    setNewTime("");
  }, [dataSelecionada, medicos, consulta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consulta) return;
    setLoading(true);

    try {
      // get current user profile to find cliente_cpf
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError || !profileData) throw new Error('Perfil não encontrado');

      // fetch cliente record
      const { data: cliente, error: clienteError } = await supabase
        .from('logistica_cliente')
        .select('*')
        .eq('cliente_cpf', profileData.cpf)
        .single();
      if (clienteError || !cliente) throw new Error('Registro do cliente não encontrado');

      // update cliente consultas_marcadas
      const novasConsultas = Array.isArray(cliente.consultas_marcadas) ? [...cliente.consultas_marcadas] : [];
      const updatedConsulta = { ...consulta, data: newDate, horario: newTime, reagendada: true, motivo_reagendamento: motivo };
      if (typeof idx === 'number' && idx >= 0 && idx < novasConsultas.length) {
        novasConsultas[idx] = updatedConsulta;
      } else {
        // fallback: try to find matching consulta and replace
        const foundIndex = novasConsultas.findIndex(c => c.data === consulta.data && c.horario === consulta.horario && c.medico === consulta.medico);
        if (foundIndex !== -1) novasConsultas[foundIndex] = updatedConsulta;
        else novasConsultas.push(updatedConsulta);
      }

      await supabase
        .from('logistica_cliente')
        .update({ consultas_marcadas: novasConsultas })
        .eq('cliente_cpf', profileData.cpf);

      // update medico schedule: remove old slot from previous medico (if any)
      if (consulta.medico_id) {
        try {
          const { data: prevMedData, error: prevMedError } = await supabase
            .from('logistica_medico')
            .select('consultas_marcadas')
            .eq('id', consulta.medico_id)
            .single();
          if (!prevMedError && prevMedData) {
            const prevConsultas = Array.isArray(prevMedData.consultas_marcadas) ? [...prevMedData.consultas_marcadas] : [];
            const filteredPrev = prevConsultas.filter(c => !(c.data === consulta.data && c.horario === consulta.horario && c.paciente_id === profileData.id));
            await supabase
              .from('logistica_medico')
              .update({ consultas_marcadas: filteredPrev })
              .eq('id', consulta.medico_id);
          }
        } catch (err) {
          console.error('Erro removendo slot do médico anterior', err);
        }
      }

      // add slot to selectedMedico (may be same as previous)
      const targetMedico = selectedMedico || medicos.find(m => m.id === consulta.medico_id) || null;
      if (targetMedico) {
        try {
          const { data: targetData, error: targetError } = await supabase
            .from('logistica_medico')
            .select('consultas_marcadas')
            .eq('id', targetMedico.id)
            .single();
          let targetConsultas = [];
          if (!targetError && targetData && targetData.consultas_marcadas) {
            try {
              targetConsultas = Array.isArray(targetData.consultas_marcadas) ? [...targetData.consultas_marcadas] : JSON.parse(targetData.consultas_marcadas);
            } catch {
              targetConsultas = [];
            }
          }
          // push new appointment
          targetConsultas.push({ data: formatToStorageDate(newDate), horario: newTime, paciente_id: profileData.id, unidade: consulta.unidade || null });
          await supabase
            .from('logistica_medico')
            .update({ consultas_marcadas: targetConsultas })
            .eq('id', targetMedico.id);
        } catch (err) {
          console.error('Erro adicionando slot ao médico alvo', err);
        }
      }

      setLoading(false);
      // navigate back to dashboard
      navigate(-1);
    } catch (err) {
      setLoading(false);
      alert('Erro ao reagendar: ' + (err.message || err));
    }
  };

  // Render redesigned layout similar to the provided Figma image
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-600 mb-6 flex items-center gap-2">◀ Voltar</button>

        <h1 className="text-2xl font-semibold mb-4">Reagendar Consulta</h1>
        <p className="text-sm text-gray-500 mb-8">Selecione uma nova data e horário para sua consulta</p>

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left column - current consulta + info cards */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded flex items-center justify-center text-blue-600 font-bold">Dr</div>
                <div>
                  <div className="font-semibold text-gray-800">{consulta?.medico || 'Dr. Nome'}</div>
                  <div className="text-sm text-gray-500">{consulta?.tipo || 'Especialidade'}</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {consulta?.data || '—'}
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {consulta?.horario || '—'}
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a2 2 0 10-2.828 2.828l4.243 4.243" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {consulta?.unidade || '—'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Informações</h3>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">Consulta</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Duração:</span>
                  <span className="font-medium">30 min</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Status:</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Agendado</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Center column - date picker and times */}
          <main className="lg:col-span-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Nova Data e Horário</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-gray-500">Selecionar Data</label>
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
                      {[...Array(new Date(anoAtual, mesAtual, 1).getDay())].map((_, i) => (
                        <span key={"empty" + i}></span>
                      ))}
                      {[...Array(new Date(anoAtual, mesAtual + 1, 0).getDate())].map((_, i) => {
                        const dia = i + 1;
                        const dataAtual = new Date(anoAtual, mesAtual, dia);
                        const isWeekend = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
                        const diffDias = Math.floor((dataAtual - today) / (1000 * 60 * 60 * 24));
                        const isWithin7Days = anoAtual === today.getFullYear() && mesAtual === today.getMonth() && diffDias >= 0 && diffDias < 7;
                        const isPast = anoAtual < today.getFullYear() || (anoAtual === today.getFullYear() && mesAtual < today.getMonth()) || (anoAtual === today.getFullYear() && mesAtual === today.getMonth() && dia < today.getDate());
                        const isCurrentDay = anoAtual === today.getFullYear() && mesAtual === today.getMonth() && dia === today.getDate();
                        let btnClass = "py-1 px-2 rounded transition-all font-medium text-sm border ";
                        const isSelected = dataSelecionada.getDate() === dia && dataSelecionada.getMonth() === mesAtual && dataSelecionada.getFullYear() === anoAtual;
                        const disabled = isPast || isCurrentDay || isWeekend || isWithin7Days;
                        if (isSelected) btnClass += "bg-blue-600 text-white border-blue-600 ";
                        else if (disabled) btnClass += "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed ";
                        else btnClass += "bg-white hover:bg-blue-50 border-gray-200 ";
                        return (
                          <button
                            key={dia}
                            className={btnClass}
                            onClick={() => { if (!disabled) setDataSelecionada(new Date(anoAtual, mesAtual, dia)); }}
                            disabled={disabled}
                          >
                            {dia}
                          </button>
                        );
                      })}
                    </div>

                    {/* Doctor will be selected after choosing a time slot (see right column) */}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500">Horários Disponíveis</label>
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {/* aggregated slots across doctors for the selected date */}
                      {horariosDisponiveis.length > 0 ? horariosDisponiveis.map(h => (
                        <button
                          key={h.horario}
                          type="button"
                          onClick={() => { setHorarioSelecionado(h.horario); setNewTime(h.horario); }}
                          className={`text-sm px-3 py-2 rounded border ${horarioSelecionado===h.horario ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                          {h.horario}
                        </button>
                      )) : (
                        <div className="text-sm text-gray-500">Nenhum horário disponível para este dia.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-gray-500">Motivo do Reagendamento (Opcional)</label>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo para o reagendamento..." className="mt-2 w-full border rounded px-3 py-2 h-28" />
                </div>
                {/* After selecting a slot, let user choose a doctor available at that slot */}
                {horarioSelecionado && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Escolha o Médico</h3>
                    <div className="mb-2">
                      <label className="mr-2 text-gray-600 font-medium">Filtrar por gênero:</label>
                      <select className="p-1 border rounded bg-gray-100 text-gray-700" value={generoFiltro} onChange={e=>setGeneroFiltro(e.target.value)}>
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
                          <label key={m.id} className={`border rounded-xl p-3 flex flex-col cursor-pointer transition-all ${selectedMedico && selectedMedico.id === m.id ? "border-blue-600 bg-blue-50 shadow" : "border-gray-200 bg-white"}`}>
                            <input type="radio" name="medico" className="hidden" checked={selectedMedico && selectedMedico.id === m.id} onChange={() => setSelectedMedico(m)} />
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">{m.nome || "(Sem nome)"}</span>
                              <span className="text-gray-500 text-xs">{m.specialty || ""}</span>
                              {selectedMedico && selectedMedico.id === m.id && (<span className="ml-2 text-blue-600 text-lg">●</span>)}
                            </div>
                            <span className="text-gray-500 text-sm mt-1">Gênero: {m.gender || ""}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                <div className="flex justify-between">
                  <div>
                    <div className="text-xs text-blue-700">Resumo do Reagendamento</div>
                    <div className="font-medium mt-1">Nova Data: <span className="font-normal">{newDate || '—'}</span></div>
                    <div className="font-medium">Novo Horário: <span className="font-normal">{newTime || '—'}</span></div>
                    <div className="font-medium">Médico: <span className="font-normal">{consulta?.medico || '—'}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded bg-red-500 text-white">Cancelar Consulta</button>
                <button type="submit" disabled={loading} className="px-6 py-2 rounded bg-blue-600 text-white">{loading ? 'Salvando...' : 'Confirmar Reagendamento'}</button>
              </div>
            </form>
          </main>

          {/* Right column - empty or future use */}
          <div className="lg:col-span-3"></div>
        </div>
      </div>
    </div>
  );
}
