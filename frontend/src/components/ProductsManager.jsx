import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const INITIAL_FORM = { name: '', category: 'Panadería', sellType: 'unidad', unit: 'un', price: '', cogs: '', stock: '', image: '' };

const ProductsManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(ProductContext);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sellType') {
      const defaultUnit = value === 'peso' ? 'kg' : value === 'porcion' ? 'porcion' : 'un';
      setFormData({ ...formData, sellType: value, unit: defaultUnit });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    const payload = { ...formData, price: parseFloat(formData.price), cogs: parseFloat(formData.cogs || 0), stock: parseFloat(formData.stock || 0) };
    editingId ? await updateProduct(editingId, payload) : await addProduct(payload);
    handleCancelEdit();
  };

  const handleEdit = (p) => {
    setEditingId(p._id || p.id);
    setFormData({ name: p.name, category: p.category || 'Panadería', sellType: p.sellType || 'unidad', unit: p.unit || 'un', price: p.price, cogs: p.cogs || '', stock: p.stock || '', image: p.image || '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) await deleteProduct(id);
  };

  const handleCancelEdit = () => { setEditingId(null); setFormData(INITIAL_FORM); };

  return (
    <div style={{ width: '100%' }}>
      <div style={styles.card}>
        <h2 style={styles.title}>{editingId ? 'EDITAR PRODUCTO' : 'ALTA DE NUEVO PRODUCTO'}</h2>
        <form onSubmit={handleSubmit} style={styles.formGrid}>
          <div style={styles.group}><label style={styles.label}>Nombre</label><input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Pan Francés" style={styles.input} required /></div>
          <div style={styles.group}>
            <label style={styles.label}>Categoría</label>
            <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
              {['Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Venta Por</label>
            <select name="sellType" value={formData.sellType} onChange={handleChange} style={styles.input}>
              <option value="unidad">Unidad / Docena</option><option value="peso">Peso (Kg / Gramos)</option><option value="porcion">Porción / Fracción</option>
            </select>
          </div>
          <div style={styles.group}><label style={styles.label}>Precio Venta ($)</label><input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} style={styles.input} required /></div>
          <div style={styles.group}><label style={styles.label}>Precio Costo ($)</label><input type="number" step="0.01" name="cogs" value={formData.cogs} onChange={handleChange} style={styles.input} /></div>
          <div style={styles.group}><label style={styles.label}>Stock ({formData.unit.toUpperCase()})</label><input type="number" step={formData.sellType === 'peso' ? '0.001' : '1'} name="stock" value={formData.stock} onChange={handleChange} style={styles.input} /></div>
          <div style={styles.group}><label style={styles.label}>Imagen</label><input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.75rem' }} /></div>
          {formData.image && <div style={styles.preview}><img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={styles.btnSubmit}>{editingId ? 'Guardar Cambios' : 'Agregar'}</button>
            {editingId && <button type="button" onClick={handleCancelEdit} style={styles.btnCancel}>Cancelar</button>}
          </div>
        </form>
      </div>

      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.title}>CATÁLOGO DE PRODUCTOS REGISTRADOS</h2>
        {products.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay productos cargados.</p> : (
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={styles.th}>Imagen</th><th style={styles.th}>Nombre</th><th style={styles.th}>Categoría</th><th style={styles.th}>Tipo Venta</th><th style={styles.th}>Precio Venta</th><th style={styles.th}>Costo</th><th style={styles.th}>Stock</th><th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prodId = p._id || p.id;
                const unitLabel = p.unit || (p.sellType === 'peso' ? 'kg' : p.sellType === 'porcion' ? 'porc.' : 'un');
                return (
                  <tr key={prodId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={styles.td}>{p.image ? <img src={p.image} alt={p.name} style={styles.tableImg} /> : <div style={styles.noImg}>Sin foto</div>}</td>
                    <td style={styles.td}><strong>{p.name}</strong></td>
                    <td style={styles.td}><span style={styles.badgeCat}>{p.category || 'Panadería'}</span></td>
                    <td style={styles.td}><span style={styles.badgeType}>{p.sellType === 'peso' ? 'Por Peso' : p.sellType === 'porcion' ? 'Porción' : 'Unidad'}</span></td>
                    <td style={styles.td}>${parseFloat(p.price || 0).toFixed(2)} <small style={{ color: '#64748b' }}>/ {unitLabel}</small></td>
                    <td style={styles.td}>${parseFloat(p.cogs || 0).toFixed(2)}</td>
                    <td style={styles.td}><span style={{ color: p.stock <= 5 ? '#dc2626' : '#166534', fontWeight: 'bold' }}>{p.stock || 0} {unitLabel}</span></td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <button onClick={() => handleEdit(p)} style={styles.btnEdit}>Editar</button>
                      <button onClick={() => handleDelete(prodId)} style={styles.btnDel}>Eliminar</button>
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
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  title: { fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 15px 0', color: '#0f172a' },
  formGrid: { display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' },
  group: { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '130px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#475569' },
  input: { padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  preview: { width: '38px', height: '38px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' },
  btnSubmit: { backgroundColor: '#1b4332', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.85rem' },
  th: { padding: '10px 8px', textAlign: 'left', color: '#475569', fontWeight: '600' },
  td: { padding: '10px 8px', color: '#334155', verticalAlign: 'middle' },
  tableImg: { width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' },
  noImg: { width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeCat: { backgroundColor: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500' },
  badgeType: { backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' },
  btnEdit: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginRight: '6px', cursor: 'pointer' },
  btnDel: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }
};

export default ProductsManager;