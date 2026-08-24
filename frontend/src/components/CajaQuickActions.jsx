import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CajaQuickActions = ({ onClose }) => {
  const { fetchProducts } = useContext(ProductContext);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Panadería',
    sellType: 'unidad', // 'unidad', 'peso', 'porcion'
    price: '',
    stock: '',
    cogs: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const priceNum = parseFloat(formData.price) || 0;
    const stockNum = parseFloat(formData.stock) || 0;
    const cogsNum = parseFloat(formData.cogs) || 0;

    if (!formData.name.trim() || priceNum <= 0) {
      setErrorMsg('Ingresa un nombre y precio válidos.');
      setLoading(false);
      return;
    }

    // Estructurar payload exacto que requiere createProduct en el backend
    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      cogs: cogsNum,
      allowByUnit: formData.sellType === 'unidad',
      allowByWeight: formData.sellType === 'peso',
      allowByPorcion: formData.sellType === 'porcion',
      priceUnit: formData.sellType === 'unidad' ? priceNum : 0,
      priceKg: formData.sellType === 'peso' ? priceNum : 0,
      pricePorcion: formData.sellType === 'porcion' ? priceNum : 0,
      stockUnits: formData.sellType === 'unidad' ? stockNum : 0,
      stockGrams: formData.sellType === 'peso' ? stockNum : 0,
      stockPorciones: formData.sellType === 'porcion' ? stockNum : 0
    };

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al guardar el producto');
      }

      await fetchProducts(); // Recargar catálogo en pantalla de caja
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
          <h3>⚡ Alta Rápida de Producto (Caja)</h3>
          <button onClick={onClose} style={styles.btnClose}>✕</button>
        </div>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nombre del Producto:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Criollitos integrales"
              required
              style={styles.input}
            />
          </label>

          <div style={styles.row}>
            <label style={styles.label}>
              Categoría:
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                <option value="Panadería">Panadería</option>
                <option value="Facturería">Facturería</option>
                <option value="Repostería">Repostería</option>
                <option value="Cafetería">Cafetería</option>
                <option value="Especialidades">Especialidades</option>
              </select>
            </label>

            <label style={styles.label}>
              Tipo de Venta:
              <select name="sellType" value={formData.sellType} onChange={handleChange} style={styles.input}>
                <option value="unidad">Por Unidad</option>
                <option value="peso">Por Peso (Kg/Gr)</option>
                <option value="porcion">Por Porción</option>
              </select>
            </label>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Precio ($):
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                required
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Stock Inicial ({formData.sellType === 'peso' ? 'Gramos' : 'Unidades'}):
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="0"
                style={styles.input}
              />
            </label>
          </div>

          <label style={styles.label}>
            Costo Estimado / COGS ($) (Opcional):
            <input
              type="number"
              step="0.01"
              name="cogs"
              value={formData.cogs}
              onChange={handleChange}
              placeholder="0.00"
              style={styles.input}
            />
          </label>

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? 'Guardando...' : 'Crear e Iniciar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 },
  modal: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  btnClose: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' },
  input: { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  btnCancel: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' },
  btnSubmit: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  error: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '10px' }
};

export default CajaQuickActions;