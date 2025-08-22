


import './App.css';
import { Routes, Route, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Login from './Login';
import MainPage from './MainPage';
import Consultas from './Consultas';
import Exames from './Exames';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Checa se está logado ao iniciar
    const loggedIn = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(loggedIn);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <MainPage onLogout={handleLogout} /> : <Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/consultas" element={isAuthenticated ? <Consultas /> : <Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/exames" element={isAuthenticated ? <Exames /> : <Login onLoginSuccess={handleLoginSuccess} />} />
    </Routes>
  );
}

export default App;
