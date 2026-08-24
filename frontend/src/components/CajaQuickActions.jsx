import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CajaQuickActions = ({ employeeName, onStockUpdated }) => {
  const [products, setProducts] = useState([]);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Formulario Desperdicio
  const [selectedProdId, setSelectedProdId] = useState('');
  const [wasteQty, setWasteQty] = useState('');

  // Formulario Alta Exprés Producto (Proveedor)
  const [newProd, setNewProd] = useState({ name: '', price: '', cost: '', stock: '', category: 'Panadería' });

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  }, []);

  const handleRegisterWaste = async () => {
    if (!selectedProdId || !wasteQty) return;
    try {
      const res = await fetch(`${API_URL}/api/shifts/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProdId,
          quantity: wasteQty,
          employee: employeeName,
          reason: 'Sobrante del día de panadería'
        })
      });
      if (res.ok) {
        alert('✅ Desperdicio registrado e impactado en el Log del Administrador.');
        setShowWasteModal(false);
        setWasteQty('');
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      alert('Error al registrar desperdicio');
    }
  };

  const handleQuickAddProduct = async () => {
    if (!newProd.name || !newProd.price) return;
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      if (res.ok) {
        alert('📦 Producto ingresado correctamente al sistema');
        setShowProductModal(false);
        setNewProd({ name: '', price: '', cost: '', stock: '', category: 'Panadería' });
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      alert('Error al dar de alta el producto');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', margin: '12px 0' }}>
      <button onClick={() => setShowWasteModal(true)} style={styles.btnWaste}>
        🗑️ Registrar Sobrante / Desperdicio
      </button>
      <button onClick={() => setShowProductModal(true)} style={styles.btnAdd}>
        📦 Alta Exprés (Recepción Proveedor)
      </button>

      {/* MODAL REGISTRO DE DESPERDICIO */}
      {showWasteModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>🗑️ Registrar Sobrante del Día</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Seleccione los productos que no se vendieron y deben retirarse del stock.
            </p>
            <select value={selectedProdId} onChange={e => setSelectedProdId(e.target.value)} style={styles.input}>
              <option value="">-- Seleccionar Producto --</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock || 0})</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Cantidad / Unidades / Gramos a descartar"
              value={wasteQty}
              onChange={e => setWasteQty(e.target.value)}
              style={styles.input}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowWasteModal(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={handleRegisterWaste} style={styles.btnConfirm}>Confirmar Baja</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA EXPRÉS PRODUCTO */}
      {showProductModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3>📦 Alta Rápida de Producto / Mercadería</h3>
            <input type="text" placeholder="Nombre del producto" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} style={styles.input} />
            <input type="number" placeholder="Precio de Venta ($)" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} style={styles.input} />
            <input type="number" placeholder="Precio de Costo ($)" value={newProd.cost} onChange={e => setNewProd({...newProd, cost: e.target.value})} style={styles.input} />
            <input type="number" placeholder="Cantidad / Stock Ingresado" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: e.target.value})} style={styles.input} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowProductModal(false)} style={styles.btnCancel}>Cancelar</button>
              <button onClick={handleQuickAddProduct} style={styles.btnConfirm}>Guardar Producto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  btnWaste: { padding: '10px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnAdd: { padding: '10px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
  modal: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' },
  btnCancel: { flex: 1, padding: '10px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnConfirm: { flex: 1, padding: '10px', backgroundColor: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
};

export default CajaQuickActions;