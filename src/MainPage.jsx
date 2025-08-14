import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo_icon from './assets/logo_icon.png';
import medico1 from './assets/medico1.jpg';
import medico2 from './assets/medico2.jpg';
import medico3 from './assets/medico3.jpg';
import medico4 from './assets/medico4.jpg';
import medico5 from './assets/medico5.jpg';
import consultasIcon from './assets/icons/consultas.png';
import examesIcon from './assets/icons/exames.png';
import accountIcon from './assets/icons/account.png';
import viteLogo from '../public/vite.svg'; // Substitua pelo logo correto se necessário

function MainPage({ onLogout }) {
  // Seleciona uma imagem aleatória de medico1 a medico5
  const medicoImages = [medico1, medico2, medico3, medico4, medico5];
  const randomMedico = medicoImages[Math.floor(Math.random() * medicoImages.length)];
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      background: '#f5f7fa',
      fontFamily: 'sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Topo */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo_icon} alt="SISVida" style={{ height: 40, width: 120, objectFit: 'contain', marginRight: -16 }} />
          <span style={{ fontWeight: 700, fontSize: 22, color: '#3078af' }}>SISVida</span>
        </div>
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
      </header>
      {/* Conteúdo principal */}
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 80px)',
        minHeight: 'calc(100vh - 80px)',
        background: `url(${randomMedico}) center/cover`,
        position: 'relative',
        margin: 0,
        padding: 0,
        width: '100vw',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100vw',
          position: 'fixed',
          left: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.25)',
          borderRadius: 0,
          padding: '0 0 2rem 0',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '2rem',
            width: '50vw',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginLeft: 0,
            height: '120px',
            position: 'relative',
          }}>
            {/* Consultas */}
            <div className="expand-btn" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: '#fff',
              borderRadius: 24,
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              minWidth: 160,
              marginTop: '-40px', // metade da altura do botão para alinhar centro ao topo
              transition: 'transform 0.2s cubic-bezier(.4,2,.3,1)',
              cursor: 'pointer',
            }} onClick={() => navigate('/consultas')}>
              <img src={consultasIcon} alt="Consultas" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <span style={{ marginTop: 12, fontSize: 20 }}>Consultas</span>
            </div>
            {/* Exames */}
            <div className="expand-btn" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              background: '#fff',
              borderRadius: 24,
              padding: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              minWidth: 160,
              marginTop: '-40px', // metade da altura do botão para alinhar centro ao topo
              transition: 'transform 0.2s cubic-bezier(.4,2,.3,1)',
              cursor: 'pointer',
            }} onClick={() => navigate('/exames')}>
              <img src={examesIcon} alt="Exames" style={{ width: 48, height: 48, objectFit: 'contain' }} />
              <span style={{ marginTop: 12, fontSize: 20 }}>Exames</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MainPage;
