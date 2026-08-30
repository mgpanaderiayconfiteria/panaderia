import React, { useState, useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RegistrarIngresoCaja = ({ onClose }) => {
  const { products, fetchProducts } = useContext(ProductContext);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Lista dinámica de renglones/productos
  const [items, setItems] = useState([
    { productId: '', quantity: '', unitCost: '', subtotal: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar lista de proveedores al iniciar
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/suppliers`);
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data);
        }
      } catch (err) {
        console.error("Error al cargar proveedores:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // Agregar un nuevo renglón de producto
  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: '', unitCost: '', subtotal: 0 }]);
  };

  // Eliminar un renglón
  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Manejar cambio de valores en cada renglón
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    const qty = parseFloat(updated[index].quantity) || 0;
    const cost = parseFloat(updated[index].unitCost) || 0;
    updated[index].subtotal = qty * cost;

    setItems(updated);
  };

  // Calcular total pagado general
  const totalAmount = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setErrorMsg('Selecciona un proveedor.');
      return;
    }

    const supplierObj = suppliers.find(s => s._id === selectedSupplierId);

    // Formatear array de ítems con datos completos del producto
    const formattedItems = [];
    for (const item of items) {
      const prod = products.find(p => p._id === item.productId);
      if (!prod || !item.quantity || !item.unitCost) {
        setErrorMsg('Por favor completa todos los renglones de productos.');
        return;
      }

      formattedItems.push({
        product: prod._id,
        productName: prod.name,
        category: prod.category,
        subcategory: prod.subcategory || '',
        sellType: prod.allowByWeight ? 'peso' : 'unidad',
        quantity: parseFloat(item.quantity),
        unitCost: parseFloat(item.unitCost),
        subtotal: item.subtotal
      });
    }

    setLoading(true);
    setErrorMsg('');

    const payload = {
      supplierId: selectedSupplierId,
      supplierName: supplierObj?.name || supplierObj?.companyName || 'Proveedor',
      items: formattedItems,
      totalAmount,
      invoiceNumber,
      notes
    };

    try {
      const res = await fetch(`${API_URL}/api/purchase-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al guardar la entrada');
      }

      await fetchProducts(); // Refrescar stock general
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3>📦 Ingreso Múltiple de Productos / Proveedor</h3>
          <button onClick={onClose} style={styles.btnClose}>✕</button>
        </div>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Cabecera del Comprobante */}
          <div style={styles.row}>
            <label style={styles.label}>
              Proveedor:
              <select 
                value={selectedSupplierId} 
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                required
                style={styles.input}
              >
                <option value="">-- Seleccionar --</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name || s.companyName || s.razonSocial}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              N° Remito / Factura:
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ej: 0001-000452"
                style={styles.input}
              />
            </label>
          </div>

          {/* Lista de productos ingresados */}
          <div style={styles.itemsContainer}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Productos a ingresar:</span>
            {items.map((item, index) => {
              const selectedProd = products.find(p => p._id === item.productId);
              return (
                <div key={index} style={styles.itemRow}>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    required
                    style={{ ...styles.input, flex: 2 }}
                  >
                    <option value="">-- Producto --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder={selectedProd?.allowByWeight ? 'Gramos' : 'Cant'}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    style={{ ...styles.input, flex: 1 }}
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Costo u."
                    value={item.unitCost}
                    onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                    required
                    style={{ ...styles.input, flex: 1 }}
                  />

                  <div style={styles.subtotalText}>
                    ${item.subtotal.toFixed(2)}
                  </div>

                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} style={styles.btnDelete}>
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}

            <button type="button" onClick={handleAddItem} style={styles.btnAddItem}>
              ➕ Agregar otro producto
            </button>
          </div>

          <label style={styles.label}>
            Observaciones:
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Pago en efectivo desde la caja chica"
              style={styles.input}
            />
          </label>

          {/* Total del Pago */}
          <div style={styles.totalBox}>
            <span>TOTAL SALIDA DE CAJA:</span>
            <strong>${totalAmount.toFixed(2)}</strong>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? 'Procesando...' : 'Confirmar e Incrementar Stocks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 },
  modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '650px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  btnClose: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  itemsContainer: { display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  itemRow: { display: 'flex', gap: '6px', alignItems: 'center' },
  subtotalText: { minWidth: '70px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  btnAddItem: { alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' },
  btnDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  totalBox: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '1rem', color: '#0f172a' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  btnCancel: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' },
  btnSubmit: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  error: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '10px' }
};

export default RegistrarIngresoCaja;