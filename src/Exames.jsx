import React, { useState } from "react";
import accountIcon from './assets/icons/account.png';
import barelIcon from './assets/icons/barefoot.png';
import covidIcon from './assets/icons/covid-19.png';
import hivIcon from './assets/icons/hiv.png';
import syphilisIcon from './assets/icons/syphilis.png';
import urinaIcon from './assets/icons/urina-escura.png';
import sangueIcon from './assets/icons/blood-donor.png';

const Exames = () => {
  const [showResults, setShowResults] = useState(false);

  const resultados = [
    "exame de sangue",
    "exame de urina",
    "exame de covid",
    "exame do pézinho",
    "exame de sífilis",
    "exame de HIV",
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #e3f0fa 0%, #f7fbff 100%)',
      fontFamily: 'sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem 0.5rem 2rem',
        background: 'transparent',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: '#3078af' }}>SISVida</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 28 }}>⌂</span>
          </button>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#e3f2fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <img src={accountIcon} alt="Avatar" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          </div>
        </div>
      </header>

      {/* Título */}
      <h2 style={{ textAlign: 'center', fontWeight: 600, fontSize: 28, color: '#333', margin: '1rem 0' }}>Exames</h2>

      {/* Grid de opções */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        padding: '0 2rem',
      }}>
        {/* Cards de exames */}
        <ExameCard icon={sangueIcon} label="Coleta de Sangue" />
        <ExameCard icon={urinaIcon} label="Coleta de Urina" />
        <ExameCard icon={covidIcon} label="Teste de Covid" />
        <ExameCard icon={hivIcon} label="Teste de HIV" />
        <ExameCard icon={syphilisIcon} label="Teste de Sifilis" />
        <ExameCard icon={barelIcon} label="Teste do Pézinho" />
      </div>

      {/* Botão Resultados */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0', position: 'relative' }}>
        <button
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '0.75rem 2.5rem',
            fontSize: 18,
            fontWeight: 500,
            color: '#3078af',
            cursor: 'pointer',
          }}
          onClick={() => setShowResults(!showResults)}
        >
          Resultados
        </button>

        {/* Dropdown */}
  {showResults && (
  <div style={{
    position: 'absolute',
    top: 0,
    left: '65%',       // ao lado do botão
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: 200,
    zIndex: 100,

    // Novos estilos para scroll
    maxHeight: 150,      // altura máxima visível
    overflowY: 'auto',   // aparece barra de rolagem se exceder
  }}>
    {resultados.map((exame, index) => (
      <div key={index} style={{
        padding: '0.75rem 1rem',
        borderBottom: index < resultados.length - 1 ? '1px solid #eee' : 'none',
        cursor: 'pointer',
        color: '#333'
      }}>
        {exame}
      </div>
    ))}
  </div>
)}

      </div>
    </div>
  );
};

const ExameCard = ({ icon, label }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.2rem 0.5rem 0.7rem 0.5rem',
    minWidth: 120,
    minHeight: 120,
    cursor: 'pointer',
  }}>
    <img src={icon} alt={label} style={{ width: 56, height: 56, objectFit: 'contain' }} />
    <span style={{ fontSize: 18, color: '#333', fontWeight: 500 }}>{label}</span>
  </div>
);

export default Exames;
