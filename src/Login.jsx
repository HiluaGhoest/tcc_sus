
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import medico1 from './assets/medico1.jpg';
import medico2 from './assets/medico2.jpg';
import medico3 from './assets/medico3.jpg';
import medico4 from './assets/medico4.jpg';
import medico5 from './assets/medico5.jpg';

function Login({ onRegisterClick }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const localImages = [medico1, medico2, medico3, medico4, medico5];
  const [bgUrl] = useState(localImages[Math.floor(Math.random() * localImages.length)]);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (username === '' || password === '') {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        navigate('/'); // Redireciona para a página principal
      } else {
        setError(data.error || 'Erro ao fazer login.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    if (username === '' || password === '') {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      const res = await fetch('http://localhost:3001/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
      } else {
        setError(data.error || 'Erro ao registrar.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      minHeight: '100vh',
      minWidth: '100vw',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'row',
      zIndex: 0,
    }}>
      {/* Coluna esquerda: login */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#153145ff',
        minWidth: 0,
        height: '100vh',
      }}>
        <div style={{width: '100%', maxWidth: 400}}>
          <div className="login-container">
            <img src={logo} alt="Logo" style={{ width: 160, marginBottom: -32 }} />
            <h2>Login</h2>
            <form onSubmit={handleLogin} className="login-form">
              <div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Usuário"
                />
              </div>
              <div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Senha"
                />
              </div>
              <button type="submit">Entrar</button>
              <button type="button" onClick={handleRegister} style={{marginTop: '0.5rem'}}>Registrar</button>
              {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
              {success && <p className="success-message" style={{color: 'green'}}>{success}</p>}
            </form>
          </div>
        </div>
      </div>
      {/* Coluna direita: imagem */}
      <div style={{
        flex: 1,
        minWidth: 0,
        height: '100vh',
        background: bgUrl
          ? `url(${bgUrl}) center/cover no-repeat`
          : '#e3e3e3',
        transition: 'background-image 0.5s',
      }} />
    </div>
  );
}

export default Login;
