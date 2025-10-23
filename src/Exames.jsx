import React, { useState } from "react";

export default function Exames() {
  const exames = [
    {
      nome: "Hemograma Completo",
      tipo: "Exame de sangue completo",
      data: "15 Jan 2024",
      horario: "08:30",
      medico: "Dr. Silva",
      status: "Disponível",
      resultado: "16 Jan 2024, 14:20",
      icone: <FaVial color="#e53935" size={22} />,
    },
    {
      nome: "Raio-X Tórax",
      tipo: "Exame de imagem do tórax",
      data: "12 Jan 2024",
      horario: "14:15",
      medico: "Dr. Santos",
      status: "Disponível",
      resultado: "12 Jan 2024, 16:45",
      icone: <FaLungs color="#1565c0" size={22} />,
    },
    {
      nome: "Exame de Urina",
      tipo: "Análise completa de urina",
      data: "18 Jan 2024",
      horario: "09:00",
      medico: "Dra. Costa",
      status: "Pendente",
      resultado: "Processamento em andamento",
      icone: <FaFlask color="#f9a825" size={22} />,
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#f9fafc",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.2rem 2rem",
          background: "#fff",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <span style={{ color: "#3078af", fontSize: 22, fontWeight: 700 }}>
          SISVida
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#e3f2fd",
          }}
        >
          <img
            src={accountIcon}
            alt="User"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </header>

      {/* Conteúdo */}
      <main style={{ maxWidth: 900, margin: "2rem auto", background: "#fff", padding: "2rem", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#333" }}>
          Resultados dos Exames
        </h2>
        <p style={{ color: "#666", marginTop: 6 }}>
          Visualize e gerencie os resultados dos seus exames médicos.
        </p>

        {/* Filtros */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1.5rem",
            alignItems: "center",
          }}
        >
          <select style={selectStyle}>
            <option>Últimos 30 dias</option>
          </select>
          <select style={selectStyle}>
            <option>Todos os tipos</option>
          </select>
          <select style={selectStyle}>
            <option>Todos</option>
          </select>
          <button style={buscarBtn}>Buscar</button>
        </div>

        {/* Cards */}
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {exames.map((exame, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "1.2rem 1.5rem",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                border: "1px solid #eee",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {exame.icone}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                      {exame.nome}
                    </h3>
                    <p style={{ margin: 0, color: "#666" }}>{exame.tipo}</p>
                  </div>
                </div>
                <span
                  style={{
                    background: exame.status === "Disponível" ? "#e8f5e9" : "#fff8e1",
                    color: exame.status === "Disponível" ? "#2e7d32" : "#f9a825",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 8,
                  }}
                >
                  {exame.status}
                </span>
              </div>

              <div style={{ marginTop: 10, color: "#555", fontSize: 15 }}>
                <p>Data do exame: <b>{exame.data}</b> — Horário: <b>{exame.horario}</b></p>
                <p>Médico: <b>{exame.medico}</b></p>
                <p>
                  {exame.status === "Disponível"
                    ? `Resultado liberado em ${exame.resultado}`
                    : exame.resultado}
                </p>
              </div>

              {/* Ações */}
              <div style={{ marginTop: 10, display: "flex", gap: "1rem" }}>
                {exame.status === "Disponível" ? (
                  <>
                    <button style={actionBtn}><FaEye /> Visualizar</button>
                    <button style={actionBtn}><FaDownload /> Download</button>
                  </>
                ) : (
                  <button style={{ ...actionBtn, opacity: 0.6, cursor: "default" }}>Aguardando</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div style={{ marginTop: "2rem", textAlign: "right", fontSize: 14, color: "#666" }}>
          Mostrando 1 a 3 de 12 resultados
        </div>
      </main>
    </div>
  );
}

const selectStyle = {
  padding: "0.6rem 1rem",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 14,
};

const buscarBtn = {
  background: "#3078af",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0.6rem 1.4rem",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const actionBtn = {
  background: "none",
  border: "none",
  color: "#3078af",
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};
