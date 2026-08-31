import React, { useState, useEffect, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RegistrarIngresoCaja = ({ onClose, transactionToEdit = null }) => {
  const { products, fetchProducts } = useContext(ProductContext);

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Opciones: 'Efectivo', 'Transferencia' o 'Pendiente'
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  const [items, setItems] = useState([
    { productId: '', quantity: '', unitCost: '', subtotal: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  useEffect(() => {
    if (transactionToEdit) {
      setSelectedSupplierId(transactionToEdit.supplierId || transactionToEdit.supplier || '');
      setInvoiceNumber(transactionToEdit.invoiceNumber || '');
      setPaymentMethod(transactionToEdit.paymentMethod || 'Efectivo');

      if (Array.isArray(transactionToEdit.items) && transactionToEdit.items.length > 0) {
        const initialItems = transactionToEdit.items.map((item) => {
          const pId = item.product?._id || item.product || item.productId || '';
          const prod = products.find(p => p._id === pId);
          const qtyVal = item.quantity || 0;
          const costVal = item.unitCost || 0;
          const displayQty = (prod && prod.allowByWeight) ? (qtyVal * 1000).toString() : qtyVal.toString();

          return {
            productId: pId,
            quantity: displayQty,
            unitCost: costVal.toString(),
            subtotal: calculateSubtotal(prod, displayQty, costVal)
          };
        });
        setItems(initialItems);
      }
    }
  }, [transactionToEdit, products]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: '', unitCost: '', subtotal: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const calculateSubtotal = (prod, qtyVal, costVal) => {
    const qty = parseFloat(qtyVal) || 0;
    const cost = parseFloat(costVal) || 0;

    if (!prod) return qty * cost;

    if (prod.allowByWeight) {
      return (qty / 1000) * cost;
    }

    return qty * cost;
  };

  const handleProductSelect = (index, productId) => {
    const updated = [...items];
    const selectedProd = products.find(p => p._id === productId);

    updated[index].productId = productId;

    if (selectedProd) {
      const baseCost = selectedProd.costPrice ?? selectedProd.cost ?? selectedProd.price ?? 0;
      updated[index].unitCost = baseCost > 0 ? baseCost.toString() : '';
      updated[index].subtotal = calculateSubtotal(selectedProd, updated[index].quantity, baseCost);
    } else {
      updated[index].unitCost = '';
      updated[index].subtotal = 0;
    }

    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    const selectedProd = products.find(p => p._id === updated[index].productId);
    updated[index].subtotal = calculateSubtotal(
      selectedProd,
      updated[index].quantity,
      updated[index].unitCost
    );

    setItems(updated);
  };

  const totalAmount = items.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setErrorMsg('Selecciona un proveedor.');
      return;
    }

    const supplierObj = suppliers.find(s => s._id === selectedSupplierId);

    const formattedItems = [];
    for (const item of items) {
      const prod = products.find(p => p._id === item.productId);
      if (!prod || !item.quantity || !item.unitCost) {
        setErrorMsg('Por favor completa todos los renglones de productos.');
        return;
      }

      const rawQty = parseFloat(item.quantity);
      const finalQuantity = prod.allowByWeight ? rawQty / 1000 : rawQty;

      formattedItems.push({
        product: prod._id,
        productName: prod.name,
        category: prod.category,
        subcategory: prod.subcategory || '',
        sellType: prod.allowByWeight ? 'peso' : 'unidad',
        quantity: finalQuantity,
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
      paymentMethod, // 'Efectivo', 'Transferencia' o 'Pendiente'
      isPaid: paymentMethod !== 'Pendiente', // Ayuda al backend a saber si hubo movimiento de dinero
      notes: paymentMethod === 'Pendiente' ? 'Entrega recibida - Pago pendiente' : `Pago mediante ${paymentMethod}`
    };

    try {
      const isEdit = !!transactionToEdit;
      const targetUrl = isEdit
        ? `${API_URL}/api/purchase-transactions/${transactionToEdit._id || transactionToEdit.id}`
        : `${API_URL}/api/purchase-transactions`;
      const targetMethod = isEdit ? 'PUT' : 'POST';

      const res = await fetch(targetUrl, {
        method: targetMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al guardar la entrada');
      }

      await fetchProducts();
      onClose();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <style>{`
        .modal-responsive {
          background-color: #fff;
          padding: 16px;
          border-radius: 12px;
          width: 95%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          box-sizing: border-box;
        }

        .header-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .item-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          margin-bottom: 10px;
        }

        .inputs-group {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 8px;
          align-items: center;
        }

        .payment-toggle {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .btn-payment {
          flex: 1;
          min-width: 100px;
          padding: 10px 8px;
          border-radius: 8px;
          border: 2px solid #cbd5e1;
          background-color: #f1f5f9;
          color: #475569;
          font-weight: bold;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .btn-payment.active-efectivo {
          background-color: #16a34a;
          border-color: #15803d;
          color: #ffffff;
        }

        .btn-payment.active-transferencia {
          background-color: #2563eb;
          border-color: #1d4ed8;
          color: #ffffff;
        }

        .btn-payment.active-pendiente {
          background-color: #d97706;
          border-color: #b45309;
          color: #ffffff;
        }

        @media (min-width: 550px) {
          .header-row {
            grid-template-columns: 1fr 1fr;
          }
          .item-row {
            grid-template-columns: 2fr 2.5fr;
            align-items: center;
          }
        }
      `}</style>

      <div className="modal-responsive">
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
            {transactionToEdit ? '✏️ EDITAR INGRESO / COMPRA' : '📦 INGRESO MÚLTIPLE DE PRODUCTOS / PROVEEDOR'}
          </h3>
          <button onClick={onClose} style={styles.btnClose}>✕</button>
        </div>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="header-row">
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

          <div style={styles.itemsContainer}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Productos a ingresar:</span>
            {items.map((item, index) => {
              const selectedProd = products.find(p => p._id === item.productId);
              return (
                <div key={index} className="item-row">
                  <div>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="">-- Producto --</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.allowByWeight ? '(Por Peso/Kg)' : '(Por Unidad)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="inputs-group">
                    <div>
                      <input
                        type="number"
                        placeholder={selectedProd?.allowByWeight ? 'Gramos' : 'Cant'}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        style={styles.input}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {selectedProd?.allowByWeight ? 'Ej: 5000 gr' : 'Unidades'}
                      </span>
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Costo Nuevo"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        required
                        style={{ ...styles.input, fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {selectedProd?.allowByWeight ? '$ / Kg' : '$ / Unid'}
                      </span>
                    </div>

                    <div style={styles.subtotalText}>
                      ${item.subtotal.toFixed(2)}
                    </div>

                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} style={styles.btnDelete}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <button type="button" onClick={handleAddItem} style={styles.btnAddItem}>
              ➕ Agregar otro producto
            </button>
          </div>

          {/* Opciones de Estado de Pago */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
              Estado del Pago:
            </span>
            <div className="payment-toggle">
              <button
                type="button"
                className={`btn-payment ${paymentMethod === 'Efectivo' ? 'active-efectivo' : ''}`}
                onClick={() => setPaymentMethod('Efectivo')}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                className={`btn-payment ${paymentMethod === 'Transferencia' ? 'active-transferencia' : ''}`}
                onClick={() => setPaymentMethod('Transferencia')}
              >
                💳 Transferencia
              </button>
              <button
                type="button"
                className={`btn-payment ${paymentMethod === 'Pendiente' ? 'active-pendiente' : ''}`}
                onClick={() => setPaymentMethod('Pendiente')}
              >
                ⏳ A Cuenta (Pendiente)
              </button>
            </div>
          </div>

          <div style={styles.totalBox}>
            <span>TOTAL VALORIZADO:</span>
            <strong>${totalAmount.toFixed(2)}</strong>
          </div>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? 'Procesando...' : (transactionToEdit ? 'Guardar Cambios' : 'Confirmar e Incrementar Stocks')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500, padding: '10px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  btnClose: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  itemsContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  subtotalText: { minWidth: '65px', textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem', color: '#0f172a' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' },
  btnAddItem: { alignSelf: 'flex-start', padding: '8px 12px', fontSize: '0.8rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '4px', fontWeight: 'bold' },
  btnDelete: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' },
  totalBox: { display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.95rem', color: '#0f172a' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', flexWrap: 'wrap' },
  btnCancel: { padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', flex: '1' },
  btnSubmit: { padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 'bold', cursor: 'pointer', flex: '2' },
  error: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '10px' }
};

export default RegistrarIngresoCaja;