import React, { useState, useEffect } from 'react';
import RegistrarIngresoCaja from './RegistrarIngresoCaja';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SuppliersManager = () => {
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'expenses' | 'suppliers' | 'debts'
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Formulario Proveedor
  const [supplierForm, setSupplierForm] = useState({ name: '', cuit: '', phone: '', category: '' });

  // Formulario Egreso / Comprobante
  const [expenseForm, setExpenseForm] = useState({
    supplierId: '',
    description: '',
    amount: '',
    paymentMethod: 'transferencia', // 'efectivo' | 'transferencia' | 'cheque'
    invoiceNumber: '',
    category: 'Materia Prima'
  });

  useEffect(() => {
    fetchSuppliers();
    fetchExpenses();
    fetchPurchases();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/suppliers`);
      if (res.ok) setSuppliers(await res.json());
    } catch (err) {
      console.error('Error cargando proveedores:', err);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/expenses`);
      if (res.ok) setExpenses(await res.json());
    } catch (err) {
      console.error('Error cargando egresos:', err);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${API_URL}/api/purchase-transactions`);
      if (res.ok) setPurchases(await res.json());
    } catch (err) {
      console.error('Error cargando compras:', err);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      });
      if (res.ok) {
        alert('Proveedor registrado correctamente.');
        setSupplierForm({ name: '', cuit: '', phone: '', category: '' });
        fetchSuppliers();
      }
    } catch (err) {
      alert('Error al registrar proveedor');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        alert('Egreso / Factura registrada con éxito.');
        setExpenseForm({ supplierId: '', description: '', amount: '', paymentMethod: 'transferencia', invoiceNumber: '', category: 'Materia Prima' });
        fetchExpenses();
        fetchPurchases();
      }
    } catch (err) {
      alert('Error al registrar el egreso');
    }
  };

  // Marcar una compra "A Cuenta" como pagada
  const handleMarkAsPaid = async (purchaseId) => {
    if (!window.confirm('¿Confirmas que este remito/compra fue abonado?')) return;
    try {
      const res = await fetch(`${API_URL}/api/purchase-transactions/${purchaseId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('Ingreso marcado como pagado.');
        fetchPurchases();
      }
    } catch (err) {
      alert('Error al actualizar el estado de pago');
    }
  };

  // Agrupación de saldos pendientes por proveedor
  const getSupplierDebts = () => {
    const summary = {};

    purchases.forEach((p) => {
      const supName = p.supplierName || 'Proveedor General';
      if (!summary[supName]) {
        summary[supName] = { totalPurchased: 0, totalPending: 0, pendingCount: 0 };
      }
      summary[supName].totalPurchased += p.totalAmount || 0;

      if (p.paymentMethod === 'Pendiente' || p.isPaid === false) {
        summary[supName].totalPending += p.totalAmount || 0;
        summary[supName].pendingCount += 1;
      }
    });

    return Object.keys(summary).map((key) => ({
      name: key,
      ...summary[key]
    }));
  };

  const supplierDebts = getSupplierDebts();
  const totalDebtAll = supplierDebts.reduce((acc, curr) => acc + curr.totalPending, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Selector SubPestañas */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('expenses')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSubTab === 'expenses' ? '#0f2337' : '#cbd5e1',
            color: activeSubTab === 'expenses' ? '#fff' : '#1e293b',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🧾 Facturas y Gastos
        </button>
        <button
          onClick={() => setActiveSubTab('debts')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSubTab === 'debts' ? '#0f2337' : '#cbd5e1',
            color: activeSubTab === 'debts' ? '#fff' : '#1e293b',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📊 Cuentas Corrientes / Deudas {totalDebtAll > 0 && `($${totalDebtAll.toFixed(2)})`}
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSubTab === 'suppliers' ? '#0f2337' : '#cbd5e1',
            color: activeSubTab === 'suppliers' ? '#fff' : '#1e293b',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🏭 Alta de Proveedores
        </button>
      </div>

      {activeSubTab === 'debts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tarjeta Resumen General */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>RESUMEN DE DEUDAS POR PROVEEDOR</h2>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Proveedor</th>
                  <th style={styles.th}>Comprobantes Pendientes</th>
                  <th style={styles.th}>Total Comprado ($)</th>
                  <th style={styles.th}>Deuda Acumulada ($)</th>
                </tr>
              </thead>
              <tbody>
                {supplierDebts.map((s, idx) => (
                  <tr key={idx} style={styles.trBody}>
                    <td style={styles.td}><strong>{s.name}</strong></td>
                    <td style={styles.td}>{s.pendingCount} remitos</td>
                    <td style={styles.td}>${s.totalPurchased.toFixed(2)}</td>
                    <td style={{ ...styles.td, color: s.totalPending > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                      ${s.totalPending.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historial Individual de Ingresos Pendientes / A Cuenta */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>DETALLE DE INGRESOS A CUENTA (PENDIENTES DE PAGO)</h2>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Proveedor</th>
                  <th style={styles.th}>N° Remito / Factura</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Monto Total ($)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases
                  .filter((p) => p.paymentMethod === 'Pendiente' || p.isPaid === false)
                  .map((p) => (
                    <tr key={p._id || p.id} style={styles.trBody}>
                      <td style={styles.td}>{new Date(p.createdAt || Date.now()).toLocaleDateString('es-AR')}</td>
                      <td style={styles.td}><strong>{p.supplierName}</strong></td>
                      <td style={styles.td}>{p.invoiceNumber || '-'}</td>
                      <td style={{ ...styles.td, color: '#d97706', fontWeight: 'bold' }}>⏳ A Cuenta</td>
                      <td style={{ ...styles.td, color: '#dc2626', fontWeight: 'bold' }}>
                        ${parseFloat(p.totalAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setEditingTransaction(p)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(p._id || p.id)}
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#fff',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓ Marcar Pagado
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'suppliers' ? (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>REGISTRAR NUEVO PROVEEDOR</h2>
          <form onSubmit={handleAddSupplier} style={styles.formGrid}>
            <input
              type="text"
              placeholder="Razón Social / Nombre"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="CUIT"
              value={supplierForm.cuit}
              onChange={(e) => setSupplierForm({ ...supplierForm, cuit: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Teléfono / Contacto"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Rubro (ej: Harinas, Lácteos, Envases)"
              value={supplierForm.category}
              onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
              style={styles.input}
            />
            <button type="submit" style={styles.btnPrimary}>Guardar Proveedor</button>
          </form>

          <h2 style={{ ...styles.cardTitle, marginTop: '20px' }}>PROVEEDORES REGISTRADOS</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>CUIT</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Rubro</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((sup) => (
                <tr key={sup._id || sup.id} style={styles.trBody}>
                  <td style={styles.td}><strong>{sup.name}</strong></td>
                  <td style={styles.td}>{sup.cuit || '-'}</td>
                  <td style={styles.td}>{sup.phone || '-'}</td>
                  <td style={styles.td}>{sup.category || 'General'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>CARGAR COMPROBANTE / PAGO A PROVEEDOR O GASTO</h2>
          <form onSubmit={handleAddExpense} style={styles.formGrid}>
            <select
              value={expenseForm.supplierId}
              onChange={(e) => setExpenseForm({ ...expenseForm, supplierId: e.target.value })}
              style={styles.input}
            >
              <option value="">-- Seleccionar Proveedor (Opcional) --</option>
              {suppliers.map((s) => (
                <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              style={styles.input}
            >
              <option value="Materia Prima">Materia Prima</option>
              <option value="Servicios">Servicios (Luz, Gas, Agua)</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Sueldos">Sueldos</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Otros">Otros</option>
            </select>

            <input
              type="text"
              placeholder="N° de Factura / Remito"
              value={expenseForm.invoiceNumber}
              onChange={(e) => setExpenseForm({ ...expenseForm, invoiceNumber: e.target.value })}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Descripción / Detalle"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              required
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Monto ($)"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
              style={styles.input}
            />

            <select
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              style={styles.input}
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo </option>
            </select>

            <button type="submit" style={styles.btnPrimary}>Asentar Egreso</button>
          </form>

          <h2 style={{ ...styles.cardTitle, marginTop: '20px' }}>HISTORIAL DE INGRESOS Y COMPRAS DE MERCADERÍA</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>N° Comprobante</th>
                <th style={styles.th}>Medio Pago</th>
                <th style={styles.th}>Monto Total ($)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p._id || p.id} style={styles.trBody}>
                  <td style={styles.td}>{new Date(p.createdAt || Date.now()).toLocaleDateString('es-AR')}</td>
                  <td style={styles.td}><strong>{p.supplierName}</strong></td>
                  <td style={styles.td}>{p.invoiceNumber || '-'}</td>
                  <td style={styles.td}>{p.paymentMethod}</td>
                  <td style={{ ...styles.td, color: '#dc2626', fontWeight: 'bold' }}>
                    -${parseFloat(p.totalAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button
                      onClick={() => setEditingTransaction(p)}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingTransaction && (
        <RegistrarIngresoCaja
          transactionToEdit={editingTransaction}
          onClose={() => {
            setEditingTransaction(null);
            fetchPurchases();
          }}
        />
      )}
    </div>
  );
};

const styles = {
  card: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0f172a' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  btnPrimary: { backgroundColor: '#166534', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.8rem' },
  trHead: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '8px', textAlign: 'left', color: '#475569', fontWeight: '600' },
  trBody: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px', color: '#334155' }
};

export default SuppliersManager;