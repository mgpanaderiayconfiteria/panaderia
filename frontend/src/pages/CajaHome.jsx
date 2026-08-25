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
  const { user, logout } = useContext(AuthContext);
  const { products, fetchProducts, addProduct } = useContext(ProductContext);

  const [showCatalog, setShowCatalog] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showAperturaModal, setShowAperturaModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showQuickProdModal, setShowQuickProdModal] = useState(false);

  const [initialCash, setInitialCash] = useState(localStorage.getItem('mg_initial_cash') || '0');
  const [tempCashInput, setTempCashInput] = useState('');
  const [actualCashInput, setActualCashInput] = useState('');
  const [selectedWasteProd, setSelectedWasteProd] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  
  const [newProd, setNewProd] = useState({ 
    name: '', price: '', cost: '', stock: '', category: 'Panadería', sellType: 'unidad' 
  });

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

  const handleQuickAddProduct = async () => {
    if (!newProd.name || !newProd.price) {
      alert('Nombre y precio de venta son obligatorios.');
      return;
    }

    const priceNum = parseFloat(newProd.price) || 0;
    const stockNum = parseFloat(newProd.stock) || 0;
    const costNum = parseFloat(newProd.cost) || 0;

    const payload = {
      name: newProd.name.trim(),
      category: newProd.category,
      cogs: costNum,
      sellType: newProd.sellType,
      allowByUnit: newProd.sellType === 'unidad',
      allowByWeight: newProd.sellType === 'peso',
      allowByPorcion: newProd.sellType === 'porcion',
      priceUnit: newProd.sellType === 'unidad' ? priceNum : 0,
      priceKg: newProd.sellType === 'peso' ? priceNum : 0,
      pricePorcion: newProd.sellType === 'porcion' ? priceNum : 0,
      price: priceNum,
      stockUnits: newProd.sellType === 'unidad' ? stockNum : 0,
      stockGrams: newProd.sellType === 'peso' ? stockNum : 0,
      stockPorciones: newProd.sellType === 'porcion' ? stockNum : 0,
      stock: stockNum
    };

    const saved = await addProduct(payload);
    if (saved) {
      alert('📦 Producto dado de alta e incorporado al catálogo.');
      setShowQuickProdModal(false);
      setNewProd({ name: '', price: '', cost: '', stock: '', category: 'Panadería', sellType: 'unidad' });
    }
  };

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
      console.warn('Servidor no disponible para guardar el reporte físico del turno.');
    }

    alert(`Turno cerrado exitosamente.\n\nEfectivo Esperado: $${efectivoEsperadoEnCaja.toFixed(2)}\nEfectivo Real: $${efectivoRealNum.toFixed(2)}\nDiferencia: $${diferenciaCaja.toFixed(2)}`);
    
    // Limpia variables de la sesión local
    localStorage.removeItem('mg_initial_cash');
    setShowCierreModal(false);

    // Ejecuta deslogueo y manda a la pantalla de entrada
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
          background-color: #f8fafc;
        }

        .top-info-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          align-items: center;
          justify-content: center;
          background-color: #ffffff;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          color: #334155;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 16px;
          width: 100%;
          max-width: 800px;
          box-sizing: border-box;
        }

        .buttons-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
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
          max-width: 120px;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          border: none;
          color: #ffffff;
          font-weight: bold;
          font-size: clamp(0.75rem, 2.8vw, 1rem);
          cursor: pointer;
          box-shadow: 0px 4px 10px rgba(0,0,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          user-select: none;
        }

        .btn-circle:active {
          transform: scale(0.95);
        }

        .btn-green { background-color: #2e7d32; }
        .btn-blue { background-color: #0284c7; }
        .btn-orange { background-color: #ea580c; }
        .btn-sky { background-color: #0369a1; }
        .btn-yellow { background-color: #d97706; }
        .btn-red { background-color: #c62828; }

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
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);
          box-sizing: border-box;
        }

        .modal-content-large {
          background-color: #f8fafc;
          width: 95%;
          max-width: 1100px;
          height: 90dvh;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);
          overflow: hidden;
        }
      `}</style>

      {/* BARRA SUPERIOR DE CONTEXTO DE CAJA */}
      <div className="top-info-bar">
        <span>👤 Cajera: <strong>{user?.name || user?.username || 'Caja Activa'}</strong></span>
        <span>💵 Fondo Inicial: <strong>${fondoInicialNum.toFixed(2)}</strong></span>
        <button onClick={() => setShowAperturaModal(true)} style={styles.btnLinkEdit}>Ajustar Fondo</button>
      </div>

      {/* BOTONES PRINCIPALES */}
      <div className="buttons-grid">
        <button className="btn-circle btn-green" onClick={() => navigate('/nuevo-cliente')}>
          + Nuevo cliente
        </button>

        <button className="btn-circle btn-blue" onClick={() => setShowCatalog(true)}>
          📦 Ver Stock / Precios
        </button>

        <button className="btn-circle btn-orange" onClick={() => setShowWasteModal(true)}>
          🗑️ Registrar Sobrante
        </button>

        <button className="btn-circle btn-sky" onClick={() => setShowQuickProdModal(true)}>
          📥 Alta Proveedor
        </button>

        <button className="btn-circle btn-yellow" onClick={() => navigate('/ultimos-movimientos')}>
          Últimos movimientos
        </button>

        <button className="btn-circle btn-red" onClick={() => setShowCierreModal(true)}>
          Cerrar turno
        </button>
      </div>

      {/* MODAL APERTURA DE CAJA */}
      {showAperturaModal && (
        <div style={styles.modalOverlay}>
          <div className="modal-card">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>💵 APERTURA DE CAJA</h3>
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
          <div className="modal-content-large">
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>CONSULTA DE STOCK Y PRECIOS</h2>
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
          <div className="modal-card">
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <select
                value={newProd.category}
                onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                style={styles.inputForm}
              >
                <option value="Panadería">Panadería</option>
                <option value="Facturería">Facturería</option>
                <option value="Repostería">Repostería</option>
                <option value="Cafetería">Cafetería</option>
                <option value="Especialidades">Especialidades</option>
              </select>

              <select
                value={newProd.sellType}
                onChange={(e) => setNewProd({ ...newProd, sellType: e.target.value })}
                style={styles.inputForm}
              >
                <option value="unidad">Por Unidad</option>
                <option value="peso">Por Peso (Kg/Gr)</option>
                <option value="porcion">Por Porción</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                placeholder="Precio Venta ($)"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                style={styles.inputForm}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Costo COGS ($)"
                value={newProd.cost}
                onChange={(e) => setNewProd({ ...newProd, cost: e.target.value })}
                style={styles.inputForm}
              />
            </div>

            <input
              type="number"
              placeholder={`Stock Inicial (${newProd.sellType === 'peso' ? 'Gramos' : 'Unidades'})`}
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

      {/* MODAL CIERRE DE TURNO */}
      {showCierreModal && (
        <div style={styles.modalOverlay}>
          <div className="modal-card">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>🔒 ARQUEO Y CIERRE DE TURNO</h3>
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
                <strong style={{ color: '#166534' }}>+ ${totalEfectivoVentas.toFixed(2)}</strong>
              </div>
              <div style={styles.resumenRow}>
                <span>Cobros Digitales:</span>
                <strong style={{ color: '#0284c7' }}>${totalDigital.toFixed(2)}</strong>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '4px 0' }} />

              <div style={{ ...styles.resumenRow, backgroundColor: '#f0fdf4', padding: '6px 8px', borderRadius: '6px' }}>
                <span style={{ fontWeight: 'bold', color: '#166534' }}>EFECTIVO ESPERADO EN CAJA:</span>
                <strong style={{ fontSize: '1rem', color: '#166534' }}>${efectivoEsperadoEnCaja.toFixed(2)}</strong>
              </div>

              <div style={{ marginTop: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', display: 'block', marginBottom: '4px' }}>
                  💵 Efectivo Real Contado en Caja ($):
                </label>
                <input
                  type="number"
                  placeholder="Ej. 12500"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  style={{ ...styles.inputForm, border: '2px solid #0284c7', fontSize: '1rem', fontWeight: 'bold' }}
                />
              </div>

              {actualCashInput !== '' && (
                <div style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
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
  btnLinkEdit: { background: 'none', border: 'none', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', padding: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '12px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0' },
  btnCloseModal: { backgroundColor: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' },
  modalBody: { padding: '10px', overflowY: 'auto', flex: 1 },
  resumenRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#334155' },
  inputForm: { padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  btnConfirmarVerde: { width: '100%', padding: '10px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  btnConfirmarRojo: { width: '100%', padding: '10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  btnConfirmarAzul: { width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  btnConfirmarCierre: { width: '100%', padding: '12px', backgroundColor: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }
};

export default CajaHome;