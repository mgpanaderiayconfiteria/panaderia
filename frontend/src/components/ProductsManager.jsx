import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const INITIAL_FORM = {
  name: '',
  category: 'Panadería',
  allowByUnit: true,
  allowByWeight: true,
  priceUnit: '',
  priceKg: '',
  cogs: '',
  stockGrams: '',
  stockUnits: '',
  image: ''
};

const ProductsManager = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(ProductContext);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    if (!formData.name) return;

    const priceUnitNum = parseFloat(formData.priceUnit || 0);
    const priceKgNum = parseFloat(formData.priceKg || 0);
    const mainPrice = priceKgNum > 0 ? priceKgNum : priceUnitNum;

    // Se unifica el stock total si aplica venta por peso (en gramos) o por unidad
    const stockVal = formData.allowByWeight 
      ? parseFloat(formData.stockGrams || 0) 
      : parseFloat(formData.stockUnits || 0);

    const payload = {
      name: formData.name,
      category: formData.category,
      allowByUnit: formData.allowByUnit,
      allowByWeight: formData.allowByWeight,
      allowByAmount: formData.allowByWeight, // Habilita venta por monto en $ si tiene precio por Kg
      priceUnit: priceUnitNum,
      priceKg: priceKgNum,
      price: mainPrice,
      cogs: parseFloat(formData.cogs || 0),
      stock: stockVal,
      stockUnit: formData.allowByWeight ? 'gr' : 'un',
      image: formData.image
    };

    editingId ? await updateProduct(editingId, payload) : await addProduct(payload);
    handleCancelEdit();
  };

  const handleEdit = (p) => {
    setEditingId(p._id || p.id);
    const isWeight = p.allowByWeight ?? (p.sellType === 'peso');
    setFormData({
      name: p.name || '',
      category: p.category || 'Panadería',
      allowByUnit: p.allowByUnit ?? true,
      allowByWeight: isWeight,
      priceUnit: p.priceUnit || (p.sellType === 'unidad' ? p.price : ''),
      priceKg: p.priceKg || (p.sellType === 'peso' ? p.price : ''),
      cogs: p.cogs || '',
      stockGrams: isWeight ? (p.stock || '') : '',
      stockUnits: !isWeight ? (p.stock || '') : '',
      image: p.image || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) await deleteProduct(id);
  };

  const handleCancelEdit = () => { setEditingId(null); setFormData(INITIAL_FORM); };

  return (
    <div style={{ width: '100%' }}>
      <div style={styles.card}>
        <h2 style={styles.title}>{editingId ? 'EDITAR PRODUCTO' : 'ALTA DE NUEVO PRODUCTO'}</h2>
        <form onSubmit={handleSubmit} style={styles.formContainer}>
          
          <div style={styles.formRow}>
            <div style={styles.group}>
              <label style={styles.label}>Nombre del Producto</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Pan Francés" style={styles.input} required />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                {['Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={styles.optionsBox}>
            <span style={styles.optionsTitle}>Modalidades de Venta Habilitadas:</span>
            <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByWeight" checked={formData.allowByWeight} onChange={handleChange} />
                Por Peso / Monto (Gramos / $)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByUnit" checked={formData.allowByUnit} onChange={handleChange} />
                Por Unidad / Porción
              </label>
            </div>
          </div>

          <div style={styles.formRow}>
            {formData.allowByWeight && (
              <div style={styles.group}>
                <label style={styles.label}>Precio por Kg ($)</label>
                <input type="number" step="0.01" name="priceKg" value={formData.priceKg} onChange={handleChange} placeholder="Ej: 3200" style={styles.input} required={formData.allowByWeight} />
              </div>
            )}

            {formData.allowByUnit && (
              <div style={styles.group}>
                <label style={styles.label}>Precio por Unidad ($)</label>
                <input type="number" step="0.01" name="priceUnit" value={formData.priceUnit} onChange={handleChange} placeholder="Ej: 500" style={styles.input} required={formData.allowByUnit} />
              </div>
            )}

            <div style={styles.group}>
              <label style={styles.label}>Costo Est. ($)</label>
              <input type="number" step="0.01" name="cogs" value={formData.cogs} onChange={handleChange} style={styles.input} />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Stock {formData.allowByWeight ? '(Gramos)' : '(Unidades)'}</label>
              <input 
                type="number" 
                step="1" 
                name={formData.allowByWeight ? 'stockGrams' : 'stockUnits'} 
                value={formData.allowByWeight ? formData.stockGrams : formData.stockUnits} 
                onChange={handleChange} 
                placeholder={formData.allowByWeight ? 'Ej: 10000 (10 Kg)' : 'Ej: 50'}
                style={styles.input} 
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={{ ...styles.group, flex: '2' }}>
              <label style={styles.label}>Imagen del Producto</label>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: '0.8rem' }} />
            </div>
            {formData.image && <div style={styles.preview}><img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flex: '1', justifyContent: 'flex-end' }}>
              <button type="submit" style={styles.btnSubmit}>{editingId ? 'Guardar Cambios' : 'Agregar Producto'}</button>
              {editingId && <button type="button" onClick={handleCancelEdit} style={styles.btnCancel}>Cancelar</button>}
            </div>
          </div>

        </form>
      </div>

      {/* Catálogo de Productos */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.title}>CATÁLOGO DE PRODUCTOS REGISTRADOS</h2>
        {products.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay productos cargados.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={styles.th}>Imagen</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Modalidades</th>
                  <th style={styles.th}>Precio Kg / Gramos</th>
                  <th style={styles.th}>Precio Unidad</th>
                  <th style={styles.th}>Stock</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const prodId = p._id || p.id;
                  const isWeight = p.allowByWeight ?? (p.sellType === 'peso');
                  const isUnit = p.allowByUnit ?? (p.sellType === 'unidad');

                  return (
                    <tr key={prodId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={styles.td}>{p.image ? <img src={p.image} alt={p.name} style={styles.tableImg} /> : <div style={styles.noImg}>Sin foto</div>}</td>
                      <td style={styles.td}><strong>{p.name}</strong></td>
                      <td style={styles.td}><span style={styles.badgeCat}>{p.category || 'Panadería'}</span></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {isWeight && <span style={styles.badgeType}>PESO / $</span>}
                          {isUnit && <span style={styles.badgeType}>UNIDAD</span>}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {p.priceKg ? `$${parseFloat(p.priceKg).toFixed(2)} / Kg` : isWeight ? `$${parseFloat(p.price || 0).toFixed(2)} / Kg` : '-'}
                      </td>
                      <td style={styles.td}>
                        {p.priceUnit ? `$${parseFloat(p.priceUnit).toFixed(2)}` : isUnit ? `$${parseFloat(p.price || 0).toFixed(2)}` : '-'}
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: p.stock <= 500 ? '#dc2626' : '#166534', fontWeight: 'bold' }}>
                          {p.stock || 0} {p.stockUnit || (isWeight ? 'gr' : 'un')}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button onClick={() => handleEdit(p)} style={styles.btnEdit}>Editar</button>
                        <button onClick={() => handleDelete(prodId)} style={styles.btnDel}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' },
  title: { fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 15px 0', color: '#0f172a' },
  formContainer: { display: 'flex', flexDirection: 'column', gap: '14px' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' },
  group: { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '140px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#475569' },
  input: { padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  optionsBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '6px' },
  optionsTitle: { fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' },
  checkboxLabel: { fontSize: '0.8rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' },
  preview: { width: '42px', height: '42px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1' },
  btnSubmit: { backgroundColor: '#1b4332', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.85rem' },
  th: { padding: '10px 8px', textAlign: 'left', color: '#475569', fontWeight: '600' },
  td: { padding: '10px 8px', color: '#334155', verticalAlign: 'middle' },
  tableImg: { width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' },
  noImg: { width: '36px', height: '36px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badgeCat: { backgroundColor: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '500' },
  badgeType: { backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '600' },
  btnEdit: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginRight: '6px', cursor: 'pointer' },
  btnDel: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }
};

export default ProductsManager;