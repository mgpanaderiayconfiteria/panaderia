import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ProductContext } from '../context/ProductContext';
import { SaleContext } from '../context/SaleContext';
import UsersManager from '../components/UsersManager';
import ProductsManager from '../components/ProductsManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminPanel = () => {
  const { products } = useContext(ProductContext);
  const { sales } = useContext(SaleContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wasteLogs, setWasteLogs] = useState([]);

  // Cargar registros de desperdicio/mermas desde el servidor
  useEffect(() => {
    fetch(`${API_URL}/api/shifts/waste`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setWasteLogs(data))
      .catch((err) => console.error('Error al cargar mermas:', err));
  }, []);

  // 1. Total Ingresos Totales
  const totalEarnings = useMemo(() => {
    return sales.reduce((acc, sale) => acc + (parseFloat(sale.total) || 0), 0);
  }, [sales]);

  // 2. Ventas por Turno (Mañana: 06:00 a 13:59 | Tarde: 14:00 a 22:00)
  const shiftTotals = useMemo(() => {
    let morning = 0;
    let afternoon = 0;
    sales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt || sale.timestamp || Date.now());
      const hour = saleDate.getHours();
      const amount = parseFloat(sale.total) || 0;
      if (hour >= 6 && hour < 14) morning += amount;
      else afternoon += amount;
    });
    return { morning, afternoon };
  }, [sales]);

  // 3. Ventas por Vendedor (Agrupado por Empleado)
  const salesBySeller = useMemo(() => {
    const map = {};
    sales.forEach((sale) => {
      const sellerName = sale.employee || sale.sellerName || sale.cashier || 'Caja General';
      const amount = parseFloat(sale.total) || 0;
      if (!map[sellerName]) {
        map[sellerName] = { total: 0, count: 0, cash: 0, digital: 0 };
      }
      map[sellerName].total += amount;
      map[sellerName].count += 1;
      if (sale.paymentMethod === 'efectivo') {
        map[sellerName].cash += amount;
      } else {
        map[sellerName].digital += amount;
      }
    });
    return map;
  }, [sales]);

  // 4. Mapeo de Ventas por Producto
  const productSalesMap = useMemo(() => {
    const map = {};
    sales.forEach((sale) => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const prodId = item.productId || item.product || item.id;
          const qty = parseFloat(item.quantityVal || item.quantity) || 0;
          const subtotal = parseFloat(item.subtotal || item.price * qty) || 0;
          if (!map[prodId]) map[prodId] = { qty: 0, revenue: 0, name: item.name };
          map[prodId].qty += qty;
          map[prodId].revenue += subtotal;
        });
      }
    });
    return map;
  }, [sales]);

  // Top 5 Productos más vendidos
  const topProductsList = useMemo(() => {
    return Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [productSalesMap]);

  // Pérdida total por desperdicio acumulado
  const totalWasteLoss = useMemo(() => {
    return wasteLogs.reduce((acc, log) => acc + (parseFloat(log.totalLoss) || 0), 0);
  }, [wasteLogs]);

  return (
    <div style={styles.dashboardContainer}>
      <nav style={styles.topNav}>
        <div style={styles.navLeft}>
          <div style={styles.logoBadge}>MG</div>
          <span
            style={{ ...styles.navLink, ...(activeTab === 'dashboard' ? styles.navLinkActive : {}) }}
            onClick={() => setActiveTab('dashboard')}
          >
            Panel de Control
          </span>
          <span
            style={{ ...styles.navLink, ...(activeTab === 'waste' ? styles.navLinkActive : {}) }}
            onClick={() => setActiveTab('waste')}
          >
            Sobrantes / Mermas
          </span>
          <span
            style={{ ...styles.navLink, ...(activeTab === 'products' ? styles.navLinkActive : {}) }}
            onClick={() => setActiveTab('products')}
          >
            Gestión de Productos
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

      {activeTab === 'products' && (
        <main style={styles.mainContent}>
          <ProductsManager />
        </main>
      )}

      {activeTab === 'users' && (
        <main style={styles.mainContent}>
          <UsersManager />
        </main>
      )}

      {/* PESTAÑA LOG DE SOBRANTES DE FIN DE TURNO */}
      {activeTab === 'waste' && (
        <main style={styles.mainContent}>
          <div style={styles.headerRow}>
            <h1 style={styles.pageTitle}>LOG DE SOBRANTES Y DESPERDICIOS (FIN DE TURNO)</h1>
            <div style={styles.dateSelector}>
              <span style={styles.dateButton}>Pérdida Total Acumulada:</span>
              <strong style={{ color: '#dc2626' }}>${totalWasteLoss.toFixed(2)}</strong>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>REGISTRO DE PRODUCTOS RETIRADOS DEL STOCK</h2>
            {wasteLogs.length === 0 ? (
              <p style={styles.emptyText}>No hay registros de desperdicio ingresados por las cajeras.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Fecha y Hora</th>
                    <th style={styles.th}>Cajera / Empleado</th>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Cantidad Retirada</th>
                    <th style={styles.th}>Pérdida Estimada ($)</th>
                    <th style={styles.th}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteLogs.map((log) => (
                    <tr key={log._id || log.id} style={styles.trBody}>
                      <td style={styles.td}>{new Date(log.createdAt || Date.now()).toLocaleString('es-AR')}</td>
                      <td style={styles.td}><strong>{log.employee || 'Cajera'}</strong></td>
                      <td style={styles.td}>{log.productName}</td>
                      <td style={{ ...styles.td, color: '#dc2626', fontWeight: 'bold' }}>
                        {log.quantity} {log.mode === 'weight' ? 'g' : 'un'}
                      </td>
                      <td style={{ ...styles.td, color: '#dc2626', fontWeight: 'bold' }}>
                        ${parseFloat(log.totalLoss || 0).toFixed(2)}
                      </td>
                      <td style={styles.td}>{log.reason || 'Sobrante del día'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      )}

      {/* DASHBOARD PRINCIPAL */}
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
            {/* CARD 1: VENTAS Y TURNOS */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>RESUMEN DE VENTAS DIARIAS</h2>
              </div>
              <div style={styles.chartWrapper}>
                <div style={styles.tooltipBox}>
                  Total Registrado: <strong>${totalEarnings.toFixed(2)}</strong>
                </div>
              </div>
              <div style={styles.subChartSection}>
                <div style={styles.subChartTitle}>Ventas por Turno Horario</div>
                <div style={styles.subChartRow}>
                  <div>
                    <div style={styles.shiftValue}>${shiftTotals.morning.toFixed(2)}</div>
                    <div style={styles.shiftLabel}>Turno Mañana (06 - 14 hs)</div>
                  </div>
                  <div>
                    <div style={styles.shiftValue}>${shiftTotals.afternoon.toFixed(2)}</div>
                    <div style={styles.shiftLabel}>Turno Tarde (14 - 22 hs)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PRODUCTOS MÁS VENDIDOS */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>PRODUCTOS MÁS VENDIDOS</h2>
              <div style={styles.donutGrid}>
                <div style={styles.topProductsTable}>
                  <div style={styles.topProdHeader}>
                    <span>Producto</span>
                    <span>Vendidos</span>
                  </div>
                  {topProductsList.length === 0 ? (
                    <div style={styles.emptyRow}>Sin ventas registradas</div>
                  ) : (
                    topProductsList.map((p, idx) => (
                      <div key={idx} style={styles.topProdRow}>
                        <span>{idx + 1}. {p.name}</span>
                        <strong>{p.qty.toFixed(1)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* CARD 3: ALERTAS DE STOCK */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>ALERTAS DE STOCK Y DESPERDICIO</h2>
              <div style={styles.sidebarSection}>
                {products.filter((p) => (p.stock || 0) <= 5).length === 0 ? (
                  <div style={styles.badgeGray}>Stock normal en todos los productos</div>
                ) : (
                  products
                    .filter((p) => (p.stock || 0) <= 5)
                    .map((p) => (
                      <div key={p.id || p._id} style={styles.badgeGray}>
                        {p.name}: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>STOCK BAJO ({p.stock || 0})</span>
                      </div>
                    ))
                )}
                {wasteLogs.length > 0 && (
                  <div style={{ ...styles.badgeGray, backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginTop: '10px' }}>
                    ⚠️ <strong style={{ color: '#991b1b' }}>{wasteLogs.length} mermas registradas hoy</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NUEVA TABLA: RENDIMIENTO Y VENTAS POR VENDEDOR */}
          <div style={{ ...styles.card, marginBottom: '20px' }}>
            <h2 style={styles.cardTitle}>VENTAS AUDITADAS POR VENDEDOR / CAJERA</h2>
            {Object.keys(salesBySeller).length === 0 ? (
              <p style={styles.emptyText}>No hay ventas asignadas a vendedores aún.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Vendedor / Cajera</th>
                    <th style={styles.th}>Cant. Órdenes</th>
                    <th style={styles.th}>Efectivo Recaudado</th>
                    <th style={styles.th}>Cobros Digitales</th>
                    <th style={styles.th}>Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(salesBySeller).map(([seller, data]) => (
                    <tr key={seller} style={styles.trBody}>
                      <td style={styles.td}><strong>👤 {seller}</strong></td>
                      <td style={styles.td}>{data.count} vtas</td>
                      <td style={styles.td}>${data.cash.toFixed(2)}</td>
                      <td style={styles.td}>${data.digital.toFixed(2)}</td>
                      <td style={{ ...styles.td, color: '#166534', fontWeight: 'bold' }}>${data.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* TABLA DE RENTABILIDAD COGS / COSTO VS MARGEN */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ANÁLISIS DE RENTABILIDAD Y COSTOS (COGS)</h2>
            {products.length === 0 ? (
              <p style={styles.emptyText}>No hay productos registrados en el catálogo.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Producto</th>
                    <th style={styles.th}>Cant. Vendida</th>
                    <th style={styles.th}>Ingresos Reales</th>
                    <th style={styles.th}>Costo Estimado (COGS)</th>
                    <th style={styles.th}>Margen (%)</th>
                    <th style={styles.th}>Ganancia Neta Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const prodId = p._id || p.id;
                    const realSales = productSalesMap[prodId] || { qty: 0, revenue: 0 };
                    const unitsSold = realSales.qty;
                    const revenue = realSales.revenue;
                    const unitCost = parseFloat(p.cost || p.cogs || 0);
                    const totalCogs = unitCost * unitsSold;
                    const totalProfit = revenue - totalCogs;
                    const priceUnit = parseFloat(p.priceUnit || p.price || p.priceKg || 0);
                    const margin = priceUnit > 0 ? (((priceUnit - unitCost) / priceUnit) * 100).toFixed(1) : 0;

                    return (
                      <tr key={prodId} style={styles.trBody}>
                        <td style={styles.td}><strong>{p.name}</strong></td>
                        <td style={styles.td}>{unitsSold.toFixed(2)}</td>
                        <td style={styles.td}>${revenue.toFixed(2)}</td>
                        <td style={styles.td}>${totalCogs.toFixed(2)}</td>
                        <td style={{ ...styles.td, color: margin > 30 ? '#166534' : '#b45309', fontWeight: 'bold' }}>{margin}%</td>
                        <td style={{ ...styles.td, color: totalProfit >= 0 ? '#166534' : '#dc2626', fontWeight: 'bold' }}>
                          ${totalProfit.toFixed(2)}
                        </td>
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
  dashboardContainer: { backgroundColor: '#eef2f5', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' },
  topNav: { backgroundColor: '#0f2337', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', color: '#ffffff' },
  navLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  logoBadge: { backgroundColor: '#1b4332', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' },
  navLink: { fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' },
  navLinkActive: { color: '#ffffff', backgroundColor: '#1e3a5f', padding: '6px 12px', borderRadius: '4px' },
  navRight: { display: 'flex', alignItems: 'center' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#cbd5e1', color: '#0f2337', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' },
  mainContent: { padding: '20px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  pageTitle: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' },
  dateSelector: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  dateButton: { fontWeight: '600', color: '#334155' },
  dateText: { color: '#64748b' },
  topGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 0.7fr', gap: '15px', marginBottom: '20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  cardTitle: { fontSize: '0.85rem', fontWeight: 'bold', margin: 0, color: '#0f172a', letterSpacing: '0.5px' },
  chartWrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', marginBottom: '10px' },
  tooltipBox: { backgroundColor: '#0f2337', color: '#ffffff', padding: '8px 14px', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' },
  subChartSection: { borderTop: '1px solid #f1f5f9', paddingTop: '10px' },
  subChartTitle: { fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' },
  subChartRow: { display: 'flex', justifyContent: 'space-around' },
  shiftValue: { fontSize: '0.85rem', fontWeight: 'bold' },
  shiftLabel: { fontSize: '0.7rem', color: '#64748b' },
  donutGrid: { marginTop: '10px' },
  topProductsTable: { fontSize: '0.75rem' },
  topProdHeader: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: '6px 8px', fontWeight: 'bold', borderRadius: '4px' },
  topProdRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #f8fafc' },
  emptyRow: { padding: '12px 8px', color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center' },
  sidebarSection: { marginTop: '10px' },
  badgeGray: { backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '6px', color: '#334155' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.8rem' },
  trHead: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '8px', textAlign: 'left', color: '#475569', fontWeight: '600' },
  trBody: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px', color: '#334155' },
  emptyText: { color: '#94a3b8', fontSize: '0.85rem', marginTop: '10px' }
};

export default AdminPanel;