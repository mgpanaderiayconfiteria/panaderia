import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StockCatalog from '../components/StockCatalog';

const CajaHome = () => {
  const navigate = useNavigate();
  const [showCatalog, setShowCatalog] = useState(false);
  const handleCerrarTurno = () => { console.log('Cerrando turno...'); };

  return (
    <div style={styles.container}>
      <button style={{ ...styles.btnCircle, ...styles.btnGreen }} onClick={() => navigate('/nuevo-cliente')}>+ Nuevo cliente</button>
      <button style={{ ...styles.btnCircle, ...styles.btnBlue }} onClick={() => setShowCatalog(true)}>📦 Ver Stock / Precios</button>
      <button style={{ ...styles.btnCircle, ...styles.btnYellow }} onClick={() => navigate('/ultimos-movimientos')}>Últimos movimientos</button>
      <button style={{ ...styles.btnCircle, ...styles.btnRed }} onClick={handleCerrarTurno}>Cerrar turno</button>

      {showCatalog && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>CONSULTA DE STOCK Y PRECIOS</h2>
              <button onClick={() => setShowCatalog(false)} style={styles.btnCloseModal}>✕ Cerrar</button>
            </div>
            <div style={styles.modalBody}><StockCatalog /></div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '20px', padding: '20px', position: 'relative' },
  btnCircle: { borderRadius: '50%', border: 'none', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0px 4px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  btnGreen: { backgroundColor: '#2e7d32', width: '170px', height: '170px', fontSize: '1.15rem' },
  btnBlue: { backgroundColor: '#0284c7', width: '170px', height: '170px', fontSize: '1.1rem' },
  btnYellow: { backgroundColor: '#f57f17', width: '160px', height: '160px', fontSize: '1.1rem' },
  btnRed: { backgroundColor: '#c62828', width: '120px', height: '120px', fontSize: '0.9rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#f8fafc', width: '100%', maxWidth: '1100px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' },
  btnCloseModal: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 }
};

export default CajaHome;