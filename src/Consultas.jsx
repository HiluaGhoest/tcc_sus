import React from "react";
import accountIcon from './assets/icons/account.png';
import geralIcon from './assets/icons/barefoot.png';
import prenatalIcon from './assets/icons/pregnant.png';
import ginecoIcon from './assets/icons/gynecologist.png';
import dentistaIcon from './assets/icons/tooth.png';
import nutricaoIcon from './assets/icons/nutrition.png';

// import psicologiaIcon from './assets/icons/psychology.png';
// Usando o ícone 'account.png' como alternativa para Psicologia
const psicologiaIcon = accountIcon;

const Consultas = () => {
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
  <h2 style={{ textAlign: 'center', fontWeight: 600, fontSize: 28, color: '#333', margin: '1rem 0' }}>Consultas</h2>
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
        {/* Geral */}
        <div style={cardStyle}>
          <img src={geralIcon} alt="Geral" style={iconStyle} />
          <span style={labelStyle}>Geral</span>
        </div>
        {/* Pré-natal */}
        <div style={cardStyle}>
          <img src={prenatalIcon} alt="Pré-natal" style={iconStyle} />
          <span style={labelStyle}>Pré-natal</span>
        </div>
        {/* Ginecologista */}
        <div style={cardStyle}>
          <img src={ginecoIcon} alt="Ginecologista" style={iconStyle} />
          <span style={labelStyle}>Ginecologista</span>
        </div>
        {/* Dentista */}
        <div style={cardStyle}>
          <img src={dentistaIcon} alt="Dentista" style={iconStyle} />
          <span style={labelStyle}>Dentista</span>
        </div>
        {/* Nutrição */}
        <div style={cardStyle}>
          <img src={nutricaoIcon} alt="Nutrição" style={iconStyle} />
          <span style={labelStyle}>Nutrição</span>
        </div>
        {/* Psicologia */}
        <div style={cardStyle}>
          <img src={psicologiaIcon} alt="Psicologia" style={iconStyle} />
          <span style={labelStyle}>Psicologia</span>
        </div>
      </div>
      {/* Botão Minhas Consultas */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
        <button style={{
          background: '#fff',
          border: 'none',
          borderRadius: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '0.75rem 2.5rem',
          fontSize: 18,
          fontWeight: 500,
          color: '#3078af',
          cursor: 'pointer',
        }}>
          Minhas consultas
        </button>
      </div>
    </div>
  );
};

const cardStyle = {
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
};

const iconStyle = {
  width: 56,
  height: 56,
  objectFit: 'contain',
  // marginBottom: 8,
};

const labelStyle = {
  fontSize: 18,
  color: '#333',
  fontWeight: 500,
  // marginTop: 4,
};

export default Consultas;
