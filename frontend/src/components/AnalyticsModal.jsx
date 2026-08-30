import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#ca8a04', '#9333ea', '#dc2626'];

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const AnalyticsModal = ({ isOpen, onClose, sales = [], products = [] }) => {
  const [activeTab, setActiveTab] = useState('rendimiento');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!isOpen) return null;

  // 1. Procesar Ventas por Producto
  const productSalesMap = {};
  sales.forEach(sale => {
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const name = item.name || item.productName || 'Producto';
        const qty = parseFloat(item.quantity) || 1;
        const total = parseFloat(item.price * qty) || 0;

        if (!productSalesMap[name]) {
          productSalesMap[name] = { name, cantidad: 0, total: 0 };
        }
        productSalesMap[name].cantidad += qty;
        productSalesMap[name].total += total;
      });
    }
  });

  const productPerformance = Object.values(productSalesMap).sort((a, b) => b.total - a.total);

  // Top 5 Más Vendidos y 5 Menos Vendidos
  const topProducts = productPerformance.slice(0, 5);
  const lowProducts = productPerformance.slice(-5).reverse();

  // 2. Ventas por Método de Pago
  const paymentMap = { efectivo: 0, digital: 0 };
  sales.forEach(s => {
    const method = s.paymentMethod === 'digital' ? 'digital' : 'efectivo';
    paymentMap[method] += parseFloat(s.total) || 0;
  });

  const paymentData = [
    { name: 'Efectivo', value: paymentMap.efectivo },
    { name: 'Mercado Pago / Digital', value: paymentMap.digital }
  ];

  // 3. Procesar Agrupación de Ventas Mensuales
  const getMonthlyData = () => {
    // Inicializar los 12 meses en cero
    const monthlyMap = MONTH_NAMES.map(month => ({ mes: month, total: 0, ordenes: 0 }));

    sales.forEach(s => {
      const saleDate = new Date(s.createdAt || s.date || Date.now());
      if (saleDate.getFullYear() === Number(selectedYear)) {
        const monthIndex = saleDate.getMonth();
        monthlyMap[monthIndex].total += parseFloat(s.total || s.totalAmount) || 0;
        monthlyMap[monthIndex].ordenes += 1;
      }
    });

    return monthlyMap;
  };

  const monthlyData = getMonthlyData();
  const totalYearAmount = monthlyData.reduce((acc, curr) => acc + curr.total, 0);

  // Extraer lista de años disponibles en las ventas
  const availableYears = Array.from(
    new Set(sales.map(s => new Date(s.createdAt || s.date || Date.now()).getFullYear()))
  ).sort((a, b) => b - a);

  if (!availableYears.includes(new Date().getFullYear())) {
    availableYears.unshift(new Date().getFullYear());
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Cabecera */}
        <div style={styles.header}>
          <h2>📊 Panel de Inteligencia de Negocio</h2>
          <button onClick={onClose} style={styles.btnClose}>✕</button>
        </div>

        {/* Solapas de Navegación */}
        <div style={styles.tabs}>
          <button
            style={activeTab === 'rendimiento' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('rendimiento')}
          >
            🏆 Mas Vendidos
          </button>
          <button
            style={activeTab === 'mensual' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('mensual')}
          >
            📅 Evolución Mensual
          </button>
          <button
            style={activeTab === 'marketing' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('marketing')}
          >
            💡 Oportunidades
          </button>
          <button
            style={activeTab === 'pagos' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('pagos')}
          >
            💳 Métodos de Pago
          </button>
        </div>

        {/* Cuerpo con Gráficos */}
        <div style={styles.body}>
          {activeTab === 'rendimiento' && (
            <div>
              <h3>Rendimiento de Ventas por Producto ($)</h3>
              <p style={styles.sub}>Productos que mayor facturación generaron.</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'mensual' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h3>Facturación Mensual ({selectedYear})</h3>
                  <p style={styles.sub}>Total acumulado del año: <strong>${totalYearAmount.toFixed(2)}</strong></p>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginRight: '8px' }}>Año:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    style={styles.select}
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Facturación ($)" stroke="#16a34a" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div>
              <h3>🔍 Sugerencias Estratégicas y Upgrade</h3>
              <div style={styles.marketingGrid}>
                <div style={styles.cardInfoGood}>
                  <h4>🌟 Estrellas del Negocio</h4>
                  <ul>
                    {topProducts.map((p, idx) => (
                      <li key={idx}><strong>{p.name}</strong>: ${p.total.toFixed(2)} ({p.cantidad} un.)</li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.8rem', color: '#166534' }}>👉 Mantener stock alto siempre garantizado.</p>
                </div>

                <div style={styles.cardInfoWarn}>
                  <h4>🚀 Requieren Impulso de Marketing</h4>
                  <ul>
                    {lowProducts.map((p, idx) => (
                      <li key={idx}><strong>{p.name}</strong>: solo {p.cantidad} unidades vendidas</li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.8rem', color: '#9a3412' }}>👉 Crear promociones combo o colocar cartelería en mostrador.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagos' && (
            <div>
              <h3>Distribución de Ingresos por Medio de Pago</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" outerRadius={100} label dataKey="value">
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `$${val.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' },
  modal: { backgroundColor: '#ffffff', width: '100%', maxWidth: '850px', maxHeight: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#0f172a', color: '#ffffff' },
  btnClose: { background: 'none', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' },
  tabs: { display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
  tab: { flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#64748b', fontSize: '0.85rem' },
  tabActive: { flex: 1, padding: '12px', border: 'none', background: '#ffffff', borderBottom: '3px solid #2563eb', cursor: 'pointer', fontWeight: 'bold', color: '#2563eb', fontSize: '0.85rem' },
  body: { padding: '24px', overflowY: 'auto' },
  sub: { fontSize: '0.85rem', color: '#64748b', marginTop: '-4px', marginBottom: '16px' },
  select: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' },
  marketingGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  cardInfoGood: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px' },
  cardInfoWarn: { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '16px', borderRadius: '12px' }
};

export default AnalyticsModal;