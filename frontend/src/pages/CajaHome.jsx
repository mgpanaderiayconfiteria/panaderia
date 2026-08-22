import React from 'react';
import { useNavigate } from 'react-router-dom';

const CajaHome = () => {
  const navigate = useNavigate();

  const handleCerrarTurno = () => {
    // Lógica para cerrar el turno
    console.log('Cerrando turno...');
  };

  return (
    <div style={styles.container}>
      {/* Botón Verde: Nuevo Cliente */}
      <button 
        style={{ ...styles.btnCircle, ...styles.btnGreen }} 
        onClick={() => navigate('/nuevo-cliente')}
      >
        + Nuevo cliente
      </button>

      {/* Botón Amarillo: Últimos Movimientos */}
      <button 
        style={{ ...styles.btnCircle, ...styles.btnYellow }} 
        onClick={() => navigate('/ultimos-movimientos')}
      >
        Últimos movimientos
      </button>

      {/* Botón Rojo: Cerrar Turno */}
      <button 
        style={{ ...styles.btnCircle, ...styles.btnRed }} 
        onClick={handleCerrarTurno}
      >
        Cerrar turno
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    gap: '24px',
    padding: '20px'
  },
  btnCircle: {
    borderRadius: '50%',
    border: 'none',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  btnGreen: {
    backgroundColor: '#2e7d32',
    width: '180px',
    height: '180px',
    fontSize: '1.2rem'
  },
  btnYellow: {
    backgroundColor: '#f57f17',
    width: '180px',
    height: '180px',
    fontSize: '1.2rem'
  },
  btnRed: {
    backgroundColor: '#c62828',
    width: '130px',
    height: '130px',
    fontSize: '0.95rem'
  }
};

export default CajaHome;