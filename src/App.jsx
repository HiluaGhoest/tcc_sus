import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LandingPage from "./LandingPage";
import MainDashboard from "./MainDashboard";
import AgendarConsulta from "./AgendarConsulta";
import { supabase } from "./supabaseClient";
import DoctorDashboard from "./DoctorDashboard";
import AgendarExame from "./AgendarExame";
import ReagendarConsulta from "./ReagendarConsulta";
import Exames from "./Exames";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientType, setClientType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verificar se há um usuário autenticado
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      // don't setLoading(false) here if there's a session; wait for profile fetch
      if (!session) setLoading(false);
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          setClientType(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // When a user is set, fetch their profile to determine client_type (role)
  useEffect(() => {
    if (!user) return;

    let mounted = true;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("client_type")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Erro ao buscar profile:", error);
        }
        if (!mounted) return;
        const type = data?.client_type ?? null;
        setClientType(type);
        setLoading(false);

        // Only auto-redirect from the root path to avoid disturbing other routes
        if (location.pathname === "/") {
          if (type === "medico") {
            navigate("/doctor-dashboard");
          } else {
            navigate("/");
          }
        }
      } catch (err) {
        console.error(err);
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) return <LandingPage />;

  return (
    <Routes>
      <Route path="/" element={<MainDashboard />} />
  <Route path="/agendar-consulta" element={<AgendarConsulta />} />
  <Route path="/agendar-exame" element={<AgendarExame />} />
  <Route path="/reagendar-consulta" element={<ReagendarConsulta />} />
  <Link to="/exames" />
  <Route path="/exames" element={<Exames />} />
  <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
    </Routes>
  );

}
