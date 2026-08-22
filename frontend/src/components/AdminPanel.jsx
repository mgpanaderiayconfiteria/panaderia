import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';
import UsersManager from '../components/UsersManager';

const AdminPanel = () => {
  const { products, addProduct } = useContext(ProductContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Panadería',
    price: '',
    cogs: '',
    stock: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    addProduct({
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      cogs: parseFloat(formData.cogs || 0),
      stock: parseInt(formData.stock || 0, 10)
    });

    setFormData({ name: '', category: 'Panadería', price: '', cogs: '', stock: '' });
  };

  // Cálculos dinámicos limpios sobre datos reales
  const totalEarnings = products.reduce((acc, p) => acc + (p.price * (p.salesCount || 0)), 0);

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <nav style={styles.topNav}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>MG</div>
          <span 
            style={{ ...styles.navLink, ...(activeTab === 'dashboard' ? styles.navLinkActive : {}) }}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </span>
          <span 
            style={{ ...styles.navLink, ...(activeTab === 'users' ? styles.navLinkActive : {}) }}
            onClick={() => setActiveTab('users')}
          >
            Gestión de Usuarios
          </span>
        </div>
        <div style={styles.navRight}>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>MG</div>
            <span>Administrador ▾</span>
          </div>
        </div>
      </nav>

      {/* Vista de Gestión de Usuarios */}
      {activeTab === 'users' && (
        <main style={styles.mainContent}>
          <UsersManager />
        </main>
      )}

      {/* Vista principal de Dashboard limpia */}
      {activeTab === 'dashboard' && (
        <main style={styles.mainContent}>
          <div style={styles.headerRow}>
            <h1 style={styles.pageTitle}>PANEL DE CONTROL MG PANADERÍA</h1>
            <div style={styles.dateSelector}>
              <span style={styles.dateButton}>📅 Hoy</span>
              <span style={styles.dateText}>{new Date().toLocaleDateString('es-AR')}</span>
            </div>
          </div>

          <div style={styles.topGrid}>
            {/* Daily Earnings Overview */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>RESUMEN DE VENTAS DIARIAS</h2>
              </div>
              <div style={styles.chartWrapper}>
                <div style={styles.tooltipBox}>
                  Total de Hoy: <strong>${totalEarnings.toFixed(2)}</strong>
                </div>
              </div>
              <div style={styles.subChartSection}>
                <div style={styles.subChartTitle}>Ventas por Turno</div>
                <div style={styles.subChartRow}>
                  <div>
                    <div style={styles.shiftValue}>$0.00</div>
                    <div style={styles.shiftLabel}>Turno Mañana</div>
                  </div>
                  <div>
                    <div style={styles.shiftValue}>$0.00</div>
                    <div style={styles.shiftLabel}>Turno Tarde</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Breakdown by Product */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>VENTAS POR CATEGORÍA</h2>
              <div style={styles.donutGrid}>
                <div style={styles.topProductsTable}>
                  <div style={styles.topProdHeader}><span>Producto Top</span><span>Vendidos</span></div>
                  {products.length === 0 ? (
                    <div style={styles.emptyRow}>Sin ventas registradas</div>
                  ) : (
                    products.slice(0, 5).map((p, idx) => (
                      <div key={p.id || idx} style={styles.topProdRow}>
                        <span>{idx + 1}. {p.name}</span>
                        <strong>{p.salesCount || 0}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Trends & Alerts Sidebar */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>ALERTAS DE STOCK</h2>
              <div style={styles.sidebarSection}>
                {products.filter(p => p.stock <= 5).length === 0 ? (
                  <div style={styles.badgeGray}>Stock normal en todos los productos</div>
                ) : (
                  products.filter(p => p.stock <= 5).map(p => (
                    <div key={p.id} style={styles.badgeGray}>
                      {p.name}: <span style={{ color: '#dc2626' }}>STOCK BAJO ({p.stock})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Formulario de Alta de Producto */}
          <div style={{ ...styles.card, marginBottom: '20px' }}>
            <h2 style={styles.cardTitle}>ALTA DE NUEVO PRODUCTO</h2>
            <form onSubmit={handleSubmit} style={styles.formRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre Producto</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Medialuna" style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Categoría</label>
                <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                  <option value="Panadería">Panadería</option>
                  <option value="Facturería">Facturería</option>
                  <option value="Repostería">Repostería</option>
                  <option value="Cafetería">Cafetería</option>
                  <option value="Especialidades">Especialidades</option>
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Precio Venta ($)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" style={styles.input} required />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Costo COGS ($)</label>
                <input type="number" name="cogs" value={formData.cogs} onChange={handleChange} placeholder="0.00" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Stock Inicial</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="0" style={styles.input} />
              </div>
              <button type="submit" style={styles.btnSubmit}>Cargar Producto</button>
            </form>
          </div>

          {/* Tabla de análisis de rentabilidad limpia */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ANÁLISIS DE RENTABILIDAD DE PRODUCTOS</h2>
            {products.length === 0 ? (
              <p style={styles.emptyText}>No hay productos registrados en el catálogo.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Unidades Vendidas</th>
                    <th style={styles.th}>Ingresos</th>
                    <th style={styles.th}>Costo (COGS)</th>
                    <th style={styles.th}>Margen (%)</th>
                    <th style={styles.th}>Ganancia Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const unitsSold = p.salesCount || 0;
                    const revenue = p.price * unitsSold;
                    const totalCogs = (p.cogs || 0) * unitsSold;
                    const totalProfit = revenue - totalCogs;
                    const margin = p.price > 0 ? (((p.price - (p.cogs || 0)) / p.price) * 100).toFixed(1) : 0;

                    return (
                      <tr key={p.id || p._id} style={styles.trBody}>
                        <td style={styles.td}><strong>{p.name}</strong></td>
                        <td style={styles.td}>{unitsSold}</td>
                        <td style={styles.td}>${revenue.toFixed(2)}</td>
                        <td style={styles.td}>${totalCogs.toFixed(2)}</td>
                        <td style={styles.td}>{margin}%</td>
                        <td style={styles.td}>${totalProfit.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: {
    backgroundColor: '#eef2f5',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b'
  },
  topNav: {
    backgroundColor: '#0f2337',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    color: '#ffffff'
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  logoBadge: {
    backgroundColor: '#1b4332',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.8rem'
  },
  navLink: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  navLinkActive: {
    color: '#ffffff',
    backgroundColor: '#1e3a5f',
    padding: '6px 12px',
    borderRadius: '4px'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center'
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem'
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1',
    color: '#0f2337',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  mainContent: {
    padding: '20px'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  pageTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    margin: 0,
    letterSpacing: '0.5px'
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem'
  },
  dateButton: {
    fontWeight: '600',
    color: '#334155'
  },
  dateText: {
    color: '#64748b'
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.1fr 0.7fr',
    gap: '15px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  cardTitle: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#0f172a',
    letterSpacing: '0.5px'
  },
  chartWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60px',
    marginBottom: '10px'
  },
  tooltipBox: {
    backgroundColor: '#0f2337',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    textAlign: 'center'
  },
  subChartSection: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '10px'
  },
  subChartTitle: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '6px'
  },
  subChartRow: {
    display: 'flex',
    justifyContent: 'space-around'
  },
  shiftValue: {
    fontSize: '0.85rem',
    fontWeight: 'bold'
  },
  shiftLabel: {
    fontSize: '0.7rem',
    color: '#64748b'
  },
  donutGrid: {
    marginTop: '10px'
  },
  topProductsTable: {
    fontSize: '0.75rem'
  },
  topProdHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: '6px 8px',
    fontWeight: 'bold',
    borderRadius: '4px'
  },
  topProdRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 8px',
    borderBottom: '1px solid #f8fafc'
  },
  emptyRow: {
    padding: '12px 8px',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textAlign: 'center'
  },
  sidebarSection: {
    marginTop: '10px'
  },
  badgeGray: {
    backgroundColor: '#f1f5f9',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    marginBottom: '6px',
    color: '#334155'
  },
  formRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginTop: '10px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1',
    minWidth: '120px'
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    outline: 'none'
  },
  btnSubmit: {
    backgroundColor: '#1b4332',
    color: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    fontSize: '0.8rem'
  },
  trHead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: '8px',
    textAlign: 'left',
    color: '#475569',
    fontWeight: '600'
  },
  trBody: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '8px',
    color: '#334155'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginTop: '10px'
  }
};

export default AdminPanel;