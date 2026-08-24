import React, { useState, useContext, useMemo } from 'react';
import { ProductContext } from '../context/ProductContext';

const StockCatalog = () => {
  const { products } = useContext(ProductContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('todos'); // 'todos', 'disponibles', 'bajo', 'agotado'

  const categories = ['Todas', 'Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtro por texto
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por categoría
      const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;

      // Determinación de estado de stock consolidado
      const totalUnits = product.stockUnits || 0;
      const totalGrams = product.stockGrams || 0;
      const totalPorciones = product.stockPorciones || 0;
      const legacyStock = product.stock || 0;

      const isAgotado = (product.allowByUnit && totalUnits <= 0) &&
                        (!product.allowByWeight || totalGrams <= 0) &&
                        (!product.allowByPorcion || totalPorciones <= 0) &&
                        legacyStock <= 0;

      const isBajo = (product.allowByUnit && totalUnits > 0 && totalUnits <= 5) ||
                     (product.allowByWeight && totalGrams > 0 && totalGrams <= 2000) ||
                     (product.allowByPorcion && totalPorciones > 0 && totalPorciones <= 2);

      let matchesStock = true;
      if (stockFilter === 'disponibles') matchesStock = !isAgotado;
      if (stockFilter === 'bajo') matchesStock = isBajo;
      if (stockFilter === 'agotado') matchesStock = isAgotado;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  return (
    <div style={styles.container}>
      {/* Header y Filtros Rápidos */}
      <div style={styles.headerCard}>
        <div style={styles.headerTitleRow}>
          <h2 style={styles.title}>CATÁLOGO DE STOCK Y PRODUCTOS</h2>
          <span style={styles.totalBadge}>{filteredProducts.length} Productos mostrados</span>
        </div>

        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre de producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.selectInput}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={styles.selectInput}
          >
            <option value="todos">Todos los stocks</option>
            <option value="disponibles">Solo Disponibles</option>
            <option value="bajo">Stock Bajo ⚠️</option>
            <option value="agotado">Agotados ❌</option>
          </select>
        </div>
      </div>

      {/* Grid de Tarjetas de Productos */}
      {filteredProducts.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No se encontraron productos con los criterios seleccionados.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredProducts.map((p) => {
            const prodId = p._id || p.id;
            
            // Verificaciones de disponibilidad
            const hasUnitStock = p.allowByUnit && (p.stockUnits > 0);
            const hasWeightStock = p.allowByWeight && (p.stockGrams > 0);
            const hasPorcionStock = p.allowByPorcion && (p.stockPorciones > 0);
            const isOutOfStock = !hasUnitStock && !hasWeightStock && !hasPorcionStock && (p.stock <= 0);

            return (
              <div key={prodId} style={{ ...styles.card, opacity: isOutOfStock ? 0.65 : 1 }}>
                
                {/* Cabecera del producto / Imagen */}
                <div style={styles.cardHeader}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} style={styles.productImg} />
                  ) : (
                    <div style={styles.noImg}>Sin foto</div>
                  )}
                  <div style={styles.titleContainer}>
                    <span style={styles.categoryBadge}>{p.category || 'Panadería'}</span>
                    <h3 style={styles.productName}>{p.name}</h3>
                  </div>
                </div>

                {/* Badge de Estado general de Stock */}
                <div style={styles.statusRow}>
                  {isOutOfStock ? (
                    <span style={{ ...styles.stockStatusBadge, backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
                      ❌ AGOTADO
                    </span>
                  ) : (
                    <span style={{ ...styles.stockStatusBadge, backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                      ✅ DISPONIBLE
                    </span>
                  )}
                </div>

                {/* Sección de Modalidades de Venta y Precios */}
                <div style={styles.sectionBox}>
                  <span style={styles.sectionTitle}>PRECIOS Y MODALIDADES</span>
                  <div style={styles.priceList}>
                    {p.allowByUnit && (
                      <div style={styles.priceItem}>
                        <span>Unidad:</span>
                        <strong>${parseFloat(p.priceUnit || p.price || 0).toFixed(2)}</strong>
                      </div>
                    )}
                    {p.allowByWeight && (
                      <div style={styles.priceItem}>
                        <span>Kilo (1000g):</span>
                        <strong>${parseFloat(p.priceKg || 0).toFixed(2)}</strong>
                      </div>
                    )}
                    {p.allowByPorcion && (
                      <div style={styles.priceItem}>
                        <span>Porción:</span>
                        <strong>${parseFloat(p.pricePorcion || 0).toFixed(2)}</strong>
                      </div>
                    )}
                    {p.allowByAmount && (
                      <div style={styles.priceItem}>
                        <span>Monto Libre:</span>
                        <strong>Habilitado</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de Detalle de Stock disponible en Caja */}
                <div style={{ ...styles.sectionBox, backgroundColor: '#f8fafc' }}>
                  <span style={styles.sectionTitle}>STOCK DISPONIBLE</span>
                  <div style={styles.stockList}>
                    {p.allowByUnit && (
                      <div style={styles.stockItem}>
                        <span>Unidades:</span>
                        <strong style={{ color: (p.stockUnits || 0) <= 5 ? '#dc2626' : '#0f172a' }}>
                          {p.stockUnits || 0} un
                        </strong>
                      </div>
                    )}
                    {p.allowByWeight && (
                      <div style={styles.stockItem}>
                        <span>Peso:</span>
                        <strong style={{ color: (p.stockGrams || 0) <= 2000 ? '#dc2626' : '#0f172a' }}>
                          {p.stockGrams || 0} gr ({((p.stockGrams || 0) / 1000).toFixed(2)} kg)
                        </strong>
                      </div>
                    )}
                    {p.allowByPorcion && (
                      <div style={styles.stockItem}>
                        <span>Porciones:</span>
                        <strong style={{ color: (p.stockPorciones || 0) <= 2 ? '#dc2626' : '#0f172a' }}>
                          {p.stockPorciones || 0} porc
                        </strong>
                      </div>
                    )}
                    {!p.allowByUnit && !p.allowByWeight && !p.allowByPorcion && (
                      <div style={styles.stockItem}>
                        <span>Stock General:</span>
                        <strong>{p.stock || 0} {p.stockUnit || 'un'}</strong>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' },
  headerCard: { backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  headerTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  title: { fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 },
  totalBadge: { fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '12px' },
  filtersRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  searchInput: { flex: '2', minWidth: '200px', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  selectInput: { flex: '1', minWidth: '140px', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#fff' },
  emptyState: { backgroundColor: '#fff', padding: '30px', textAlign: 'center', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' },
  cardHeader: { display: 'flex', gap: '12px', alignItems: 'center' },
  productImg: { width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover' },
  noImg: { width: '52px', height: '52px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titleContainer: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  categoryBadge: { fontSize: '0.65rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
  productName: { fontSize: '0.95rem', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: '1.2' },
  statusRow: { display: 'flex', alignItems: 'center' },
  stockStatusBadge: { fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' },
  sectionBox: { border: '1px solid #f1f5f9', padding: '8px 10px', borderRadius: '6px' },
  sectionTitle: { fontSize: '0.65rem', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '4px' },
  priceList: { display: 'flex', flexDirection: 'column', gap: '3px' },
  priceItem: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' },
  stockList: { display: 'flex', flexDirection: 'column', gap: '3px' },
  stockItem: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }
};

export default StockCatalog;