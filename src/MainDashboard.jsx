import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import logo from './assets/logo.png';

export default function MainDashboard() {
  // Função para cancelar consulta
  const handleCancelConsulta = async (consulta, idx) => {
    if (!clienteData || !profile) return;
    const result = await Swal.fire({
      title: 'Confirmação',
      text: 'Tem certeza que deseja cancelar esta consulta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, cancelar',
      cancelButtonText: 'Não',
    });
    if (!result.isConfirmed) return;

    try {
      // Remove do usuário
      const novasConsultas = clienteData.consultas_marcadas.filter((_, i) => i !== idx);
      await supabase
        .from('logistica_cliente')
        .update({ consultas_marcadas: novasConsultas })
        .eq('cliente_cpf', profile.cpf);

      // Remove do médico
      if (consulta.medico_id) {
        // Buscar dados do médico
        const { data: medicoData, error: medicoError } = await supabase
          .from('logistica_medico')
          .select('consultas_marcadas')
          .eq('medico_id', consulta.medico_id)
          .single();
        if (!medicoError && medicoData && Array.isArray(medicoData.consultas_marcadas)) {
          const novasConsultasMedico = medicoData.consultas_marcadas.filter(
            c => !(c.data === consulta.data && c.horario === consulta.horario && c.unidade === consulta.unidade && c.cliente_cpf === profile.cpf)
          );
          await supabase
            .from('logistica_medico')
            .update({ consultas_marcadas: novasConsultasMedico })
            .eq('medico_id', consulta.medico_id);
        }
      }

      // Atualiza estado local
      setClienteData(prev => ({ ...prev, consultas_marcadas: novasConsultas }));
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro ao cancelar consulta',
        text: 'Tente novamente.'
      });
    }
  };
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [clienteData, setClienteData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Captura localização do usuário ao montar e salva no localStorage
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          localStorage.setItem('userLocation', JSON.stringify(coords));
        },
        (err) => {
          localStorage.removeItem('userLocation');
        }
      );
    } else {
      localStorage.removeItem('userLocation');
    }
  }, []);

  useEffect(() => {
    const getProfileAndCliente = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Buscar dados do perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!profileError && profileData) {
          setProfile(profileData);
          // Buscar dados do cliente na tabela logistica_cliente
          if (profileData.cpf) {
            const { data: cliente, error: clienteError } = await supabase
              .from('logistica_cliente')
              .select('*')
              .eq('cliente_cpf', profileData.cpf)
              .single();
            if (!clienteError && cliente) {
              setClienteData(cliente);
            }
          }
        }
      }
      setLoading(false);
    };
    getProfileAndCliente();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro ao fazer logout',
        text: error.message
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-1">
              <img src={logo} alt="SISVida" className="w-8 h-8 rounded object-contain" />
              <h1 className="text-xl font-bold text-blue-600">SISVida</h1>
            </div>
            
            {/* Navigation - Centered */}
            <nav className="flex space-x-8 flex-1 justify-center">
              <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-blue-600"
              >
              Agendamentos
              </button>
              <button
                onClick={() => navigate('/exames')}
                className="text-gray-600 hover:text-blue-600"
              >
                Exames
              </button> 
              <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-blue-600"
              >
              Consultas
              </button>
            </nav>
            
            {/* User Section */}
            <div className="flex items-center space-x-4 flex-1 justify-end">
              {/* Notifications */}
              <div className="relative">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm">🔔</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-2">
                {profile && (
                  <span className="text-gray-700 text-sm">
                    {profile.name?.split(' ')[0] || 'Usuário'}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-12 mb-8 text-white relative overflow-hidden">
          <div className="relative z-10 text-center md:text-left space-y-6">
            {/* Bloco do texto */}
            <div>
              <h2 className="text-3xl font-bold mb-3">Bem-vindo ao seu painel médico</h2>
              <p className="text-blue-100">
                Gerencie suas consultas, exames e resultados em um só lugar
              </p>
           </div>
                      
            {/* Bloco dos botões */}
            <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={() => navigate('/agendar-consulta')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-50 hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                📅 Agendar Consulta
              </button>
                      
              <button
                onClick={() => navigate('/agendar-exame')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-50 hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                🧪 Agendar Exame
              </button>
                      
             <button
                onClick={() => navigate('/ver-resultados')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-blue-50 hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                📊 Ver Resultados
              </button>
            </div>
          </div>
                      
          {/* Ícone decorativo à direita */}
         <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-6xl opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="32" fill="#fff" opacity="0.2" />
              <circle cx="32" cy="26" r="10" fill="#fff" opacity="0.4" />
              <rect x="18" y="40" width="28" height="12" rx="6" fill="#fff" opacity="0.4" />
            </svg>
          </div>
        </div>



      

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Próximas Consultas - Design Moderno e Limpo */}
          <div className="bg-transparent">
            <div className="px-2 pb-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-800">Próximas Consultas</h3>
                <a href="#" className="text-blue-600 text-sm hover:underline">Ver todas</a>
              </div>
            </div>
            <div className="grid gap-6">
              {clienteData && Array.isArray(clienteData.consultas_marcadas) && clienteData.consultas_marcadas.length > 0 ? (
                clienteData.consultas_marcadas.map((consulta, idx) => (
                  <div key={idx} className="bg-white shadow rounded-2xl px-6 py-5 flex flex-col gap-2">
                    <div className="flex items-baseline gap-4 mb-2">
                      <span className="text-blue-700 text-lg font-semibold">{consulta.data || 'Data'}</span>
                      <span className="text-gray-700 text-base font-medium">{consulta.horario || 'Horário'}</span>
                    </div>
                    <div className="text-gray-900 font-bold text-lg">{consulta.tipo || 'Especialidade'}</div>
                    <div className="text-gray-800 text-base">{consulta.medico || 'Médico'}</div>
                    <div className="text-gray-500 text-sm flex items-center gap-2">
                      <span>{consulta.unidade || 'Unidade'}</span>
                      {consulta.unidade && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta.unidade)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          title="Ver localização no Maps"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg>
                        </a>
                      )}
                    </div>
                    <div className="flex gap-3 mt-4 items-end">
                      <button
                        onClick={() => navigate('/reagendar-consulta', { state: { consulta, idx } })}
                        className="self-end mt-2 px-4 py-1 rounded bg-blue-100 text-blue-700 font-semibold text-sm hover:bg-blue-200 transition-colors"
                      >
                        Reagendar
                      </button>
                      <button
                        onClick={() => handleCancelConsulta(consulta, idx)}
                        className="self-end mt-2 px-4 py-1 rounded bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition-colors"
                      >
                        Cancelar Consulta
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">Nenhuma consulta marcada.</div>
              )}
            </div>
          </div>

          {/* Resultados e Exames */}
          <div className="space-y-6">
            {/* Resultados Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Resultados Recentes</h3>
              </div>
              <div className="p-6 space-y-3">
                {clienteData && Array.isArray(clienteData.resultados_exames) && clienteData.resultados_exames.length > 0 ? (
                  clienteData.resultados_exames.map((resultado, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-800">{resultado.nome_exame || 'Exame'}</p>
                          <p className="text-gray-500 text-sm">{resultado.data || ''}</p>
                        </div>
                      </div>
                      <a href="#" className="text-blue-600 text-sm hover:underline">Ver</a>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Nenhum resultado disponível.</div>
                )}
              </div>
            </div>

            {/* Exames Agendados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Exames Agendados</h3>
              </div>
              <div className="p-6 space-y-3">
                {clienteData && Array.isArray(clienteData.exames_marcados) && clienteData.exames_marcados.length > 0 ? (
                  clienteData.exames_marcados.map((exame, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-800">{exame.nome_exame || 'Exame'}</p>
                        <p className="text-gray-500 text-sm">{exame.data_hora || ''}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Nenhum exame agendado.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}