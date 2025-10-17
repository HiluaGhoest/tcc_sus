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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!consulta) {
      // nothing passed, go back
      navigate(-1);
    }
  }, [consulta, navigate]);

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

      // update medico schedule: remove old slot and add new one if medico_id exists
      if (consulta.medico_id) {
        const { data: medicoData, error: medicoError } = await supabase
          .from('logistica_medico')
          .select('consultas_marcadas')
          .eq('medico_id', consulta.medico_id)
          .single();
        if (!medicoError && medicoData) {
          const medConsultas = Array.isArray(medicoData.consultas_marcadas) ? [...medicoData.consultas_marcadas] : [];
          // remove matching old consulta
          const filtered = medConsultas.filter(c => !(c.data === consulta.data && c.horario === consulta.horario && c.cliente_cpf === profileData.cpf));
          // add updated slot
          filtered.push({ ...updatedConsulta, cliente_cpf: profileData.cpf });
          await supabase
            .from('logistica_medico')
            .update({ consultas_marcadas: filtered })
            .eq('medico_id', consulta.medico_id);
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
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-600 mb-6 flex items-center gap-2">◀ Voltar</button>

        <h1 className="text-2xl font-semibold mb-4">Reagendar Consulta</h1>
        <p className="text-sm text-gray-500 mb-8">Selecione uma nova data e horário para sua consulta</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                <div className="flex items-center gap-2"><span>📅</span> {consulta?.data || '—'}</div>
                <div className="flex items-center gap-2"><span>⏰</span> {consulta?.horario || '—'}</div>
                <div className="flex items-center gap-2"><span>📍</span> {consulta?.unidade || '—'}</div>
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
                    <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-2 w-full border rounded px-3 py-2" required />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500">Horários Disponíveis</label>
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {/* example slots. keep simple: clicking sets newTime */}
                      {['08:00','08:30','09:00','09:30','10:00','10:30','14:00','14:30','15:00','15:30'].map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setNewTime(slot)}
                          className={`text-sm px-3 py-2 rounded border ${newTime===slot ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs text-gray-500">Motivo do Reagendamento (Opcional)</label>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo para o reagendamento..." className="mt-2 w-full border rounded px-3 py-2 h-28" />
                </div>
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
