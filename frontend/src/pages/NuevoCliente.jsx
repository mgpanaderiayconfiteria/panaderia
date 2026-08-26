import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import { SaleContext } from '../context/SaleContext';
import { AuthContext } from '../context/AuthContext';

const NuevoCliente = () => {
  const navigate = useNavigate();
  const { products } = useContext(ProductContext);
  const { addSale, isCashDiscountActive } = useContext(SaleContext);
  const { user } = useContext(AuthContext);

  // Extracción dinámica de categorías de los productos cargados
  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return uniqueCats.length > 0 ? uniqueCats : ['General'];
  }, [products]);

  const [activeCategory, setActiveCategory] = useState(categories[0] || 'General');
  const [activeSubcategory, setActiveSubcategory] = useState('Todas');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [activeTab, setActiveTab] = useState('catalog');
  const [cart, setCart] = useState([]);
  const [sellMode, setSellMode] = useState('weight');
  const [quantity, setQuantity] = useState('');
  
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select_method');
  const [cashGiven, setCashGiven] = useState('');
  const [digitalGiven, setDigitalGiven] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Subcategorías dinámicas filtradas por la categoría seleccionada
  const subcategories = useMemo(() => {
    const subCats = products
      .filter((p) => (p.category || 'General') === activeCategory && p.subcategory)
      .map((p) => p.subcategory);
    return ['Todas', ...Array.from(new Set(subCats))];
  }, [products, activeCategory]);

  useEffect(() => {
    setActiveSubcategory('Todas');
  }, [activeCategory]);

  // Productos filtrados según Categoría y Subcategoría
  const categoryProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = (p.category || 'General') === activeCategory;
      const matchSub = activeSubcategory === 'Todas' || p.subcategory === activeSubcategory;
      return matchCat && matchSub;
    });
  }, [products, activeCategory, activeSubcategory]);

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
      category: selectedProduct.category || 'General',
      subcategory: selectedProduct.subcategory || '',
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

  // Lógica del descuento de efectivo (10%)
  const cashDiscountAmount = useMemo(() => {
    return isCashDiscountActive ? totalCart * 0.10 : 0;
  }, [isCashDiscountActive, totalCart]);

  const finalCashTotal = useMemo(() => {
    return totalCart - cashDiscountAmount;
  }, [totalCart, cashDiscountAmount]);

  const changeCashAmount = useMemo(() => {
    const given = parseFloat(cashGiven) || 0;
    return given >= finalCashTotal ? given - finalCashTotal : 0;
  }, [cashGiven, finalCashTotal]);

  const changeDigitalAmount = useMemo(() => {
    const given = parseFloat(digitalGiven) || 0;
    return given >= totalCart ? given - totalCart : 0;
  }, [digitalGiven, totalCart]);

  const handleConfirmCashSale = async () => {
    const given = parseFloat(cashGiven) || 0;
    if (given < finalCashTotal) return;

    setIsSubmitting(true);
    try {
      await addSale({
        sellerId: user?._id || user?.id,
        sellerName: user?.name || user?.email || 'Empleado Caja',
        sellerRole: user?.role || 'cajero',
        cashier: user?.name || user?.email || 'Empleado Caja',
        items: cart,
        paymentMethod: 'efectivo',
        subtotal: totalCart,
        discountAmount: cashDiscountAmount,
        total: finalCashTotal,
        paidAmount: given,
        changeAmount: changeCashAmount,
        timestamp: new Date().toISOString()
      });

      setShowCheckoutModal(false);
      setCart([]);
      setCashGiven('');
      setDigitalGiven('');
      setPaymentStep('select_method');
      navigate('/caja');
    } catch (e) {
      alert('Error al procesar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDigitalSale = async () => {
    const given = parseFloat(digitalGiven) || 0;
    if (given < totalCart) return;

    setIsSubmitting(true);
    try {
      await addSale({
        sellerId: user?._id || user?.id,
        sellerName: user?.name || user?.email || 'Empleado Caja',
        sellerRole: user?.role || 'cajero',
        cashier: user?.name || user?.email || 'Empleado Caja',
        items: cart,
        paymentMethod: 'digital',
        subtotal: totalCart,
        discountAmount: 0,
        total: totalCart,
        paidAmount: given,
        changeAmount: changeDigitalAmount,
        timestamp: new Date().toISOString()
      });

      setShowCheckoutModal(false);
      setCart([]);
      setCashGiven('');
      setDigitalGiven('');
      setPaymentStep('select_method');
      navigate('/caja');
    } catch (e) {
      alert('Error al procesar la venta.');
    } finally {
      setIsSubmitting(false);
    }
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

        .subcategory-bar {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px 14px 8px 14px;
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
          transition: transform 0.1s ease, background-color 0.1s ease;
        }

        .bottom-floating-bar:active {
          transform: scale(0.99);
          background-color: #b91c1c;
        }

        button {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease, box-shadow 0.1s ease;
          user-select: none;
        }

        button:active:not(:disabled) {
          transform: scale(0.94);
        }

        .product-card-item {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          user-select: none;
        }

        .product-card-item:active {
          transform: scale(0.95);
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

      {/* PESTAÑA CATÁLOGO DE PRODUCTOS */}
      {activeTab === 'catalog' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* BARRA DE CATEGORÍAS */}
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

          {/* BARRA DE SUBCATEGORÍAS DINÁMICAS (SI EXISTEN) */}
          {subcategories.length > 1 && (
            <div className="subcategory-bar">
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubcategory(sub)}
                  style={{
                    ...styles.subCategoryTab,
                    backgroundColor: activeSubcategory === sub ? '#7f1d1d' : '#ffffff',
                    color: activeSubcategory === sub ? '#ffffff' : '#991b1b',
                    border: activeSubcategory === sub ? '1px solid #7f1d1d' : '1px solid #fca5a5'
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <div className="product-grid">
            {categoryProducts.map((p) => {
              const prodId = p._id || p.id;
              return (
                <div key={prodId} onClick={() => handleSelectProduct(p)} className="product-card-item" style={styles.productCard}>
                  {p.image ? <img src={p.image} alt={p.name} style={styles.cardImg} /> : <div style={styles.noCardImg}>🥐</div>}
                  <div style={styles.cardFooter}>
                    <span style={styles.cardTitle}>{p.name}</span>
                    {p.subcategory && <span style={{ fontSize: '0.65rem', color: '#991b1b', marginTop: '2px' }}>{p.subcategory}</span>}
                  </div>
                </div>
              );
            })}
          </div>

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

      {/* PESTAÑA PEDIDO */}
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
                <span>TOTAL ESTIMADO:</span>
                <strong style={{ fontSize: '1.6rem', color: '#dc2626' }}>${totalCart.toFixed(2)}</strong>
              </div>

              {isCashDiscountActive && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534', fontWeight: '600' }}>
                  ⚡ Descuento del 10% en efectivo disponible en el momento del pago.
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setActiveTab('catalog')} style={{ ...styles.btnAgregarMas, flex: 1, padding: '12px' }}>
                  ← Volver al catálogo
                </button>
                <button
                  onClick={() => { 
                    setShowCheckoutModal(true); 
                    setPaymentStep('select_method');
                    setCashGiven('');
                    setDigitalGiven('');
                  }}
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

      {/* MODAL COBRO */}
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
                  <span style={{ fontSize: '0.9rem', color: '#991b1b' }}>TOTAL SUBTOTAL</span>
                  <h1 style={{ margin: 0, fontSize: '2.2rem', color: '#dc2626' }}>${totalCart.toFixed(2)}</h1>
                </div>

                <button 
                  onClick={() => {
                    setCashGiven(finalCashTotal.toString());
                    setPaymentStep('cash_details');
                  }} 
                  style={styles.btnMethodCash}
                >
                  💵 PAGO EN EFECTIVO {isCashDiscountActive && '(10% OFF)'}
                </button>

                <button 
                  onClick={() => {
                    setDigitalGiven(totalCart.toString());
                    setPaymentStep('digital_details');
                  }} 
                  style={styles.btnMethodDigital}
                >
                  💳 PAGO DIGITAL (SIN DESCUENTO)
                </button>
              </div>
            )}

            {/* DETALLES DE PAGO EN EFECTIVO */}
            {paymentStep === 'cash_details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={styles.summaryBox}>
                  <span>Subtotal:</span>
                  <strong>${totalCart.toFixed(2)}</strong>
                </div>

                {isCashDiscountActive && (
                  <div style={{ ...styles.summaryBox, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                    <span>Descuento Efectivo (10%):</span>
                    <strong>-${cashDiscountAmount.toFixed(2)}</strong>
                  </div>
                )}

                <div style={{ ...styles.summaryBox, backgroundColor: '#fef2f2', border: '2px solid #dc2626' }}>
                  <span style={{ fontWeight: 'bold' }}>TOTAL CON DESCUENTO:</span>
                  <strong style={{ fontSize: '1.3rem', color: '#dc2626' }}>${finalCashTotal.toFixed(2)}</strong>
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
                    disabled={isSubmitting}
                  />
                </div>

                <div style={styles.quickPresetsRow}>
                  <button onClick={() => setCashGiven(finalCashTotal.toString())} style={styles.presetBtn} disabled={isSubmitting}>Monto Exacto</button>
                  <button onClick={() => setCashGiven('1000')} style={styles.presetBtn} disabled={isSubmitting}>$1.000</button>
                  <button onClick={() => setCashGiven('2000')} style={styles.presetBtn} disabled={isSubmitting}>$2.000</button>
                  <button onClick={() => setCashGiven('5000')} style={styles.presetBtn} disabled={isSubmitting}>$5.000</button>
                  <button onClick={() => setCashGiven('10000')} style={styles.presetBtn} disabled={isSubmitting}>$10.000</button>
                </div>

                <div style={{ ...styles.subtotalDisplay, backgroundColor: '#fef2f2' }}>
                  <span style={{ fontSize: '1.1rem' }}>VUELTO:</span>
                  <strong style={{ fontSize: '1.8rem', color: (parseFloat(cashGiven) || 0) < finalCashTotal ? '#991b1b' : '#dc2626' }}>
                    ${changeCashAmount.toFixed(2)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentStep('select_method')} style={{ ...styles.btnVolver, flex: 1 }} disabled={isSubmitting}>
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmCashSale}
                    disabled={(parseFloat(cashGiven) || 0) < finalCashTotal || isSubmitting}
                    style={{
                      ...styles.btnAddCart,
                      flex: 2,
                      backgroundColor: ((parseFloat(cashGiven) || 0) < finalCashTotal || isSubmitting) ? '#fca5a5' : '#dc2626',
                      cursor: ((parseFloat(cashGiven) || 0) < finalCashTotal || isSubmitting) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR Y REGISTRAR'}
                  </button>
                </div>
              </div>
            )}

            {/* DETALLES DE PAGO DIGITAL */}
            {paymentStep === 'digital_details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ ...styles.summaryBox, backgroundColor: '#eff6ff', border: '2px solid #2563eb' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e40af' }}>TOTAL A TRANSFERIR / PAGAR:</span>
                  <strong style={{ fontSize: '1.3rem', color: '#2563eb' }}>${totalCart.toFixed(2)}</strong>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Monto transferido / abonado ($):</label>
                  <input
                    type="number"
                    value={digitalGiven}
                    onChange={(e) => setDigitalGiven(e.target.value)}
                    placeholder="Monto recibido digitalmente"
                    autoFocus
                    style={{ ...styles.touchInput, borderColor: '#2563eb' }}
                    disabled={isSubmitting}
                  />
                </div>

                <div style={styles.quickPresetsRow}>
                  <button onClick={() => setDigitalGiven(totalCart.toString())} style={styles.presetBtn} disabled={isSubmitting}>Monto Exacto</button>
                  <button onClick={() => setDigitalGiven('1000')} style={styles.presetBtn} disabled={isSubmitting}>$1.000</button>
                  <button onClick={() => setDigitalGiven('2000')} style={styles.presetBtn} disabled={isSubmitting}>$2.000</button>
                  <button onClick={() => setDigitalGiven('5000')} style={styles.presetBtn} disabled={isSubmitting}>$5.000</button>
                  <button onClick={() => setDigitalGiven('10000')} style={styles.presetBtn} disabled={isSubmitting}>$10.000</button>
                </div>

                {changeDigitalAmount > 0 && (
                  <div style={{ ...styles.subtotalDisplay, backgroundColor: '#eff6ff' }}>
                    <span style={{ fontSize: '0.9rem', color: '#1e40af' }}>DIFERENCIA / SALDO:</span>
                    <strong style={{ fontSize: '1.4rem', color: '#2563eb' }}>
                      ${changeDigitalAmount.toFixed(2)}
                    </strong>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentStep('select_method')} style={{ ...styles.btnVolver, flex: 1 }} disabled={isSubmitting}>
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmDigitalSale}
                    disabled={(parseFloat(digitalGiven) || 0) < totalCart || isSubmitting}
                    style={{
                      ...styles.btnAddCart,
                      flex: 2,
                      backgroundColor: ((parseFloat(digitalGiven) || 0) < totalCart || isSubmitting) ? '#93c5fd' : '#2563eb',
                      cursor: ((parseFloat(digitalGiven) || 0) < totalCart || isSubmitting) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR VENTA DIGITAL'}
                  </button>
                </div>
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
  categoryTab: { padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' },
  subCategoryTab: { padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  productCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #fca5a5', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.08)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', minHeight: '130px' },
  cardImg: { width: '100%', height: '85px', objectFit: 'cover' },
  noCardImg: { width: '100%', height: '85px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' },
  cardFooter: { padding: '6px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
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
  btnMethodDigital: { padding: '14px', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', fontSize: '1rem', borderRadius: '10px', border: 'none', cursor: 'pointer' },
  summaryBox: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '1rem', border: '1px solid #fca5a5' }
};

export default NuevoCliente;