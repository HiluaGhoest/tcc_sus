


import './App.css';
import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
