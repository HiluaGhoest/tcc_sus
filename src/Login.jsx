import { useState } from "react";
import Swal from 'sweetalert2';
// Função para aplicar máscara de CPF
function maskCpf(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
import { supabase } from "./supabaseClient";

export default function Login() {
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState({ code: "+55", flag: "🇧🇷" });
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("paciente");
  const handleLogin = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("cpf", cpf)
      .single();

    if (error || !data) {
      Swal.fire({ icon: 'error', title: 'CPF não encontrado', text: 'Verifique o CPF e tente novamente.' });
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: data.email || `${cpf}@fakecpf.local`,
      password,
    });

    if (loginError) {
      Swal.fire({ icon: 'error', title: 'Erro ao entrar', text: loginError.message });
      return;
    }

    const user = loginData.user;

      const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("client_type")
    .eq("id", user.id)
    .single();

    if (profileError) {
      console.error("Erro ao buscar client type:", profileError);
    }

    if (profileData) {
      console.log("Usuário logado como:", profileData.client_type);
      localStorage.setItem("client_type", profileData.client_type);
    }


    // O redirecionamento será feito automaticamente pelo estado de autenticação no App.jsx
  };

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white shadow-md rounded-xl p-4 space-y-4 w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-semibold text-gray-800 text-center">Login</h2>

      <div className="relative">
        <input
          type="text"
          name="cpf"
          placeholder=" "
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          maxLength={14}
          required
          className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <label
          htmlFor="cpf"
          className={`absolute left-3 text-gray-500 transition-all bg-white px-1
            ${cpf ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
            peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
        >
          CPF
        </label>
      </div>

      <div className="relative">
        <input
          type="password"
          name="password"
          placeholder=" "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
        <label
          htmlFor="password"
          className={`absolute left-3 text-gray-500 transition-all bg-white px-1
            ${password ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
            peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
        >
          Senha
        </label>
      </div>

      <div className="relative">
        <select
          name="userType"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
          className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md 
              focus:ring-2 focus:ring-indigo-500 bg-white outline-none cursor-pointer appearance-none"
        >
          <option value="paciente">Paciente</option>
          <option value="medico">Médico</option>
        </select>
        <label
          htmlFor="userType"
          className="absolute left-3 top-[-10px] text-sm text-indigo-600 bg-white px-1"
        >
          Entrar como
        </label>
      </div>

      <button type="submit"
        className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">
        Login
      </button>
    </form>
  );
}
