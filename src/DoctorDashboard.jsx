import { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { supabase } from "./supabaseClient";
import logo from './assets/logo.png';

// Especialidades exemplo
const SPECIALTIES = [
  "Cardiologia",
  "Clínica Geral",
  "Pediatria",
  "Ortopedia",
  "Ginecologia",
  "Dermatologia",
  "Psiquiatria",
  "Oftalmologia",
  "Neurologia",
  "Endocrinologia"
];

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    workplace: "",
    available_times: [],
    specialties: "",
    bio: ""
  });
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  // Horários: array de 24h
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

  // Captura localização do médico ao montar e salva no localStorage
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          localStorage.setItem('userLocation', JSON.stringify(coords));
          setUserLocation(coords);
        },
        (err) => {
          localStorage.removeItem('userLocation');
          setUserLocation(null);
        }
      );
    } else {
      localStorage.removeItem('userLocation');
      setUserLocation(null);
    }
  }, []);

  useEffect(() => {
    const getDoctorProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDoctor(user);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!error && profileData) {
          setProfile(profileData);
          setForm({
            workplace: profileData.workplace || "",
            available_times: profileData.available_times || [],
            specialties: profileData.specialties || "",
            bio: profileData.bio || ""
          });
          setSelectedUnit(profileData.workplace || "");
        }
      }
      setLoading(false);
    };
    getDoctorProfile();
  }, []);

  // Buscar unidades CNES próximas à localização
  useEffect(() => {
    async function fetchNearbyUnits() {
      if (!userLocation) return;
      try {
        console.log('[DoctorDashboard] Iniciando busca de unidades próximas...');
        // 1. Buscar UF e município via reverse-geocode
        const geoUrl = `/api/reverse-geocode?lat=${userLocation.lat}&lon=${userLocation.lng}`;
        console.log('[DoctorDashboard] Buscando UF e município:', geoUrl);
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        console.log('[DoctorDashboard] Dados de geolocalização recebidos:', geoData);
        if (!geoData.uf || !geoData.municipio) {
          console.log('[DoctorDashboard] UF ou município não encontrados. Encerrando.');
          return setUnits([]);
        }
        // 2. Buscar códigos IBGE
        const ibgeUrl = `/api/ibge-codes?uf=${encodeURIComponent(geoData.uf)}&municipio=${encodeURIComponent(geoData.municipio)}`;
        console.log('[DoctorDashboard] Buscando códigos IBGE:', ibgeUrl);
        const ibgeRes = await fetch(ibgeUrl);
        const ibgeData = await ibgeRes.json();
        console.log('[DoctorDashboard] Dados IBGE recebidos:', ibgeData);
        if (!ibgeData.codigo_uf || !ibgeData.codigo_municipio) {
          console.log('[DoctorDashboard] Código UF ou município IBGE não encontrados. Encerrando.');
          return setUnits([]);
        }
        // 3. Buscar unidades CNES (remover último dígito do código do município)
        const municipioCNES = String(ibgeData.codigo_municipio).slice(0, -1);
        const unidadesUrl = `/api/unidades?uf=${ibgeData.codigo_uf}&municipio=${municipioCNES}`;
        console.log('[DoctorDashboard] Buscando unidades CNES:', unidadesUrl);
        const unidadesRes = await fetch(unidadesUrl);
        const unidadesData = await unidadesRes.json();
        console.log('[DoctorDashboard] Unidades CNES recebidas:', unidadesData);
        // 4. Calcular distância e filtrar pelo município correto
        function calcularDistancia(lat1, lng1, lat2, lng2) {
          function toRad(x) { return x * Math.PI / 180; }
          const R = 6371;
          const dLat = toRad(lat2 - lat1);
          const dLng = toRad(lng2 - lng1);
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        }
        // Filtra unidades pelo código do município
        console.log('[DoctorDashboard] Filtrando unidades pelo código do município:', municipioCNES);
        const unidadesFiltradas = (unidadesData.estabelecimentos || []).filter(u => {
          return String(u.codigo_municipio).startsWith(municipioCNES);
        });
        console.log('[DoctorDashboard] Unidades filtradas:', unidadesFiltradas);
        const unidadesApi = unidadesFiltradas.map(u => ({
          ...u,
          distanciaCalc: (!isNaN(userLocation.lat) && !isNaN(userLocation.lng) && !isNaN(parseFloat(u.latitude_estabelecimento_decimo_grau)) && !isNaN(parseFloat(u.longitude_estabelecimento_decimo_grau)))
            ? calcularDistancia(userLocation.lat, userLocation.lng, parseFloat(u.latitude_estabelecimento_decimo_grau), parseFloat(u.longitude_estabelecimento_decimo_grau))
            : null
        })).sort((a, b) => (a.distanciaCalc ?? Infinity) - (b.distanciaCalc ?? Infinity));
        console.log('[DoctorDashboard] Unidades ordenadas por distância:', unidadesApi);
        setUnits(unidadesApi);
        console.log('[DoctorDashboard] Unidades setadas no estado. Fim do fluxo.');
      } catch (err) {
        console.error('[DoctorDashboard] Erro ao buscar unidades:', err);
        setUnits([]);
      }
    }
    fetchNearbyUnits();
  }, [userLocation]);

  // Seleção de unidade
  const handleUnitChange = (e) => {
    setSelectedUnit(e.target.value);
    setForm({ ...form, workplace: e.target.value });
  };

  // Seleção de horários
  const handleHourToggle = (hour) => {
    let newTimes;
    if (form.available_times.includes(hour)) {
      newTimes = form.available_times.filter(h => h !== hour);
    } else {
      newTimes = [...form.available_times, hour];
    }
    setForm({ ...form, available_times: newTimes });
  };

  // Seleção de especialidade
  const handleSpecialtyChange = (e) => {
    setForm({ ...form, specialties: e.target.value });
  };

  // Bio
  const handleBioChange = (e) => {
    setForm({ ...form, bio: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        workplace: form.workplace,
        available_times: form.available_times,
        specialties: form.specialties,
        bio: form.bio
      })
      .eq('id', doctor.id);
    if (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao salvar', text: error.message });
    } else {
      setProfile({ ...profile, ...form });
      setEditMode(false);
    }
    setLoading(false);
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
            <div className="flex items-center space-x-2 flex-1">
              <img src={logo} alt="SISVida Médico" className="w-8 h-8 rounded object-contain" />
              <h1 className="text-xl font-bold text-blue-600">SISVida Médico</h1>
            </div>
            <nav className="flex space-x-8 flex-1 justify-center">
              <a href="#" className="text-blue-600 font-medium">Consultas</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Exames</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Pacientes</a>
            </nav>
            <div className="flex items-center space-x-4 flex-1 justify-end">
              <div className="flex items-center space-x-2">
                {profile && (
                  <span className="text-gray-700 text-sm">
                    {profile.name?.split(' ')[0] || 'Médico'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-10 mb-8 text-white relative overflow-hidden min-h-[120px] flex items-center">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Painel do Médico</h2>
            <p className="text-blue-100">Gerencie suas informações profissionais e disponibilidade</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Informações Profissionais</h3>
          <form className="space-y-6">
            {/* Local de Trabalho - CNES */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Local de Trabalho (CNES)</label>
              <select
                name="workplace"
                value={selectedUnit}
                onChange={handleUnitChange}
                disabled={!editMode}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              >
                <option value="">Selecione uma unidade</option>
                {units.map(unit => (
                  <option key={unit.codigo_cnes} value={`${unit.nome_fantasia} - CNES ${unit.codigo_cnes}`}>
                    {unit.nome_fantasia} - CNES {unit.codigo_cnes}
                  </option>
                ))}
              </select>
            </div>

            {/* Horários Disponíveis - Grid */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Horários Disponíveis</label>
              <div className="grid grid-cols-6 gap-2">
                {hours.map(hour => (
                  <button
                    key={hour}
                    type="button"
                    disabled={!editMode}
                    onClick={() => handleHourToggle(hour)}
                    className={`px-2 py-1 rounded text-xs border ${form.available_times.includes(hour) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} ${editMode ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    {hour}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1">Clique para selecionar os horários em que você está disponível.</p>
            </div>

            {/* Especialidades - Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Especialidade</label>
              <select
                name="specialties"
                value={form.specialties}
                onChange={handleSpecialtyChange}
                disabled={!editMode}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
              >
                <option value="">Selecione uma especialidade</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Bio - Textarea */}
            <div>
              <label className="block text-gray-700 font-medium mb-1">Sobre/Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleBioChange}
                disabled={!editMode}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
                placeholder="Conte um pouco sobre você"
                rows={3}
              />
            </div>

            <div className="flex space-x-4 mt-6">
              {!editMode ? (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setForm({
                      workplace: profile.workplace || "",
                      available_times: profile.available_times || [],
                      specialties: profile.specialties || "",
                      bio: profile.bio || ""
                    }); setSelectedUnit(profile.workplace || ""); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
