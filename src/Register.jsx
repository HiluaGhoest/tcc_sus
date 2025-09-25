import { useState, useRef, useEffect } from "react";

// Lista de países com bandeira e código
const countries = [
  { code: "+55", flag: "🇧🇷", name: "Brasil" },
  { code: "+1", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "+44", flag: "🇬🇧", name: "Reino Unido" },
  { code: "+33", flag: "🇫🇷", name: "França" },
  { code: "+49", flag: "🇩🇪", name: "Alemanha" },
  { code: "+34", flag: "🇪🇸", name: "Espanha" },
  { code: "+39", flag: "🇮🇹", name: "Itália" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+81", flag: "🇯🇵", name: "Japão" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+7", flag: "🇷🇺", name: "Rússia" },
  { code: "+91", flag: "🇮🇳", name: "Índia" },
  { code: "+61", flag: "🇦🇺", name: "Austrália" },
  { code: "+27", flag: "🇿🇦", name: "África do Sul" },
  { code: "+52", flag: "🇲🇽", name: "México" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+598", flag: "🇺🇾", name: "Uruguai" },
  { code: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "+90", flag: "🇹🇷", name: "Turquia" },
  { code: "+62", flag: "🇮🇩", name: "Indonésia" },
  { code: "+234", flag: "🇳🇬", name: "Nigéria" },
  { code: "+966", flag: "🇸🇦", name: "Arábia Saudita" },
  { code: "+972", flag: "🇮🇱", name: "Israel" },
  { code: "+82", flag: "🇰🇷", name: "Coreia do Sul" },
  { code: "+66", flag: "🇹🇭", name: "Tailândia" },
  { code: "+65", flag: "🇸🇬", name: "Singapura" },
  { code: "+64", flag: "🇳🇿", name: "Nova Zelândia" },
  { code: "+420", flag: "🇨🇿", name: "República Tcheca" },
  { code: "+48", flag: "🇵🇱", name: "Polônia" },
  { code: "+358", flag: "🇫🇮", name: "Finlândia" },
  { code: "+46", flag: "🇸🇪", name: "Suécia" },
  { code: "+47", flag: "🇳🇴", name: "Noruega" },
  { code: "+31", flag: "🇳🇱", name: "Holanda" },
  { code: "+41", flag: "🇨🇭", name: "Suíça" },
  { code: "+43", flag: "🇦🇹", name: "Áustria" },
  { code: "+32", flag: "🇧🇪", name: "Bélgica" },
  { code: "+45", flag: "🇩🇰", name: "Dinamarca" },
  { code: "+375", flag: "🇧🇾", name: "Bielorrússia" },
  { code: "+380", flag: "🇺🇦", name: "Ucrânia" },
  { code: "+40", flag: "🇷🇴", name: "Romênia" },
  { code: "+36", flag: "🇭🇺", name: "Hungria" },
];
// Função para aplicar máscara de CPF
function maskCpf(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

// Função para aplicar máscara de telefone brasileiro
function maskPhoneBR(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}

// Função para aplicar máscara internacional
function maskPhoneIntl(value) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{1,4})(\d{1,4})?(\d{1,9})?/, function(_, p1, p2, p3) {
      let out = p1 ? `(${p1})` : "";
      if (p2) out += ` ${p2}`;
      if (p3) out += `-${p3}`;
      return out;
    });
}
import { supabase } from "./supabaseClient";

