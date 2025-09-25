import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function MainDashboard() {
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
      alert('Erro ao fazer logout: ' + error.message);
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
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-lg font-bold">+</span>
              </div>
              <h1 className="text-xl font-bold text-blue-600">SISVida</h1>
            </div>
            
            {/* Navigation - Centered */}
            <nav className="flex space-x-8 flex-1 justify-center">
              <a href="#" className="text-blue-600 font-medium">Agendamentos</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Exames</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Consultas</a>
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-12 mb-8 text-white relative overflow-hidden min-h-[180px] flex items-center">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Bem-vindo ao seu painel médico</h2>
                <p className="text-blue-100">Gerencie suas consultas, exames e resultados em um só lugar</p>
              </div>
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-6xl opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" fill="none" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="32" fill="#fff" opacity="0.2" />
                <circle cx="32" cy="26" r="10" fill="#fff" opacity="0.5" />
                <rect x="18" y="40" width="28" height="12" rx="6" fill="#fff" opacity="0.5" />
                </svg>
              </div>
            </div>

            {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Agendar Consulta */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate('/agendar-consulta')}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📅</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Agendar Consulta</h3>
                <p className="text-gray-500 text-sm">Marque uma nova consulta</p>
              </div>
            </div>
          </div>

          {/* Agendar Exame */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">�</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Agendar Exame</h3>
                <p className="text-gray-500 text-sm">Solicite um novo exame</p>
              </div>
            </div>
          </div>

          {/* Ver Resultados */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Ver Resultados</h3>
                <p className="text-gray-500 text-sm">Acesse seus resultados</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Próximas Consultas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Próximas Consultas</h3>
                <a href="#" className="text-blue-600 text-sm hover:underline">Ver todas</a>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {clienteData && Array.isArray(clienteData.consultas_marcadas) && clienteData.consultas_marcadas.length > 0 ? (
                clienteData.consultas_marcadas.map((consulta, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {consulta.medico ? consulta.medico.split(' ')[0][0] : 'C'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{consulta.medico || 'Médico'}</h4>
                      <p className="text-gray-600 text-sm">{consulta.tipo || 'Consulta'}</p>
                      <p className="text-gray-500 text-sm">{consulta.data_hora || ''}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{consulta.status || 'Pendente'}</span>
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