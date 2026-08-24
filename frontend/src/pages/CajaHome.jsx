import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import StockCatalog from '../components/StockCatalog';
import { SaleContext } from '../context/SaleContext';

const CajaHome = () => {
  const navigate = useNavigate();
  const { sales } = useContext(SaleContext);

  const [showCatalog, setShowCatalog] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);

  // Cálculos de Arqueo para el Cierre de Turno
  const totalEfectivo = sales
    ? sales.filter(s => (s.paymentMethod || 'efectivo') === 'efectivo').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const totalDigital = sales
    ? sales.filter(s => s.paymentMethod === 'digital').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const totalGeneral = totalEfectivo + totalDigital;

  return (
    <div style={styles.container}>
      <button style={{ ...styles.btnCircle, ...styles.btnGreen }} onClick={() => navigate('/nuevo-cliente')}>+ Nuevo cliente</button>
      <button style={{ ...styles.btnCircle, ...styles.btnBlue }} onClick={() => setShowCatalog(true)}>📦 Ver Stock / Precios</button>
      <button style={{ ...styles.btnCircle, ...styles.btnYellow }} onClick={() => navigate('/ultimos-movimientos')}>Últimos movimientos</button>
      <button style={{ ...styles.btnCircle, ...styles.btnRed }} onClick={() => setShowCierreModal(true)}>Cerrar turno</button>

      {/* MODAL CATALOGO */}
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

      {/* MODAL CIERRE DE TURNO */}
      {showCierreModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🔒 RESUMEN CIERRE DE TURNO</h3>
              <button onClick={() => setShowCierreModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '10px 0' }}>
              <div style={styles.resumenRow}>
                <span>Ventas Totales:</span>
                <strong>{sales ? sales.length : 0} operaciones</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Efectivo en Caja:</span>
                <strong style={{ color: '#166534' }}>${totalEfectivo.toFixed(2)}</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Pagos Digitales:</span>
                <strong style={{ color: '#0284c7' }}>${totalDigital.toFixed(2)}</strong>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
              <div style={styles.resumenRow}>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>RECAUDACIÓN TOTAL:</span>
                <strong style={{ fontSize: '1.4rem', color: '#0f172a' }}>${totalGeneral.toFixed(2)}</strong>
              </div>
            </div>

            <button 
              onClick={() => {
                alert('Turno cerrado exitosamente.');
                setShowCierreModal(false);
                navigate('/login');
              }} 
              style={styles.btnConfirmarCierre}
            >
              CONFIRMAR Y FINALIZAR TURNO
            </button>
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
  modalCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' },
  btnCloseModal: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', color: '#334155' },
  btnConfirmarCierre: { width: '100%', padding: '14px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }
};

export default CajaHome;