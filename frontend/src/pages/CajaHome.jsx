import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockCatalog from '../components/StockCatalog';
import { SaleContext } from '../context/SaleContext';
import { AuthContext } from '../context/AuthContext';
import { ProductContext } from '../context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CajaHome = () => {
  const navigate = useNavigate();
  const { sales } = useContext(SaleContext);
  const { user } = useContext(AuthContext);
  const { products, fetchProducts } = useContext(ProductContext);

  // Estados de Modales
  const [showCatalog, setShowCatalog] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showQuickProdModal, setShowQuickProdModal] = useState(false);

  // Estados de Gestión de Caja, Arqueo y Mermas
  const [initialCash, setInitialCash] = useState(localStorage.getItem('mg_initial_cash') || '0');
  const [tempCashInput, setTempCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState(''); // Efectivo real contado al cerrar
  const [selectedWasteProd, setSelectedWasteProd] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [newProd, setNewProd] = useState({ name: '', price: '', cost: '', stock: '', category: 'Panadería' });

  // Verificar si hay fondo de caja guardado al iniciar
  useEffect(() => {
    const savedCash = localStorage.getItem('mg_initial_cash');
    if (!savedCash) {
      setShowAperturaModal(true);
    }
  }, []);

  // Cálculos de Arqueo para el Cierre de Turno
  const totalEfectivoVentas = sales
    ? sales.filter(s => (s.paymentMethod || 'efectivo') === 'efectivo').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const totalDigital = sales
    ? sales.filter(s => s.paymentMethod === 'digital').reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0)
    : 0;

  const fondoInicialNum = parseFloat(initialCash) || 0;
  const efectivoEsperadoEnCaja = fondoInicialNum + totalEfectivoVentas;
  const recaudacionTotalProcesada = totalEfectivoVentas + totalDigital;

  // Cálculo de descuadre en tiempo real
  const efectivoRealNum = parseFloat(actualCashInput) || 0;
  const diferenciaCaja = actualCashInput !== '' ? efectivoRealNum - efectivoEsperadoEnCaja : 0;

  // Confirmar Apertura de Caja
  const handleConfirmApertura = () => {
    const cashVal = parseFloat(tempCashInput) || 0;
    setInitialCash(cashVal.toString());
    localStorage.setItem('mg_initial_cash', cashVal.toString());
    setShowAperturaModal(false);
  };

  // Confirmar Desperdicio / Sobrante
  const handleRegisterWaste = async () => {
    if (!selectedWasteProd || !wasteQty) {
      alert('Por favor seleccione un producto y especifique la cantidad.');
      return;
    }

    const prodObj = products.find(p => (p._id || p.id) === selectedWasteProd);
    try {
      const res = await fetch(`${API_URL}/api/shifts/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedWasteProd,
          productName: prodObj ? prodObj.name : 'Producto',
          quantity: parseFloat(wasteQty),
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
    }
  };

  // Confirmar Alta Exprés de Producto (Proveedor)
  const handleQuickAddProduct = async () => {
    if (!newProd.name || !newProd.price) {
      alert('Nombre y precio de venta son obligatorios.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        alert('📦 Producto dado de alta correctamente.');
        setShowQuickProdModal(false);
        setNewProd({ name: '', price: '', cost: '', stock: '', category: 'Panadería' });
        if (fetchProducts) fetchProducts();
      }
    } catch (e) {
      alert('Error de conexión al dar de alta el producto.');
    }
  };

  // Finalizar Turno con Arqueo Completo
  const handleFinalizarTurno = async () => {
    if (actualCashInput === '') {
      alert('Por favor ingrese el monto de efectivo real contado en la caja.');
      return;
    }

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
      console.warn('Servidor no disponible para guardar el reporte físico del turno, cerrando sesión local.');
    }

    alert(`Turno cerrado exitosamente.\n\nEfectivo Esperado: $${efectivoEsperadoEnCaja.toFixed(2)}\nEfectivo Real: $${efectivoRealNum.toFixed(2)}\nDiferencia: $${diferenciaCaja.toFixed(2)}`);
    localStorage.removeItem('mg_initial_cash');
    setShowCierreModal(false);
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      {/* BARRA SUPERIOR DE CONTEXTO DE CAJA */}
      <div style={styles.topInfoBar}>
        <span>👤 Cajera: <strong>{user?.name || user?.username || 'Caja Activa'}</strong></span>
        <span>💵 Fondo Inicial: <strong>${fondoInicialNum.toFixed(2)}</strong></span>
        <button onClick={() => setShowAperturaModal(true)} style={styles.btnLinkEdit}>Ajustar Fondo</button>
      </div>

      {/* BOTONES PRINCIPALES EN MODO MÓVIL/CIRCULAR */}
      <div style={styles.buttonsGrid}>
        <button style={{ ...styles.btnCircle, ...styles.btnGreen }} onClick={() => navigate('/nuevo-cliente')}>
          + Nuevo cliente
        </button>

        <button style={{ ...styles.btnCircle, ...styles.btnBlue }} onClick={() => setShowCatalog(true)}>
          📦 Ver Stock / Precios
        </button>

        <button style={{ ...styles.btnCircle, ...styles.btnOrange }} onClick={() => setShowWasteModal(true)}>
          🗑️ Registrar Sobrante
        </button>

        <button style={{ ...styles.btnCircle, ...styles.btnSky }} onClick={() => setShowQuickProdModal(true)}>
          📥 Alta Proveedor
        </button>

        <button style={{ ...styles.btnCircle, ...styles.btnYellow }} onClick={() => navigate('/ultimos-movimientos')}>
          Últimos movimientos
        </button>

        <button style={{ ...styles.btnCircle, ...styles.btnRed }} onClick={() => setShowCierreModal(true)}>
          Cerrar turno
        </button>
      </div>

      {/* MODAL APERTURA DE CAJA / FONDO INICIAL */}
      {showAperturaModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>💵 APERTURA DE CAJA</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
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
            <button onClick={handleConfirmApertura} style={styles.btnConfirmarVerde}>
              CONFIRMAR FONDO INICIAL
            </button>
          </div>
        </div>
      )}

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

      {/* MODAL REGISTRAR DESPERDICIO / SOBRANTE */}
      {showWasteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>🗑️ REGISTRAR SOBRANTE / MERMA</h3>
              <button onClick={() => setShowWasteModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Seleccione el producto de panadería que sobró para descontarlo del stock y reportarlo.
            </p>
            <select
              value={selectedWasteProd}
              onChange={(e) => setSelectedWasteProd(e.target.value)}
              style={styles.inputForm}
            >
              <option value="">-- Seleccionar Producto --</option>
              {products.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} (Stock: {p.stock || 0})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cantidad / Kilos a dar de baja"
              value={wasteQty}
              onChange={(e) => setWasteQty(e.target.value)}
              style={styles.inputForm}
            />
            <button onClick={handleRegisterWaste} style={styles.btnConfirmarRojo}>
              CONFIRMAR BAJA POR SOBRANTE
            </button>
          </div>
        </div>
      )}

      {/* MODAL ALTA EXPRÉS PROVEEDORES */}
      {showQuickProdModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>📦 RECEPCIÓN EXPRÉS PROVEEDOR</h3>
              <button onClick={() => setShowQuickProdModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Nombre del producto"
              value={newProd.name}
              onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
              style={styles.inputForm}
            />
            <input
              type="number"
              placeholder="Precio Venta ($)"
              value={newProd.price}
              onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
              style={styles.inputForm}
            />
            <input
              type="number"
              placeholder="Precio Costo ($)"
              value={newProd.cost}
              onChange={(e) => setNewProd({ ...newProd, cost: e.target.value })}
              style={styles.inputForm}
            />
            <input
              type="number"
              placeholder="Cantidad / Stock recibido"
              value={newProd.stock}
              onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
              style={styles.inputForm}
            />
            <button onClick={handleQuickAddProduct} style={styles.btnConfirmarAzul}>
              INGRESAR PRODUCTO AL STOCK
            </button>
          </div>
        </div>
      )}

      {/* MODAL CIERRE DE TURNO Y ARQUEO COMPLETO */}
      {showCierreModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>🔒 ARQUEO Y CIERRE DE TURNO</h3>
              <button onClick={() => setShowCierreModal(false)} style={styles.btnCloseModal}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
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
                <strong style={{ color: '#166534' }}>+ ${totalEfectivoVentas.toFixed(2)}</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Cobros Digitales:</span>
                <strong style={{ color: '#0284c7' }}>${totalDigital.toFixed(2)}</strong>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '4px 0' }} />

              <div style={{ ...styles.resumenRow, backgroundColor: '#f0fdf4', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#166534' }}>EFECTIVO ESPERADO EN CAJA:</span>
                <strong style={{ fontSize: '1.1rem', color: '#166534' }}>${efectivoEsperadoEnCaja.toFixed(2)}</strong>
              </div>

              {/* INPUT PARA INGRESAR EFECTIVO REAL FÍSICO */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  💵 Efectivo Real Contado en Caja ($):
                </label>
                <input
                  type="number"
                  placeholder="Ej. 12500"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  style={{ ...styles.inputForm, border: '2px solid #0284c7', fontSize: '1.05rem', fontWeight: 'bold' }}
                />
              </div>

              {/* INDICADOR DE DESCUADRE / DIFERENCIA */}
              {actualCashInput !== '' && (
                <div style={{
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: diferenciaCaja === 0 ? '#f0fdf4' : diferenciaCaja > 0 ? '#eff6ff' : '#fef2f2',
                  color: diferenciaCaja === 0 ? '#166534' : diferenciaCaja > 0 ? '#1d4ed8' : '#dc2626',
                  border: `1px solid ${diferenciaCaja === 0 ? '#bbf7d0' : diferenciaCaja > 0 ? '#bfdbfe' : '#fecaca'}`
                }}>
                  {diferenciaCaja === 0 && '✅ Caja Cuadrada Perfecta'}
                  {diferenciaCaja > 0 && `🔵 Sobrante en Caja: +$${diferenciaCaja.toFixed(2)}`}
                  {diferenciaCaja < 0 && `⚠️ Faltante en Caja: -$${Math.abs(diferenciaCaja).toFixed(2)}`}
                </div>
              )}
            </div>

            <button onClick={handleFinalizarTurno} style={styles.btnConfirmarCierre}>
              CONFIRMAR Y FINALIZAR TURNO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', gap: '20px', padding: '20px', position: 'relative' },
  topInfoBar: { display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  btnLinkEdit: { background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', padding: 0 },
  buttonsGrid: { display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center', alignItems: 'center', maxWidth: '700px' },
  btnCircle: { borderRadius: '50%', border: 'none', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0px 4px 10px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'transform 0.2s ease, box-shadow 0.2s ease' },
  btnGreen: { backgroundColor: '#2e7d32', width: '150px', height: '150px', fontSize: '1.1rem' },
  btnBlue: { backgroundColor: '#0284c7', width: '150px', height: '150px', fontSize: '1.05rem' },
  btnOrange: { backgroundColor: '#ea580c', width: '140px', height: '140px', fontSize: '0.95rem' },
  btnSky: { backgroundColor: '#0284c7', width: '140px', height: '140px', fontSize: '0.95rem' },
  btnYellow: { backgroundColor: '#f57f17', width: '140px', height: '140px', fontSize: '1rem' },
  btnRed: { backgroundColor: '#c62828', width: '120px', height: '120px', fontSize: '0.9rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: '#f8fafc', width: '100%', maxWidth: '1100px', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: '420px', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0' },
  btnCloseModal: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#334155' },
  inputForm: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  btnConfirmarVerde: { width: '100%', padding: '12px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' },
  btnConfirmarRojo: { width: '100%', padding: '12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' },
  btnConfirmarAzul: { width: '100%', padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' },
  btnConfirmarCierre: { width: '100%', padding: '14px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }
};

export default CajaHome;