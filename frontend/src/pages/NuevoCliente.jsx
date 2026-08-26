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

  const [activeTab, setActiveTab] = useState('catalog');
  
  const [cart, setCart] = useState([]);
  const [sellMode, setSellMode] = useState('weight');
  const [quantity, setQuantity] = useState('');
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select_method');
  const [cashGiven, setCashGiven] = useState('');

  const categoryProducts = useMemo(() => {
    return products.filter((p) => (p.category || 'Panadería') === activeCategory);
  }, [products, activeCategory]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
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
    const basePrice = parseFloat(selectedProduct.price || selectedProduct.priceUnit || selectedProduct.priceKg || 0);

    if (sellMode === 'unit') {
      const unitPrice = parseFloat(selectedProduct.priceUnit || basePrice);
      const priceHalf = parseFloat(selectedProduct.priceHalfDozen || 0);
      const priceDozen = parseFloat(selectedProduct.priceDozen || 0);

      if (val === 6 && priceHalf > 0) return priceHalf;
      if (val === 12 && priceDozen > 0) return priceDozen;

      return val * unitPrice;
    }

    if (sellMode === 'weight') return (val / 1000) * parseFloat(selectedProduct.priceKg || basePrice);
    if (sellMode === 'portion') return val * parseFloat(selectedProduct.pricePorcion || selectedProduct.pricePortion || basePrice);
    if (sellMode === 'amount') return val;
    return 0;
  }, [selectedProduct, sellMode, quantity]);

  const handleAddToCart = () => {
    if (!selectedProduct || calculatedSubtotal <= 0) return;
    let detailLabel = '';
    const val = parseFloat(quantity);

    if (sellMode === 'unit') {
      const priceHalf = parseFloat(selectedProduct.priceHalfDozen || 0);
      const priceDozen = parseFloat(selectedProduct.priceDozen || 0);

      if (val === 6 && priceHalf > 0) {
        detailLabel = '1/2 Docena (6 un)';
      } else if (val === 12 && priceDozen > 0) {
        detailLabel = '1 Docena (12 un)';
      } else {
        detailLabel = `${val} un`;
      }
    }
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
  const totalItemsCount = useMemo(() => cart.length, [cart]);
  
  const changeAmount = useMemo(() => {
    const given = parseFloat(cashGiven) || 0;
    return given >= totalCart ? given - totalCart : 0;
  }, [cashGiven, totalCart]);

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
      changeAmount: changeAmount,
      timestamp: new Date().toISOString()
    });

    setShowCheckoutModal(false);
    setCart([]);
    setCashGiven('');
    setPaymentStep('select_method');
    navigate('/caja');
  };

  return (
    <div className="pos-tabbed-container">
      <style>{`
        .pos-tabbed-container {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
          width: 100%;
          background-color: #fef2f2;
          box-sizing: border-box;
          position: relative;
          padding-bottom: ${cart.length > 0 && activeTab === 'catalog' ? '70px' : '0px'};
        }

        .header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background-color: #ffffff;
          border-bottom: 1px solid #fca5a5;
        }

        .category-bar {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 10px 14px 4px 14px;
          -webkit-overflow-scrolling: touch;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 10px;
          padding: 12px 14px;
        }

        .cart-tab-view {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 14px;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .bottom-floating-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #dc2626;
          color: #ffffff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 -4px 12px rgba(185, 28, 28, 0.25);
          z-index: 100;
          cursor: pointer;
        }

        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 14px;
          }
        }
      `}</style>

      {/* HEADER PRINCIPAL */}
      <div className="header-nav">
        <button onClick={() => navigate('/caja')} style={styles.btnVolver}>← Salir a Caja</button>
        
        {/* NAVEGACIÓN ENTRE PESTAÑAS */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            style={{
              ...styles.tabSwitchBtn,
              backgroundColor: activeTab === 'catalog' ? '#dc2626' : '#fecaca',
              color: activeTab === 'catalog' ? '#ffffff' : '#7f1d1d'
            }}
          >
            🥐 Catálogo
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            style={{
              ...styles.tabSwitchBtn,
              backgroundColor: activeTab === 'cart' ? '#dc2626' : '#fecaca',
              color: activeTab === 'cart' ? '#ffffff' : '#7f1d1d'
            }}
          >
            🛒 Pedido ({totalItemsCount})
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: CATÁLOGO DE PRODUCTOS */}
      {activeTab === 'catalog' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="category-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...styles.categoryTab,
                  backgroundColor: activeCategory === cat ? '#dc2626' : '#ffffff',
                  color: activeCategory === cat ? '#ffffff' : '#7f1d1d',
                  border: activeCategory === cat ? '2px solid #dc2626' : '1px solid #fca5a5'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="product-grid">
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

          {/* BARRA FLOTANTE EN CATÁLOGO SI HAY PRODUCTOS EN CARRITO */}
          {cart.length > 0 && (
            <div className="bottom-floating-bar" onClick={() => setActiveTab('cart')}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'}</span>
                <strong style={{ fontSize: '1.2rem' }}>Total: ${totalCart.toFixed(2)}</strong>
              </div>
              <button style={styles.btnVerPedido}>Ver Pedido / Pagar ➔</button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: REVISIÓN DEL PEDIDO Y PAGOS */}
      {activeTab === 'cart' && (
        <div className="cart-tab-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#7f1d1d' }}>DETALLE DEL PEDIDO</h2>
            <button onClick={() => setActiveTab('catalog')} style={styles.btnAgregarMas}>
              ➕ Agregar más productos
            </button>
          </div>

          <div style={styles.cartItemsContainer}>
            {cart.length === 0 ? (
              <div style={styles.emptyCart}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🛒</span>
                <span>El pedido está vacío. Tocá el botón de arriba para sumar productos desde el catálogo.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} style={styles.cartItemRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <strong style={{ fontSize: '0.95rem', color: '#7f1d1d' }}>{item.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#991b1b' }}>{item.detailLabel}</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#dc2626', marginRight: '12px' }}>
                    ${item.subtotal.toFixed(2)}
                  </strong>
                  <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} style={styles.btnDelete}>✕</button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={styles.cartSummaryFooter}>
              <div style={styles.totalRow}>
                <span>TOTAL A PAGAR:</span>
                <strong style={{ fontSize: '1.6rem', color: '#dc2626' }}>${totalCart.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setActiveTab('catalog')} style={{ ...styles.btnAgregarMas, flex: 1, padding: '12px' }}>
                  ← Volver al catálogo
                </button>
                <button
                  onClick={() => { setShowCheckoutModal(true); setPaymentStep('select_method'); }}
                  style={styles.btnPagarMain}
                >
                  PROCEDER AL PAGO ➔
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL SELECCIÓN DE CANTIDAD/PESO */}
      {selectedProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#7f1d1d' }}>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} style={styles.btnClose}>✕</button>
            </div>
            
            <div style={styles.modeSelectorRow}>
              <button onClick={() => { setSellMode('weight'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'weight' ? '#dc2626' : '#fecaca', color: sellMode === 'weight' ? '#fff' : '#7f1d1d' }}>⚖️ Pesado (Gramos)</button>
              <button onClick={() => { setSellMode('unit'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'unit' ? '#dc2626' : '#fecaca', color: sellMode === 'unit' ? '#fff' : '#7f1d1d' }}>🔢 Unidades</button>
              <button onClick={() => { setSellMode('portion'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'portion' ? '#dc2626' : '#fecaca', color: sellMode === 'portion' ? '#fff' : '#7f1d1d' }}>🍰 Porciones</button>
              <button onClick={() => { setSellMode('amount'); setQuantity(''); }} style={{ ...styles.modeBtn, backgroundColor: sellMode === 'amount' ? '#dc2626' : '#fecaca', color: sellMode === 'amount' ? '#fff' : '#7f1d1d' }}>💵 Monto $</button>
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
              <strong style={{ fontSize: '1.4rem', color: '#dc2626' }}>${calculatedSubtotal.toFixed(2)}</strong>
            </div>

            <button onClick={handleAddToCart} disabled={calculatedSubtotal <= 0} style={{ ...styles.btnAddCart, backgroundColor: calculatedSubtotal <= 0 ? '#fca5a5' : '#dc2626', cursor: calculatedSubtotal <= 0 ? 'not-allowed' : 'pointer' }}>➕ AGREGAR AL PEDIDO</button>
          </div>
        </div>
      )}

      {/* MODAL DE COBRO */}
      {showCheckoutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#7f1d1d' }}>COBRO DE PEDIDO</h3>
              <button onClick={() => setShowCheckoutModal(false)} style={styles.btnClose}>✕</button>
            </div>

            {paymentStep === 'select_method' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ textAlign: 'center', margin: '10px 0' }}>
                  <span style={{ fontSize: '0.9rem', color: '#991b1b' }}>TOTAL A COBRAR</span>
                  <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#dc2626' }}>${totalCart.toFixed(2)}</h1>
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

                <div style={{ ...styles.subtotalDisplay, backgroundColor: (parseFloat(cashGiven) || 0) < totalCart ? '#fef2f2' : '#fef2f2' }}>
                  <span style={{ fontSize: '1.1rem' }}>VUELTO:</span>
                  <strong style={{ fontSize: '1.8rem', color: (parseFloat(cashGiven) || 0) < totalCart ? '#991b1b' : '#dc2626' }}>
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
                      backgroundColor: (parseFloat(cashGiven) || 0) < totalCart ? '#fca5a5' : '#dc2626',
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
                <h3 style={{ margin: 0, color: '#7f1d1d' }}>PAGO DIGITAL EN STANDBY</h3>
                <p style={{ fontSize: '0.85rem', color: '#991b1b', margin: 0 }}>
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
  tabSwitchBtn: { padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  categoryTab: { padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  productCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #fca5a5', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', minHeight: '130px' },
  cardImg: { width: '100%', height: '85px', objectFit: 'cover' },
  noCardImg: { width: '100%', height: '85px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' },
  cardFooter: { padding: '6px', textAlign: 'center', width: '100%' },
  cardTitle: { fontSize: '0.8rem', fontWeight: 'bold', color: '#7f1d1d', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  btnVolver: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fff', color: '#7f1d1d', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  btnVerPedido: { backgroundColor: '#ffffff', color: '#dc2626', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' },
  btnAgregarMas: { backgroundColor: '#ffffff', border: '1px solid #dc2626', color: '#dc2626', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' },
  cartItemsContainer: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #fca5a5', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px', maxHeight: '50dvh', overflowY: 'auto' },
  emptyCart: { padding: '40px 20px', textAlign: 'center', color: '#f87171', fontSize: '0.9rem' },
  cartItemRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' },
  btnDelete: { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' },
  cartSummaryFooter: { marginTop: '16px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #fca5a5', display: 'flex', flexDirection: 'column', gap: '8px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: '#7f1d1d' },
  btnPagarMain: { flex: 2, padding: '14px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 6px rgba(220, 38, 38, 0.2)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(127, 29, 29, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '15px' },
  modalCard: { backgroundColor: '#ffffff', width: '95%', maxWidth: '440px', maxHeight: '90dvh', overflowY: 'auto', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 20px 25px -5px rgba(127, 29, 29, 0.3)', borderTop: '5px solid #dc2626' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fca5a5', paddingBottom: '8px' },
  btnClose: { backgroundColor: '#fecaca', color: '#991b1b', border: 'none', borderRadius: '6px', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 'bold' },
  modeSelectorRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' },
  modeBtn: { padding: '8px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' },
  quickPresetsRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  presetBtn: { flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '6px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', fontSize: '0.75rem', fontWeight: 'bold', color: '#7f1d1d', cursor: 'pointer' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  inputLabel: { fontSize: '0.8rem', fontWeight: 'bold', color: '#991b1b' },
  touchInput: { width: '100%', padding: '10px', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center', borderRadius: '8px', border: '2px solid #dc2626', outline: 'none', boxSizing: 'border-box' },
  subtotalDisplay: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2' },
  btnAddCart: { width: '100%', padding: '12px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', border: 'none' },
  btnMethodCash: { padding: '14px', backgroundColor: '#dc2626', color: '#fff', fontWeight: 'bold', fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  btnMethodDigital: { padding: '14px', backgroundColor: '#991b1b', color: '#fff', fontWeight: 'bold', fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  summaryBox: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #fca5a5' }
};

export default NuevoCliente;