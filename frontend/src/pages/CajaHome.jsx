import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockCatalog from '../components/StockCatalog';
import RegistrarIngresoCaja from '../components/RegistrarIngresoCaja'; // Componente de ingreso unificado
import { SaleContext } from '../context/SaleContext';
import { AuthContext } from '../context/AuthContext';
import { ProductContext } from '../context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CajaHome = () => {
  const navigate = useNavigate();
  const { sales, clearSales, setSales } = useContext(SaleContext);
  const { user, logout } = useContext(AuthContext);
  const { products, fetchProducts } = useContext(ProductContext);

  const [showCatalog, setShowCatalog] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  
  // Estado para desplegar el modal de Ingreso de Proveedor
  const [showIngresoProveedorModal, setShowIngresoProveedorModal] = useState(false);

  // Estado para bloquear múltiples clics accidentales
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [initialCash, setInitialCash] = useState(localStorage.getItem('mg_initial_cash') || '0');
  const [tempCashInput, setTempCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [selectedWasteProd, setSelectedWasteProd] = useState('');
  const [wasteQty, setWasteQty] = useState('');

  useEffect(() => {
    const savedCash = localStorage.getItem('mg_initial_cash');
    if (!savedCash) setShowAperturaModal(true);
  }, []);

  const totalEfectivoVentas = sales
    ? sales.filter(s => (s.paymentMethod || 'efectivo') === 'efectivo').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const totalDigital = sales
    ? sales.filter(s => s.paymentMethod === 'digital').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const fondoInicialNum = parseFloat(initialCash) || 0;
  const efectivoEsperadoEnCaja = fondoInicialNum + totalEfectivoVentas;
  const recaudacionTotalProcesada = totalEfectivoVentas + totalDigital;
  const efectivoRealNum = parseFloat(actualCashInput) || 0;
  const diferenciaCaja = actualCashInput !== '' ? efectivoRealNum - efectivoEsperadoEnCaja : 0;

  const handleConfirmApertura = () => {
    const cashVal = parseFloat(tempCashInput) || 0;
    setInitialCash(cashVal.toString());
    localStorage.setItem('mg_initial_cash', cashVal.toString());
    setShowAperturaModal(false);
  };

  const handleRegisterWaste = async () => {
    if (!selectedWasteProd || !wasteQty) {
      alert('Por favor seleccione un producto y especifique la cantidad.');
      return;
    }

    setIsSubmitting(true);
    const prodObj = products.find(p => (p._id || p.id) === selectedWasteProd);

    try {
      const res = await fetch(`${API_URL}/api/shifts/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedWasteProd,
          productName: prodObj ? prodObj.name : 'Producto',
          quantity: parseFloat(wasteQty),
          mode: prodObj?.allowByWeight ? 'weight' : 'unit',
          employee: user?.name || user?.username || 'Cajera',
          reason: 'Sobrante de fin de turno'
        })
      });

      if (res.ok) {
        alert('✅ Sobrante registrado correctamente e impactado en el panel de mermas.');
        setShowWasteModal(false);
        setSelectedWasteProd('');
        setWasteQty('');
        if (fetchProducts) fetchProducts();
      } else {
        alert('No se pudo registrar la merma en el servidor.');
      }
    } catch (e) {
      alert('Error de conexión al registrar sobrante.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizarTurno = async () => {
    if (actualCashInput === '') {
      alert('Por favor ingrese el monto de efectivo real contado en la caja.');
      return;
    }

    setIsSubmitting(true);
    const closurePayload = {
      employee: user?.name || user?.username || 'Cajera',
      initialCash: fondoInicialNum,
      cashSales: totalEfectivoVentas,
      digitalSales: totalDigital,
      expectedCash: efectivoEsperadoEnCaja,
      actualCash: efectivoRealNum,
      difference: diferenciaCaja,
      totalRevenue: recaudacionTotalProcesada
    };

    try {
      await fetch(`${API_URL}/api/shifts/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closurePayload)
      });
    } catch (e) {
      console.warn('Servidor no disponible para guardar el reporte físico del turno.');
    } finally {
      setIsSubmitting(false);
    }

    alert(`Turno cerrado exitosamente.\n\nEfectivo Esperado: $${efectivoEsperadoEnCaja.toFixed(2)}\nEfectivo Real: $${efectivoRealNum.toFixed(2)}\nDiferencia: $${diferenciaCaja.toFixed(2)}`);
    
    if (typeof clearSales === 'function') {
      clearSales();
    } else if (typeof setSales === 'function') {
      setSales([]);
    }
    
    localStorage.removeItem('mg_initial_cash');
    localStorage.removeItem('mg_current_shift_sales');
    setShowCierreModal(false);

    if (logout) logout();
    navigate('/login');
  };

  return (
    <div className="caja-container">
      <style>{`
        .caja-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 100dvh;
          padding: 12px;
          box-sizing: border-box;
          background-color: #ffffff;
        }

        .top-info-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          align-items: center;
          justify-content: space-around;
          background-color: #dc2626;
          padding: 12px 18px;
          border-radius: 20px;
          font-size: 0.95rem;
          color: #ffffff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
          width: 100%;
          max-width: 800px;
          box-sizing: border-box;
        }

        .buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 800px;
          justify-items: center;
          align-items: center;
        }

        @media (min-width: 600px) {
          .buttons-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }

        .btn-circle {
          width: 100%;
          max-width: 130px;
          aspect-ratio: 1 / 1;
          border-radius: 20px;
          border: none;
          color: #ffffff;
          font-weight: bold;
          font-size: clamp(0.8rem, 3vw, 1rem);
          cursor: pointer;
          box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 10px;
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s ease, opacity 0.2s ease;
          user-select: none;
        }

        .btn-circle:active {
          transform: scale(0.92);
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.15);
        }

        .btn-action-rojo {
          width: 100%;
          padding: 12px;
          background-color: #dc2626;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.1s ease, background-color 0.2s ease;
        }

        .btn-action-rojo:active:not(:disabled) {
          transform: scale(0.96);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }

        .btn-action-rojo:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-main-red { background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); grid-column: span 2; max-width: 100%; aspect-ratio: auto; min-height: 100px; font-size: 1.4rem; }
        .btn-red-1 { background-color: #ef4444; }
        .btn-red-2 { background-color: #e11d48; }
        .btn-red-3 { background-color: #9f1239; }
        .btn-red-4 { background-color: #f87171; }
        .btn-red-5 { background-color: #be123c; }

        @media (min-width: 600px) {
          .btn-main-red { grid-column: span 3; }
        }

        .modal-card {
          background-color: #ffffff;
          width: 95%;
          max-width: 440px;
          max-height: 90dvh;
          overflow-y: auto;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
          border: 1px solid #e5e7eb;
          border-top: 5px solid #6b7280;
        }

        .modal-content-large {
          background-color: #ffffff;
          width: 95%;
          max-width: 1100px;
          height: 90dvh;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
      `}</style>

      {/* BARRA SUPERIOR DE CONTEXTO DE CAJA */}
      <div className="top-info-bar">
        <span>👤 Cajera: <strong>{user?.name || user?.username || 'Caja Activa'}</strong></span>
        <span>💵 Fondo Inicial: <strong>${fondoInicialNum.toFixed(2)}</strong></span>
        <button onClick={() => setShowAperturaModal(true)} style={styles.btnLinkEdit}>Ajustar Fondo</button>
      </div>

      {/* BOTONES PRINCIPALES EN TONOS ROJOS */}
      <div className="buttons-grid">
        <button className="btn-circle btn-main-red" onClick={() => navigate('/nuevo-cliente')}>
          <span>Nuevo Cliente +</span>
        </button>

        <button className="btn-circle btn-red-1" onClick={() => setShowCatalog(true)}>
          📋 Ver Stock
        </button>

        <button className="btn-circle btn-red-2" onClick={() => setShowWasteModal(true)}>
          📉 Cargar Sobrantes
        </button>

        {/* BOTÓN ALTA PROVEEDORES CONECTADO AL MODAL COMPLETO DE INGRESO */}
        <button className="btn-circle btn-red-3" onClick={() => setShowIngresoProveedorModal(true)}>
          🚚 Alta Proveedores
        </button>

        <button className="btn-circle btn-red-4" onClick={() => navigate('/ultimos-movimientos')}>
          📑 Últimos Movimientos
        </button>

        <button className="btn-circle btn-red-5" onClick={() => setShowCierreModal(true)}>
          ✖ Cerrar Turno
        </button>
      </div>

      {/* MODAL APERTURA DE CAJA */}
      {showAperturaModal && (
        <div style={styles.modalOverlay}>
          <div className="modal-card">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>💵 APERTURA DE CAJA</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>
              Ingrese el monto en efectivo disponible en la caja al iniciar el turno.
            </p>
            <input
              type="number"
              placeholder="Ej: 5000"
              value={tempCashInput}
              onChange={(e) => setTempCashInput(e.target.value)}
              style={styles.inputForm}
              autoFocus
            />
            <button onClick={handleConfirmApertura} className="btn-action-rojo">
              CONFIRMAR FONDO INICIAL
            </button>
          </div>
        </div>
      )}

      {/* MODAL CATALOGO */}
      {showCatalog && (
        <div style={styles.modalOverlay}>
          <div className="modal-content-large">
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>CONSULTA DE STOCK Y PRECIOS</h2>
              <button onClick={() => setShowCatalog(false)} style={styles.btnCloseModal}>✕ Cerrar</button>
            </div>
            <div style={styles.modalBody}><StockCatalog /></div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR DESPERDICIO / SOBRANTE */}
      {showWasteModal && (
        <div style={styles.modalOverlay}>
          <div className="modal-card">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>🗑️ REGISTRAR SOBRANTE / MERMA</h3>
              <button onClick={() => setShowWasteModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#374151', margin: 0 }}>
              Seleccione el producto de panadería que sobró para descontarlo del stock y reportarlo.
            </p>
            <select
              value={selectedWasteProd}
              onChange={(e) => setSelectedWasteProd(e.target.value)}
              style={styles.inputForm}
              disabled={isSubmitting}
            >
              <option value="">-- Seleccionar Producto --</option>
              {products.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} (Stock: {p.allowByWeight ? `${((p.stockGrams || p.stock || 0) / 1000).toFixed(2)} kg` : `${p.stockUnits || p.stock || 0} un`})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cantidad / Gramos / Unidades a dar de baja"
              value={wasteQty}
              onChange={(e) => setWasteQty(e.target.value)}
              style={styles.inputForm}
              disabled={isSubmitting}
            />
            <button 
              onClick={handleRegisterWaste} 
              className="btn-action-rojo"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR BAJA POR SOBRANTE'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE ALTA / RECEPCIÓN DE PROVEEDORES */}
      {showIngresoProveedorModal && (
        <RegistrarIngresoCaja onClose={() => setShowIngresoProveedorModal(false)} />
      )}

      {/* MODAL CIERRE DE TURNO */}
      {showCierreModal && (
        <div style={styles.modalOverlay}>
          <div className="modal-card">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#111827' }}>🔒 ARQUEO Y CIERRE DE TURNO</h3>
              <button onClick={() => setShowCierreModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0' }}>
              <div style={styles.resumenRow}>
                <span>Ventas Totales:</span>
                <strong>{sales ? sales.length : 0} órdenes</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Fondo Inicial de Caja:</span>
                <strong>${fondoInicialNum.toFixed(2)}</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Ventas en Efectivo:</span>
                <strong style={{ color: '#111827' }}>+ ${totalEfectivoVentas.toFixed(2)}</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Cobros Digitales:</span>
                <strong style={{ color: '#111827' }}>${totalDigital.toFixed(2)}</strong>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />

              <div style={{ ...styles.resumenRow, backgroundColor: '#f9fafb', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontWeight: 'bold', color: '#111827' }}>EFECTIVO ESPERADO EN CAJA:</span>
                <strong style={{ fontSize: '1rem', color: '#111827' }}>${efectivoEsperadoEnCaja.toFixed(2)}</strong>
              </div>

              <div style={{ marginTop: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#374151', display: 'block', marginBottom: '4px' }}>
                  💵 Efectivo Real Contado en Caja ($):
                </label>
                <input
                  type="number"
                  placeholder="Ej. 12500"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  style={{ ...styles.inputForm, border: '2px solid #9ca3af', fontSize: '1rem', fontWeight: 'bold', color: '#111827' }}
                  disabled={isSubmitting}
                />
              </div>

              {actualCashInput !== '' && (
                <div style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  color: diferenciaCaja === 0 ? '#059669' : diferenciaCaja > 0 ? '#2563eb' : '#dc2626',
                  border: `1px solid ${diferenciaCaja === 0 ? '#10b981' : diferenciaCaja > 0 ? '#3b82f6' : '#ef4444'}`
                }}>
                  {diferenciaCaja === 0 && '✅ Caja Cuadrada Perfecta'}
                  {diferenciaCaja > 0 && `🔵 Sobrante en Caja: +$${diferenciaCaja.toFixed(2)}`}
                  {diferenciaCaja < 0 && `⚠️ Faltante en Caja: -$${Math.abs(diferenciaCaja).toFixed(2)}`}
                </div>
              )}
            </div>

            <button 
              onClick={handleFinalizarTurno} 
              className="btn-action-rojo"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'CERRANDO TURNO...' : 'CONFIRMAR Y FINALIZAR TURNO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  btnLinkEdit: { background: 'none', border: 'none', color: '#ffffff', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0, fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' },
  btnCloseModal: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' },
  modalBody: { padding: '10px', overflowY: 'auto', flex: 1 },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#374151' },
  inputForm: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', color: '#111827' }
};

export default CajaHome;