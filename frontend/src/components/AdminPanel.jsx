import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const AdminPanel = () => {
  const { products, addProduct } = useContext(ProductContext);

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

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Navigation Bar */}
      <nav style={styles.topNav}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>S</div>
          <span style={{ ...styles.navLink, ...styles.navLinkActive }}>Dashboard</span>
          <span style={styles.navLink}>Data Shop</span>
          <span style={styles.navLink}>Communications</span>
          <span style={styles.navLink}>Compleies</span>
          <span style={styles.navLink}>Reents</span>
        </div>
        <div style={styles.navRight}>
          <span style={styles.iconBell}>🔔</span>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>ML</div>
            <span>Maria L. ▾</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Header Title & Date Picker */}
        <div style={styles.headerRow}>
          <h1 style={styles.pageTitle}>BAKERY PERFORMANCE DASHBOARD</h1>
          <div style={styles.dateSelector}>
            <span style={styles.dateButton}>📅 Today</span>
            <span style={styles.dateText}>Oct 26, 2026, 11:30 AM</span>
          </div>
        </div>

        {/* Top Grid: Graphics & Sidebar */}
        <div style={styles.topGrid}>
          {/* Daily Earnings Overview (Line Chart SVG) */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>DAILY EARNINGS OVERVIEW</h2>
              <select style={styles.selectFilter}>
                <option>Last 30 days</option>
              </select>
            </div>
            
            <div style={styles.chartWrapper}>
              <div style={styles.tooltipBox}>
                Today's Total: <strong>$2,450.75</strong>
              </div>
              <svg viewBox="0 0 500 150" style={styles.svgChart}>
                <path
                  d="M 10 120 L 40 80 L 70 100 L 100 50 L 130 90 L 160 110 L 190 60 L 220 90 L 250 80 L 280 120 L 310 70 L 340 110 L 370 30 L 400 90 L 430 40 L 460 90 L 490 60"
                  fill="none"
                  stroke="#1b4332"
                  strokeWidth="3"
                />
                <circle cx="220" cy="90" r="5" fill="#1b4332" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>

            <div style={styles.subChartSection}>
              <div style={styles.subChartTitle}>Shift-wise Earnings</div>
              <div style={styles.subChartRow}>
                <div>
                  <div style={styles.shiftValue}>$1,150</div>
                  <div style={styles.shiftLabel}>Morning Shift</div>
                </div>
                <div>
                  <div style={styles.shiftValue}>$1,300.75</div>
                  <div style={styles.shiftLabel}>Afternoon Shift</div>
                </div>
                <div>
                  <div style={styles.shiftValue}>$1,300.75</div>
                  <div style={styles.shiftLabel}>Morning Shift</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Breakdown by Product (Donut Chart SVG) */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>SALES BREAKDOWN BY PRODUCT</h2>
            <div style={styles.donutGrid}>
              <div style={styles.donutContainer}>
                <svg viewBox="0 0 36 36" style={styles.donutSvg}>
                  <path strokeDasharray="35, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1b4332" strokeWidth="6" />
                  <path strokeDasharray="28, 100" strokeDashoffset="-35" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#0d1b2a" strokeWidth="6" />
                  <path strokeDasharray="15, 100" strokeDashoffset="-63" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#415a77" strokeWidth="6" />
                  <path strokeDasharray="12, 100" strokeDashoffset="-78" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#778da9" strokeWidth="6" />
                  <path strokeDasharray="10, 100" strokeDashoffset="-90" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e0e1dd" strokeWidth="6" />
                </svg>
                <div style={styles.legendList}>
                  <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#1b4332' }}></span> Chipá (28%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#0d1b2a' }}></span> Pastries & Viennoiserie (35%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#415a77' }}></span> Coffee (15%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#778da9' }}></span> Muffins (10%)</div>
                  <div style={styles.legendItem}><span style={{ ...styles.dot, backgroundColor: '#e0e1dd' }}></span> Other (12%)</div>
                </div>
              </div>

              <div style={styles.topProductsTable}>
                <div style={styles.topProdHeader}><span>Top Product</span><span>Sold</span></div>
                <div style={styles.topProdRow}><span>1. Sourdough Loaf</span><strong>215</strong></div>
                <div style={styles.topProdRow}><span>2. Croissant</span><strong>195</strong></div>
                <div style={styles.topProdRow}><span>3. Chipá Tradicional</span><strong>180</strong></div>
                <div style={styles.topProdRow}><span>4. Muffins</span><strong>150</strong></div>
                <div style={styles.topProdRow}><span>5. Specialty Cake</span><strong>15</strong></div>
              </div>
            </div>
          </div>

          {/* Trends & Alerts Sidebar */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>TRENDS & ALERTS</h2>
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarLabel}>Recent best sellers</div>
              <div style={styles.badgeGray}>Croissant sales trend: <span style={{ color: '#2e7d32' }}>UP 12%</span></div>
              <div style={styles.badgeGray}>Croissant sales trend: <span style={{ color: '#2e7d32' }}>↑ 12%</span></div>
              <div style={styles.badgeGray}>Chipá ingredient alert: <span style={{ color: '#2e7d32' }}>LOW</span></div>
            </div>
            <div style={{ ...styles.sidebarSection, marginTop: '15px' }}>
              <div style={styles.sidebarLabel}>Recent ant stock alerts</div>
              <div style={styles.badgeGray}>Chipá ingredient alert: <span style={{ color: '#2e7d32' }}>LOW</span></div>
            </div>
          </div>
        </div>

        {/* Middle Section: Formulario de Alta de Producto */}
        <div style={{ ...styles.card, marginBottom: '20px' }}>
          <h2 style={styles.cardTitle}>ALTA DE NUEVO PRODUCTO (PANADERÍA)</h2>
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

        {/* Bottom Table: Product Profitability Analysis */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>PRODUCT PROFITABILITY ANALYSIS</h2>
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Product ⇕</th>
                <th style={styles.th}>Units Sold ⇕</th>
                <th style={styles.th}>Revenue ⇕</th>
                <th style={styles.th}>COGS ⇕</th>
                <th style={styles.th}>Profit Margin (%) ⇕</th>
                <th style={styles.th}>Total Profit ⇕</th>
                <th style={styles.th}>Profitability Score ⇕</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const revenue = p.price * (p.stock || 10);
                const totalCogs = p.cogs * (p.stock || 10);
                const totalProfit = revenue - totalCogs;
                const margin = p.price > 0 ? (((p.price - p.cogs) / p.price) * 100).toFixed(1) : 0;
                const isHigh = margin >= 60;

                return (
                  <tr key={p.id} style={styles.trBody}>
                    <td style={styles.td}><strong>{p.name}</strong></td>
                    <td style={styles.td}>{p.stock || 100}</td>
                    <td style={styles.td}>${revenue.toFixed(2)}</td>
                    <td style={styles.td}>${totalCogs.toFixed(2)}</td>
                    <td style={styles.td}>
                      <div style={styles.sparklineCell}>
                        <span>{margin}%</span>
                        <svg width="40" height="15" viewBox="0 0 40 15">
                          <path d="M0 12 L10 10 L20 13 L30 4 L40 2" fill="none" stroke={isHigh ? "#2e7d32" : "#d97706"} strokeWidth="2" />
                        </svg>
                      </div>
                    </td>
                    <td style={styles.td}>${totalProfit.toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={isHigh ? styles.badgeHigh : styles.badgeMedium}>
                        {isHigh ? 'High' : 'Medium'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
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
    backgroundColor: '#2e7d32',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
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
    alignItems: 'center',
    gap: '15px'
  },
  iconBell: {
    fontSize: '1rem',
    cursor: 'pointer'
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
  selectFilter: {
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    borderColor: '#cbd5e1'
  },
  chartWrapper: {
    position: 'relative',
    height: '110px',
    marginBottom: '10px'
  },
  tooltipBox: {
    position: 'absolute',
    top: '10px',
    left: '120px',
    backgroundColor: '#0f2337',
    color: '#ffffff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    textAlign: 'center'
  },
  svgChart: {
    width: '100%',
    height: '100%'
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
    justifyContent: 'space-between'
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '10px'
  },
  donutContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  donutSvg: {
    width: '90px',
    height: '90px',
    transform: 'rotate(-90deg)'
  },
  legendList: {
    fontSize: '0.65rem',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  topProductsTable: {
    fontSize: '0.75rem'
  },
  topProdHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    fontWeight: 'bold',
    borderRadius: '4px'
  },
  topProdRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 8px',
    borderBottom: '1px solid #f8fafc'
  },
  sidebarSection: {
    marginTop: '10px'
  },
  sidebarLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginBottom: '6px'
  },
  badgeGray: {
    backgroundColor: '#f1f5f9',
    padding: '6px 10px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    marginBottom: '6px'
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
  sparklineCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  badgeHigh: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '0.75rem'
  },
  badgeMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '0.75rem'
  }
};

export default AdminPanel;