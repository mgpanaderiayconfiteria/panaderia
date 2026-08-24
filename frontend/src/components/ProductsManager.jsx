import React, { useState, useContext } from 'react';
import { ProductContext } from '../context/ProductContext';

const INITIAL_FORM = {
  name: '',
  category: 'Panadería',
  allowByUnit: true,
  allowByWeight: false,
  allowByPorcion: false,
  allowByAmount: false,
  priceUnit: '',
  priceKg: '',
  pricePorcion: '',
  cogs: '',
  stockUnits: '',
  stockGrams: '',
  stockPorciones: '',
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

    const payload = {
      ...formData,
      priceUnit: parseFloat(formData.priceUnit || 0),
      priceKg: parseFloat(formData.priceKg || 0),
      pricePorcion: parseFloat(formData.pricePorcion || 0),
      cogs: parseFloat(formData.cogs || 0),
      stockUnits: parseFloat(formData.stockUnits || 0),
      stockGrams: parseFloat(formData.stockGrams || 0),
      stockPorciones: parseFloat(formData.stockPorciones || 0)
    };

    editingId ? await updateProduct(editingId, payload) : await addProduct(payload);
    handleCancelEdit();
  };

  const handleEdit = (p) => {
    setEditingId(p._id || p.id);
    setFormData({
      name: p.name || '',
      category: p.category || 'Panadería',
      allowByUnit: p.allowByUnit ?? true,
      allowByWeight: p.allowByWeight ?? false,
      allowByPorcion: p.allowByPorcion ?? false,
      allowByAmount: p.allowByAmount ?? false,
      priceUnit: p.priceUnit || '',
      priceKg: p.priceKg || '',
      pricePorcion: p.pricePorcion || '',
      cogs: p.cogs || '',
      stockUnits: p.stockUnits || '',
      stockGrams: p.stockGrams || '',
      stockPorciones: p.stockPorciones || '',
      image: p.image || ''
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      await deleteProduct(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={styles.card}>
        <h2 style={styles.title}>{editingId ? 'EDITAR PRODUCTO MULTI-MODAL' : 'ALTA DE PRODUCTO MULTI-MODAL'}</h2>
        <form onSubmit={handleSubmit} style={styles.formContainer}>
          
          <div style={styles.formRow}>
            <div style={{ ...styles.group, flex: '2' }}>
              <label style={styles.label}>Nombre del Producto</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ej. Tarta de Manzana / Pan Francés" style={styles.input} required />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
                {['Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Costo Est. ($)</label>
              <input type="number" step="0.01" name="cogs" value={formData.cogs} onChange={handleChange} placeholder="0.00" style={styles.input} />
            </div>
          </div>

          {/* Opciones de Modalidades de Venta */}
          <div style={styles.optionsBox}>
            <span style={styles.optionsTitle}>Modalidades de Venta y Cobro Habilitadas:</span>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByUnit" checked={formData.allowByUnit} onChange={handleChange} />
                Por Unidad (Facturas, Panes)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByWeight" checked={formData.allowByWeight} onChange={handleChange} />
                Por Peso en Gramos / Kg
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByPorcion" checked={formData.allowByPorcion} onChange={handleChange} />
                Por Porción / Fracción (Tartas)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" name="allowByAmount" checked={formData.allowByAmount} onChange={handleChange} />
                Por Monto Fijo en $ (ej. $4000 de pan)
              </label>
            </div>
          </div>

          {/* Secciones Dinámicas de Precios */}
          <div style={styles.formRow}>
            {formData.allowByUnit && (
              <div style={styles.group}>
                <label style={styles.label}>Precio por Unidad ($)</label>
                <input type="number" step="0.01" name="priceUnit" value={formData.priceUnit} onChange={handleChange} placeholder="Ej. 500" style={styles.input} required={formData.allowByUnit} />
              </div>
            )}

            {(formData.allowByWeight || formData.allowByAmount) && (
              <div style={styles.group}>
                <label style={styles.label}>Precio por Kilo ($)</label>
                <input type="number" step="0.01" name="priceKg" value={formData.priceKg} onChange={handleChange} placeholder="Ej. 3200" style={styles.input} required={formData.allowByWeight || formData.allowByAmount} />
              </div>
            )}

            {formData.allowByPorcion && (
              <div style={styles.group}>
                <label style={styles.label}>Precio por Porción ($)</label>
                <input type="number" step="0.01" name="pricePorcion" value={formData.pricePorcion} onChange={handleChange} placeholder="Ej. 1200" style={styles.input} required={formData.allowByPorcion} />
              </div>
            )}
          </div>

          {/* Secciones Dinámicas de Stocks Independientes */}
          <div style={styles.formRow}>
            {formData.allowByUnit && (
              <div style={styles.group}>
                <label style={styles.label}>Stock en Unidades (un)</label>
                <input type="number" step="1" name="stockUnits" value={formData.stockUnits} onChange={handleChange} placeholder="Ej. 120" style={styles.input} />
              </div>
            )}

            {formData.allowByWeight && (
              <div style={styles.group}>
                <label style={styles.label}>Stock en Gramos (gr)</label>
                <input type="number" step="1" name="stockGrams" value={formData.stockGrams} onChange={handleChange} placeholder="Ej. 15000 (15 kg)" style={styles.input} />
              </div>
            )}

            {formData.allowByPorcion && (
              <div style={styles.group}>
                <label style={styles.label}>Stock en Porciones (porc)</label>
                <input type="number" step="1" name="stockPorciones" value={formData.stockPorciones} onChange={handleChange} placeholder="Ej. 8" style={styles.input} />
              </div>
            )}
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

      {/* Tabla del Catálogo con Detalle Multi-Modal */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.title}>CATÁLOGO COMPLETO DE PRODUCTOS</h2>
        {products.length === 0 ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay productos cargados.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={styles.th}>Imagen</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Modalidades Habilitadas</th>
                  <th style={styles.th}>Precios de Venta</th>
                  <th style={styles.th}>Inventario / Stock</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const prodId = p._id || p.id;
                  return (
                    <tr key={prodId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={styles.td}>
                        {p.image ? <img src={p.image} alt={p.name} style={styles.tableImg} /> : <div style={styles.noImg}>Sin foto</div>}
                      </td>
                      <td style={styles.td}><strong>{p.name}</strong></td>
                      <td style={styles.td}><span style={styles.badgeCat}>{p.category || 'Panadería'}</span></td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {p.allowByUnit && <span style={styles.badgeType}>UNIDAD</span>}
                          {p.allowByWeight && <span style={styles.badgeType}>PESO (GR/KG)</span>}
                          {p.allowByPorcion && <span style={styles.badgeType}>PORCIÓN</span>}
                          {p.allowByAmount && <span style={styles.badgeType}>MONTO $</span>}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {p.allowByUnit && <div>• Un: <strong>${parseFloat(p.priceUnit || 0).toFixed(2)}</strong></div>}
                          {p.allowByWeight && <div>• Kg: <strong>${parseFloat(p.priceKg || 0).toFixed(2)}</strong></div>}
                          {p.allowByPorcion && <div>• Porción: <strong>${parseFloat(p.pricePorcion || 0).toFixed(2)}</strong></div>}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {p.allowByUnit && <div>• <strong>{p.stockUnits || 0}</strong> un</div>}
                          {p.allowByWeight && <div>• <strong>{p.stockGrams || 0}</strong> gr</div>}
                          {p.allowByPorcion && <div>• <strong>{p.stockPorciones || 0}</strong> porc</div>}
                        </div>
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
  group: { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '130px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#475569' },
  input: { padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  optionsBox: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px' },
  optionsTitle: { fontSize: '0.75rem', fontWeight: 'bold', color: '#334155' },
  checkboxLabel: { fontSize: '0.8rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' },
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