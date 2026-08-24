import React, { useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { SaleContext } from '../context/SaleContext';
import { AuthContext } from '../context/AuthContext';

const NuevoCliente = () => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { addSale } = useContext(SaleContext);
  const { user } = useContext(AuthContext);

  const categories = ['Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'];
  const [activeCategory, setActiveCategory] = useState('Panadería');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Estados de Carrito y Pop-ups
  const [cart, setCart] = useState([]);
  const [sellMode, setSellMode] = useState('weight'); // 'weight' | 'unit' | 'portion' | 'amount'
  const [quantity, setQuantity] = useState('');
  
  // Estados del Modal de Cobro
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select_method');
  const [cashGiven, setCashGiven] = useState('');

  const categoryProducts = useMemo(() => {
    return products.filter((p) => (p.category || 'Panadería') === activeCategory);
  }, [products, activeCategory]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    // Establecer modalidad inicial según datos o por defecto a 'weight' o 'unit'
    if (product.allowByWeight) setSellMode('weight');
    else if (product.allowByUnit) setSellMode('unit');
    else if (product.allowByPorcion || product.allowByPortion) setSellMode('portion');
    else if (product.allowByAmount) setSellMode('amount');
    else setSellMode('weight');
    setQuantity('');
  };

  const calculatedSubtotal = useMemo(() => {
    if (!selectedProduct || !quantity || isNaN(parseFloat(quantity))) return 0;
    const val = parseFloat(quantity);
    
    // Buscar el precio base disponible en el producto
    const basePrice = parseFloat(selectedProduct.price || selectedProduct.priceUnit || selectedProduct.priceKg || 0);

    if (sellMode === 'unit') return val * parseFloat(selectedProduct.priceUnit || basePrice);
    if (sellMode === 'weight') return (val / 1000) * parseFloat(selectedProduct.priceKg || basePrice);
    if (sellMode === 'portion') return val * parseFloat(selectedProduct.pricePorcion || selectedProduct.pricePortion || basePrice);
    if (sellMode === 'amount') return val;
    return 0;
  }, [selectedProduct, sellMode, quantity]);

  const handleAddToCart = () => {
    if (!selectedProduct || calculatedSubtotal <= 0) return;
    let detailLabel = '';
    const val = parseFloat(quantity);
    if (sellMode === 'unit') detailLabel = `${val} un`;
    if (sellMode === 'weight') detailLabel = `${val} gr (${(val / 1000).toFixed(2)} kg)`;
    if (sellMode === 'portion') detailLabel = `${val} porc`;
    if (sellMode === 'amount') detailLabel = `Monto libre ($${val})`;

    const cartItem = {
      id: Date.now(),
      productId: selectedProduct._id || selectedProduct.id,
      name: selectedProduct.name,
      category: selectedProduct.category || 'Panadería',
      mode: sellMode,
      quantityVal: val,
      unitPrice: calculatedSubtotal / (val || 1),
      detailLabel,
      subtotal: calculatedSubtotal
    };

    setCart((prev) => [...prev, cartItem]);
    setSelectedProduct(null);
    setQuantity('');
  };

  const totalCart = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  
  // Cálculo de Vuelto
  const changeAmount = useMemo(() => {
    const given = parseFloat(cashGiven) || 0;
    return given >= totalCart ? given - totalCart : 0;
  }, [cashGiven, totalCart]);

  // Finalizar la compra y registrar en MongoDB a través del SaleContext
  const handleConfirmCashSale = async () => {
    const given = parseFloat(cashGiven) || 0;
    if (given < totalCart) return;

    await addSale({
      sellerId: user?._id || user?.id,
      sellerName: user?.name || user?.email || 'Empleado Caja',
      sellerRole: user?.role || 'cajero',
      cashier: user?.name || user?.email || 'Empleado Caja',
      items: cart,
      paymentMethod: 'efectivo',
      subtotal: totalCart,
      total: totalCart,
      paidAmount: given,
      changeAmount: changeAmount
    });

    // Resetear estados y volver a la pantalla de CajaHome
    setShowCheckoutModal(false);
    setCart([]);
    setCashGiven('');
    setPaymentStep('select_method');
    navigate('/caja');
  };

  return (
    <div style={styles.container}>
      
      {/* TABLERO POS */}
      <div style={styles.posPanel}>
        <div style={styles.categoryBar}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.categoryTab,
                backgroundColor: activeCategory === cat ? '#1b4332' : '#ffffff',
                color: activeCategory === cat ? '#ffffff' : '#334155',
                border: activeCategory === cat ? '2px solid #1b4332' : '1px solid #cbd5e1'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={styles.productGrid}>
          {categoryProducts.map((p) => {
            const prodId = p._id || p.id;
            return (
              <div key={prodId} onClick={() => handleSelectProduct(p)} style={styles.productCard}>
                {p.image ? <img src={p.image} alt={p.name} style={styles.cardImg} /> : <div style={styles.noCardImg}>🥐</div>}
                <div style={styles.cardFooter}>
                  <span style={styles.cardTitle}>{p.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARRITO Y COBRO */}
      <div style={styles.cartPanel}>
        <div style={styles.cartHeader}>
          <button onClick={() => navigate('/caja')} style={styles.btnVolver}>← Volver</button>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>🛒 PEDIDO ACTUAL</h2>
        </div>

        <div style={styles.cartItemsContainer}>
          {cart.length === 0 ? (
            <div style={styles.emptyCart}><span>Tocá un producto para agregarlo al pedido</span></div>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={styles.cartItemRow}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{item.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.detailLabel}</span>
                </div>
                <strong style={{ fontSize: '1rem', color: '#166534', marginRight: '10px' }}>${item.subtotal.toFixed(2)}</strong>
                <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} style={styles.btnDelete}>✕</button>
              </div>
            ))
          )}
        </div>

        <div style={styles.cartFooter}>
          <div style={styles.totalRow}>
            <span>TOTAL:</span>
            <strong style={{ fontSize: '1.5rem', color: '#1b4332' }}>${totalCart.toFixed(2)}</strong>
          </div>
          <button
            onClick={() => { setShowCheckoutModal(true); setPaymentStep('select_method'); }}
            disabled={cart.length === 0}
            style={{ ...styles.btnFinalizar, backgroundColor: cart.length === 0 ? '#cbd5e1' : '#2e7d32', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            PAGAR Y FINALIZAR
          </button>
        </div>
      </div>

      {/* POP-UP SELECCIÓN DE CANTIDAD/PESO (Con las 4 modalidades habilitadas para todos los productos) */}
      {selectedProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} style={styles.btnClose}>✕</button>
            </div>
            
            {/* Opciones de venta disponibles siempre para que el vendedor elija */}
            <div style={styles.modeSelectorRow}>
              <button onClick={() => { setSellMode('weight'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'weight' ? '#0284c7' : '#e2e8f0', color: sellMode === 'weight' ? '#fff' : '#334155' }}>⚖️ Pesado (Gramos)</button>
              <button onClick={() => { setSellMode('unit'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'unit' ? '#0284c7' : '#e2e8f0', color: sellMode === 'unit' ? '#fff' : '#334155' }}>🔢 Unidades</button>
              <button onClick={() => { setSellMode('portion'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'portion' ? '#0284c7' : '#e2e8f0', color: sellMode === 'portion' ? '#fff' : '#334155' }}>🍰 Porciones</button>
              <button onClick={() => { setSellMode('amount'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'amount' ? '#0284c7' : '#e2e8f0', color: sellMode === 'amount' ? '#fff' : '#334155' }}>💵 Monto $</button>
            </div>

            <div style={styles.quickPresetsRow}>
              {sellMode === 'weight' && (
                <>
                  <button onClick={() => setQuantity('250')} style={styles.presetBtn}>1/4 Kg (250g)</button>
                  <button onClick={() => setQuantity('500')} style={styles.presetBtn}>1/2 Kg (500g)</button>
                  <button onClick={() => setQuantity('750')} style={styles.presetBtn}>3/4 Kg (750g)</button>
                  <button onClick={() => setQuantity('1000')} style={styles.presetBtn}>1 Kg (1000g)</button>
                </>
              )}
              {sellMode === 'unit' && (
                <>
                  <button onClick={() => setQuantity('1')} style={styles.presetBtn}>1 un</button>
                  <button onClick={() => setQuantity('6')} style={styles.presetBtn}>1/2 Docena (6)</button>
                  <button onClick={() => setQuantity('12')} style={styles.presetBtn}>1 Docena (12)</button>
                </>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>
                {sellMode === 'weight' && 'Ingrese gramos (ej: 250):'}
                {sellMode === 'unit' && 'Ingrese cantidad de unidades:'}
                {sellMode === 'portion' && 'Ingrese cantidad de porciones:'}
                {sellMode === 'amount' && 'Ingrese monto exacto en $:'}
              </label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" autoFocus style={styles.touchInput} />
            </div>

            <div style={styles.subtotalDisplay}>
              <span>Subtotal:</span>
              <strong style={{ fontSize: '1.4rem', color: '#166534' }}>${calculatedSubtotal.toFixed(2)}</strong>
            </div>

            <button onClick={handleAddToCart} disabled={calculatedSubtotal <= 0} style={{ ...styles.btnAddCart, backgroundColor: calculatedSubtotal <= 0 ? '#cbd5e1' : '#1b4332', cursor: calculatedSubtotal <= 0 ? 'not-allowed' : 'pointer' }}>➕ AGREGAR AL PEDIDO</button>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO */}
      {showCheckoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>COBRO DE PEDIDO</h3>
              <button onClick={() => setShowCheckoutModal(false)} style={styles.btnClose}>✕</button>
            </div>

            {paymentStep === 'select_method' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b' }}>TOTAL A COBRAR</span>
                  <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#166534' }}>${totalCart.toFixed(2)}</h1>
                </div>

                <button onClick={() => setPaymentStep('cash_details')} style={styles.btnMethodCash}>
                  💵 PAGO EN EFECTIVO
                </button>

                <button onClick={() => setPaymentStep('digital_standby')} style={styles.btnMethodDigital}>
                  💳 PAGO DIGITAL
                </button>
              </div>
            )}

            {paymentStep === 'cash_details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={styles.summaryBox}>
                  <span>Total a Pagar:</span>
                  <strong>${totalCart.toFixed(2)}</strong>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Paga con ($):</label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="Monto entregado por el cliente"
                    autoFocus
                    style={styles.touchInput}
                  />
                </div>

                <div style={styles.quickPresetsRow}>
                  <button onClick={() => setCashGiven(totalCart.toString())} style={styles.presetBtn}>Monto Exacto</button>
                  <button onClick={() => setCashGiven('1000')} style={styles.presetBtn}>$1.000</button>
                  <button onClick={() => setCashGiven('2000')} style={styles.presetBtn}>$2.000</button>
                  <button onClick={() => setCashGiven('5000')} style={styles.presetBtn}>$5.000</button>
                  <button onClick={() => setCashGiven('10000')} style={styles.presetBtn}>$10.000</button>
                </div>

                <div style={{ ...styles.subtotalDisplay, backgroundColor: (parseFloat(cashGiven) || 0) < totalCart ? '#fef2f2' : '#f0fdf4' }}>
                  <span style={{ fontSize: '1.1rem' }}>VUELTO:</span>
                  <strong style={{ fontSize: '1.8rem', color: (parseFloat(cashGiven) || 0) < totalCart ? '#dc2626' : '#166534' }}>
                    ${changeAmount.toFixed(2)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentStep('select_method')} style={{ ...styles.btnVolver, flex: 1 }}>
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmCashSale}
                    disabled={(parseFloat(cashGiven) || 0) < totalCart}
                    style={{
                      ...styles.btnAddCart,
                      flex: 2,
                      backgroundColor: (parseFloat(cashGiven) || 0) < totalCart ? '#cbd5e1' : '#2e7d32',
                      cursor: (parseFloat(cashGiven) || 0) < totalCart ? 'not-allowed' : 'pointer'
                    }}
                  >
                    CONFIRMAR Y REGISTRAR
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'digital_standby' && (
              <div style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '3rem' }}>⌛</div>
                <h3 style={{ margin: 0, color: '#0f172a' }}>PAGO DIGITAL EN STANDBY</h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                  El módulo de integración de pagos digitales (Mercado Pago / POSNET) se encuentra en desarrollo.
                </p>
                <button onClick={() => setPaymentStep('select_method')} style={{ ...styles.btnVolver, width: '100%' }}>
                  ← Seleccionar otro medio de pago
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f1f5f9', overflow: 'hidden' },
  posPanel: { flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', overflowY: 'auto' },
  categoryBar: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' },
  categoryTab: { padding: '14px 20px', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' },
  productCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', minHeight: '160px' },
  cardImg: { width: '100%', height: '110px', objectFit: 'cover' },
  noCardImg: { width: '100%', height: '110px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  cardFooter: { padding: '10px', textAlign: 'center', width: '100%' },
  cardTitle: { fontSize: '0.9rem', fontWeight: 'bold', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cartPanel: { width: '360px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '-2px 0 10px rgba(0,0,0,0.03)' },
  cartHeader: { padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc' },
  btnVolver: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontWeight: 'bold', cursor: 'pointer' },
  cartItemsContainer: { flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyCart: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '20px' },
  cartItemRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  btnDelete: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' },
  cartFooter: { padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#334155' },
  btnFinalizar: { width: '100%', padding: '16px', borderRadius: '10px', color: '#ffffff', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' },
  modalCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: '480px', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' },
  btnClose: { backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' },
  modeSelectorRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  modeBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  quickPresetsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  presetBtn: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', cursor: 'pointer' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
  touchInput: { width: '100%', padding: '12px', fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'center', borderRadius: '8px', border: '2px solid #0284c7', outline: 'none' },
  subtotalDisplay: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' },
  btnAddCart: { width: '100%', padding: '14px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '1rem', border: 'none' },
  btnMethodCash: { padding: '16px', backgroundColor: '#15803d', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  btnMethodDigital: { padding: '16px', backgroundColor: '#0284c7', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  summaryBox: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '1.1rem', border: '1px solid #e2e8f0' }
};

export default NuevoCliente;