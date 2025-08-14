


import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import Consultas from './Consultas';
import Exames from './Exames';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/consultas" element={<Consultas />} />
      <Route path="/exames" element={<Exames />} />
    </Routes>
  );
}

export default App;
