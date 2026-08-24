import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SaleContext } from '../context/SaleContext';

const UltimosMovimientos = () => {
  const navigate = useNavigate();
  const { sales } = useContext(SaleContext);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/caja')} style={styles.btnVolver}>← Volver a Caja</button>
        <h2 style={{ margin: 0, color: '#0f172a' }}>📋 ÚLTIMOS MOVIMIENTOS Y VENTAS</h2>
      </div>

      <div style={styles.tableContainer}>
        {sales && sales.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>Cajero</th>
                <th style={styles.th}>Método</th>
                <th style={styles.th}>Detalle</th>
                <th style={styles.th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr key={sale._id || sale.id || index} style={styles.tr}>
                  <td style={styles.td}>
                    {sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                  </td>
                  <td style={styles.td}>{sale.sellerName || sale.cashier || 'Caja'}</td>
                  <td style={styles.td}>
                    <span style={sale.paymentMethod === 'efectivo' ? styles.badgeCash : styles.badgeDigital}>
                      {sale.paymentMethod ? sale.paymentMethod.toUpperCase() : 'EFECTIVO'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {sale.items && sale.items.map(i => `${i.name} (${i.detailLabel || i.quantityVal})`).join(', ')}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 'bold', color: '#166534' }}>
                    ${parseFloat(sale.total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={styles.emptyState}>No hay ventas registradas en este turno.</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  btnVolver: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 'bold' },
  tableContainer: { backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 16px', fontSize: '0.9rem', color: '#334155' },
  badgeCash: { backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
  badgeDigital: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#94a3b8' }
};

export default UltimosMovimientos;