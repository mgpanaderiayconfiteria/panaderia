import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const ProductsManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(ProductContext);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Panadería',
    price: '',
    cogs: '',
    stock: ''
  });

  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    if (editingId) {
      updateProduct(editingId, {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        cogs: parseFloat(formData.cogs || 0),
        stock: parseInt(formData.stock || 0, 10)
      });
      setEditingId(null);
    } else {
      addProduct({
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        cogs: parseFloat(formData.cogs || 0),
        stock: parseInt(formData.stock || 0, 10)
      });
    }

    setFormData({ name: '', category: 'Panadería', price: '', cogs: '', stock: '' });
  };

  const handleEdit = (product) => {
    setEditingId(product.id || product._id);
    setFormData({
      name: product.name,
      category: product.category || 'Panadería',
      price: product.price,
      cogs: product.cogs || '',
      stock: product.stock || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Panadería', price: '', cogs: '', stock: '' });
  };

  return (
    <div style={styles.container}>
      {/* Formulario de Alta y Edición */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          {editingId ? 'EDITAR PRODUCTO' : 'ALTA DE NUEVO PRODUCTO'}
        </h2>
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre del Producto</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej. Medialuna de Manteca"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Categoría</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="Panadería">Panadería</option>
              <option value="Facturería">Facturería</option>
              <option value="Repostería">Repostería</option>
              <option value="Cafetería">Cafetería</option>
              <option value="Especialidades">Especialidades</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Precio Venta ($)</label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Costo COGS ($)</label>
            <input
              type="number"
              step="0.01"
              name="cogs"
              value={formData.cogs}
              onChange={handleChange}
              placeholder="0.00"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Stock Inicial</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.btnSubmit}>
              {editingId ? 'Guardar Cambios' : 'Agregar Producto'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={styles.btnCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista y Gestión de Productos */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.cardTitle}>CATÁLOGO DE PRODUCTOS REGISTRADOS</h2>
        {products.length === 0 ? (
          <p style={styles.emptyText}>No hay productos cargados en el sistema.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Categoría</th>
                <th style={styles.th}>Precio Venta</th>
                <th style={styles.th}>Costo (COGS)</th>
                <th style={styles.th}>Stock</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prodId = p.id || p._id;
                return (
                  <tr key={prodId} style={styles.trBody}>
                    <td style={styles.td}><strong>{p.name}</strong></td>
                    <td style={styles.td}>
                      <span style={styles.badgeCategory}>{p.category || 'Panadería'}</span>
                    </td>
                    <td style={styles.td}>${parseFloat(p.price || 0).toFixed(2)}</td>
                    <td style={styles.td}>${parseFloat(p.cogs || 0).toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={p.stock <= 5 ? styles.stockLow : styles.stockOk}>
                        {p.stock || 0}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(p)}
                        style={styles.btnEdit}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(prodId)}
                        style={styles.btnDelete}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  cardTitle: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    margin: '0 0 15px 0',
    color: '#0f172a',
    letterSpacing: '0.5px'
  },
  formGrid: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1',
    minWidth: '140px'
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '8px 10px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    outline: 'none'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px'
  },
  btnSubmit: {
    backgroundColor: '#1b4332',
    color: '#ffffff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  btnCancel: {
    backgroundColor: '#64748b',
    color: '#ffffff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
    fontSize: '0.85rem'
  },
  trHead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: '10px 8px',
    textAlign: 'left',
    color: '#475569',
    fontWeight: '600'
  },
  trBody: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '10px 8px',
    color: '#334155'
  },
  badgeCategory: {
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '500'
  },
  stockOk: {
    color: '#166534',
    fontWeight: 'bold'
  },
  stockLow: {
    color: '#dc2626',
    fontWeight: 'bold'
  },
  btnEdit: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    marginRight: '6px',
    cursor: 'pointer'
  },
  btnDelete: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '0.85rem'
  }
};

export default ProductsManager;