export default function Register({ onRegisterSuccess }) {
  const countrySelectRef = useRef(null);
  const genderIdentityRef = useRef(null);
  const genderBiologicalRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    password: "",
    gender_identity: "",
    gender_biological: "",
    age: "",
    phone: "",
    email: "",
    country: { code: "+55", flag: "🇧🇷" }
  });
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cpfExists, setCpfExists] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Verifica se o usuário está logado ao montar o componente
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    checkSession();
  }, []);
  // Função para validar senha
  function validatePassword(password) {
    const minLength = /.{8,}/;
    const hasNumber = /[0-9]/;
    const hasSpecial = /[^A-Za-z0-9]/;
    if (!minLength.test(password)) {
      return "A senha deve ter pelo menos 8 caracteres.";
    }
    if (!hasNumber.test(password)) {
      return "A senha deve conter pelo menos um número.";
    }
    if (!hasSpecial.test(password)) {
      return "A senha deve conter pelo menos um caractere especial.";
    }
    return "";
  }

  const handleChange = async (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      const selectedCountry = countries.find(c => c.code === value);
      setForm({
        ...form,
        country: selectedCountry || { code: value, flag: "" }
      });
    } else {
      setForm({
        ...form,
        [name]:
          name === "cpf"
            ? maskCpf(value)
            : name === "phone"
              ? form.country.code === "+55"
                ? maskPhoneBR(value)
                : maskPhoneIntl(value)
              : value,
      });
      // Validação de senha em tempo real
      if (name === "password") {
        setPasswordError(validatePassword(value));
      }
      // Verifica se o CPF já existe ao digitar
      if (name === "cpf") {
        const cleanCpf = value.replace(/\D/g, "");
        if (cleanCpf.length === 11) {
          const { data } = await supabase
            .from("profiles")
            .select("cpf")
            .eq("cpf", maskCpf(value));
          setCpfExists(data && data.length > 0);
        } else {
          setCpfExists(false);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccess(false);

    // Validação de senha
    const pwdError = validatePassword(form.password);
    if (pwdError) {
      setPasswordError(pwdError);
      setErrorMsg("Senha inválida. Corrija os requisitos.");
      return;
    }

    if (isLoggedIn) {
      setErrorMsg("Você já está logado. Não é possível registrar novamente.");
      return;
    }
    if (cpfExists) {
      setErrorMsg("CPF já registrado.");
      return;
    }

    // Validação de email
    let emailToUse = form.email;
    const cpfClean = form.cpf.replace(/\D/g, "");
    if (!emailToUse) {
      if (cpfClean.length === 11) {
        emailToUse = `${cpfClean}@fakecpf.local`;
      } else {
        setErrorMsg("Informe um e-mail válido ou CPF completo para gerar e-mail automático.");
        return;
      }
    }
    // Regex simples para validar e-mail
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(emailToUse)) {
      setErrorMsg("E-mail inválido.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: emailToUse,
      password: form.password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;
    // Verifica se já existe perfil com esse id ou cpf
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .or(`id.eq.${user.id},cpf.eq.${form.cpf}`);

    if (existingProfile && existingProfile.length > 0) {
      setErrorMsg("Perfil já existe para este usuário ou CPF.");
      return;
    }
      
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        name: form.name,
        cpf: form.cpf,
        gender_identity: form.gender_identity,
        gender_biological: form.gender_biological,
        age: parseInt(form.age),
        phone: form.phone,
        email: emailToUse,
      },
    ]);

    if (profileError) {
      console.error("Erro ao inserir em profiles:", profileError);
    }

    const { error: logisticaError } = await supabase.from("logistica_cliente").insert([
      {
        id: user.id,
        consultas_marcadas: {},
        consultas_realizadas: {},
        receitas_consultas: {},
        exames_marcados: {},
        exames_realizados: {},
        resultados_exames: {},
        cliente_cpf: form.cpf,
      },
    ]);

    if (logisticaError) {
      console.error("Erro ao inserir em logistica_cliente:", logisticaError);
    }

    // O redirecionamento será feito automaticamente pelo estado de autenticação no App.jsx
    setSuccess(true);

    if (onRegisterSuccess) {
    onRegisterSuccess();
    }
  };

  return (
      <div className="w-full max-w-md mx-auto">
        <style>{`
          .hide-arrow-select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: none !important;
          }
        `}</style>
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-xl p-3 space-y-4"
        >
          <h2 className="text-2xl font-semibold text-gray-800 text-center">Criar Conta</h2>
          {errorMsg && (
            <div className="text-red-600 text-center mb-2">{errorMsg}</div>
          )}
            <div className="relative">
              <input
                type="text"
                name="name"
                placeholder=" "
                value={form.name}
                onChange={handleChange}
                required
                className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <label
                htmlFor="name"
                className={`absolute left-3 text-gray-500 transition-all bg-white px-1
                  ${form.name ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                  peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
              >
                Nome Completo
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                name="cpf"
                placeholder=" "
                value={form.cpf}
                onChange={handleChange}
                maxLength={14}
                required
                className={`peer w-full px-4 pt-5 pb-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${cpfExists ? 'border-red-500' : 'border-gray-400'}`}
              />
              <label
                htmlFor="cpf"
                className={`absolute left-3 text-gray-500 transition-all bg-white px-1
                  ${form.cpf ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                  peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
              >
                CPF
              </label>
              {cpfExists && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="red" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" fill="#fee2e2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8M16 8l-8 8" stroke="red" strokeWidth="2" />
                  </svg>
                  <span className="text-xs">CPF já registrado</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                required
                className={`peer w-full px-4 pt-5 pb-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${passwordError ? 'border-red-500' : 'border-gray-400'}`}
              />
              <label
                htmlFor="password"
                className={`absolute left-3 text-gray-500 transition-all bg-white px-1
                  ${form.password ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                  peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
              >
                Senha
              </label>
              {passwordError && (
                <span className="text-xs text-red-600 mt-1 block">{passwordError}</span>
              )}
            </div>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[120px]">
              <select
                ref={genderIdentityRef}
                name="gender_identity"
                value={form.gender_identity}
                onChange={handleChange}
                className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md 
                          focus:ring-2 focus:ring-indigo-500 bg-white outline-none cursor-pointer appearance-none"
              >
                <option value="" disabled hidden></option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Não-binário">Não-binário</option>
                <option value="Outro">Outro</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
              <label
                htmlFor="gender_identity"
                className={`absolute left-3 text-gray-500 transition-all bg-white px-1 pointer-events-none
                  ${form.gender_identity
                    ? "-top-2 text-sm text-indigo-600"
                    : "top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400"}
                  peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
              >
                Gênero
              </label>
                {/* custom chevron icon since we hid the arrow */}
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  ▼
                </span>
            </div>
            <div className="relative flex-1 min-w-[120px]">
              <select
                ref={genderBiologicalRef}
                name="gender_biological"
                value={form.gender_biological}
                onChange={handleChange}
                className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md 
                          focus:ring-2 focus:ring-indigo-500 bg-white outline-none cursor-pointer
                          appearance-none" // hides the native arrow
              >
                <option value="" disabled hidden></option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
              </select>

              <label
                htmlFor="gender_biological"
                className={`absolute left-3 text-gray-500 transition-all bg-white px-1 pointer-events-none
                  ${form.gender_biological
                    ? "-top-2 text-sm text-indigo-600"
                    : "top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400"}
                  peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
              >
                Sexo biológico
              </label>

              {/* custom chevron icon since we hid the arrow */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                ▼
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2 items-center w-full min-w-[120px]">
              <div
                className="relative min-w-[50px] cursor-pointer"
                onClick={() => {
                  if (countrySelectRef.current) {
                    countrySelectRef.current.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Abrir seleção de país"
              >
                <select
                  ref={countrySelectRef}
                  name="country"
                  value={form.country.code}
                  onChange={handleChange}
                  className="peer px-2 pt-5 pb-2 border border-gray-400 rounded-md bg-white min-w-[50px] focus:ring-2 focus:ring-indigo-500 outline-none hide-arrow-select"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <label
                  htmlFor="country"
                  className={`absolute left-2 text-gray-500 transition-all bg-white px-1
                    ${form.country.code ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                    peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
                >
                  País
                </label>
              </div>
              <div className="relative flex-1">
                <input
                  name="phone"
                  type="tel"
                  placeholder=" "
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={15}
                  className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <label
                  htmlFor="phone"
                  className={`absolute left-3 text-gray-500 transition-all bg-white px-1
                    ${form.phone ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                    peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
                >
                  Telefone
                </label>
              </div>
              <div className="relative min-w-[40px] max-w-[60px] ml-auto">
                <input
                  name="age"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder=" "
                  value={form.age}
                  onChange={handleChange}
                  className="peer px-2 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 min-w-[40px] max-w-[60px] text-center outline-none"
                />
                <label
                  htmlFor="age"
                  className={`absolute left-2 text-gray-500 transition-all bg-white px-1
                    ${form.age ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                    peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
                >
                  Idade
                </label>
              </div>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              name="email"
              placeholder=" " // 👈 must be a space!
              value={form.email}
              onChange={handleChange}
              required
              className="peer w-full px-4 pt-5 pb-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <label
              htmlFor="email"
              className={`absolute left-3 text-gray-500 transition-all bg-white px-1
                ${form.email ? '-top-2 text-sm text-indigo-600' : 'top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400'}
                peer-focus:-top-2 peer-focus:text-sm peer-focus:text-indigo-600`}
            >
              Email
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Register
          </button>
        </form>
    </div>
  );
}