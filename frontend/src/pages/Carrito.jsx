import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const WHATSAPP_NUMBER = '5493482202857';

const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';
  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1];
  }
  return url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '').concat(url.endsWith('/api') ? '' : '/api');
};

const API_URL = getCleanApiUrl();

export default function Carrito() {
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useContext(CartContext);

  const navigate = useNavigate();

  const [step, setStep] = useState('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dni: '',
    taxType: 'Consumidor Final',
    address: '',
    city: '',
    notes: ''
  });

  useEffect(() => {
    document.title = "Carrito - Luisinna Pilcheria";
  }, []);

  // Cargar algunos productos sugeridos
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        if (response.ok) {
          const data = await response.json();
          const cartIds = new Set(cartItems.map((item) => item._id));
          const filtered = data.filter((p) => !cartIds.has(p._id));
          setRelatedProducts(filtered.slice(0, 3));
        }
      } catch (error) {
        console.error("Error al obtener productos sugeridos:", error);
      }
    };

    fetchRelatedProducts();
  }, [cartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getItemUnitPrice = (item) => {
    const qty = Number(item.qty || 1);
    const wholesalePrice = Number(item.priceWholesale || 0);
    const retailPrice = Number(item.priceRetail || item.price || 0);
    const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;

    if (wholesalePrice > 0 && qty >= minQty) {
      return wholesalePrice;
    }
    return retailPrice;
  };

  const computedSubtotal = cartItems.reduce((acc, item) => {
    return acc + (getItemUnitPrice(item) * item.qty);
  }, 0);

  const computedTotal = computedSubtotal;

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const orderPayload = {
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dni: formData.dni,
        taxType: formData.taxType,
        city: formData.city,
        address: formData.address,
        notes: formData.notes
      },
      items: cartItems.map((item) => {
        const unitPrice = getItemUnitPrice(item);
        return {
          product: item._id,
          _id: item._id,
          name: item.name,
          qty: Number(item.qty),
          price: unitPrice,
          variant: item.selectedVariant ? {
            _id: item.selectedVariant._id,
            size: item.selectedVariant.size,
            color: item.selectedVariant.color
          } : null
        };
      }),
      subtotal: computedSubtotal,
      discount: 0,
      total: computedTotal,
      status: 'pendiente_pago'
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error devuelto por la API:", response.status, errorText);
      } else {
        const dataCreated = await response.json();
        console.log("✅ Pedido guardado en BD con éxito:", dataCreated);
      }
    } catch (error) {
      console.error("❌ Error de red/conexión al guardar el pedido:", error);
    } finally {
      let message = `*✨ NUEVO PEDIDO - LUISINNA PILCHERIA ✨*\n\n`;
      message += `*👤 Cliente:* ${formData.fullName}\n`;
      message += `*📱 Teléfono:* ${formData.phone}\n`;
      message += `*📧 Email:* ${formData.email}\n`;
      message += `*📄 DNI/CUIT:* ${formData.dni} (${formData.taxType})\n`;
      message += `*🏙️ Localidad:* ${formData.city}\n`;
      message += `*📍 Dirección:* ${formData.address}\n`;
      if (formData.notes) message += `*📝 Notas:* ${formData.notes}\n`;
      
      message += `\n*🛍️ DETALLE DE PRENDAS:*\n`;
      cartItems.forEach((item) => {
        const unitPrice = getItemUnitPrice(item);
        const itemTotal = unitPrice * item.qty;
        const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;
        const isWholesale = Number(item.priceWholesale) > 0 && item.qty >= minQty;
        
        const variantText = item.selectedVariant 
          ? ` (Talle: ${item.selectedVariant.size} - Color: ${item.selectedVariant.color})` 
          : '';

        message += `• ${item.name}${variantText} x${item.qty} - $${itemTotal.toLocaleString('es-AR')}${isWholesale ? ' *(Precio Mayorista)*' : ''}\n`;
      });

      message += `\n*💰 TOTAL ESTIMADO:* $${computedTotal.toLocaleString('es-AR')}\n\n`;
      message += `_¡Hola! Quisiera coordinar el pago, confirmar el total y coordinar el envío. ¡Muchas gracias!_`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

      clearCart();
      setIsProcessing(false);
      window.open(whatsappUrl, '_blank');
      navigate('/');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-rose-100 mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-light uppercase tracking-wide text-stone-900 flex items-center gap-2">
            <span>🛍️</span> {step === 'cart' ? 'Tu Carrito de Compras' : 'Finalizar Pedido'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {step === 'cart' ? 'Revisá tus prendas antes de confirmar el pedido' : 'Ingresá tus datos para coordinar el envío'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {step === 'checkout' && (
            <button
              onClick={() => setStep('cart')}
              className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xs transition flex items-center gap-1 cursor-pointer"
            >
              ← Volver al Carrito
            </button>
          )}
          <button
            onClick={() => navigate('/catalogo')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
          >
            Ver más prendas
          </button>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xs border border-rose-200 shadow-2xs space-y-4">
          <span className="text-5xl">👗</span>
          <h3 className="text-base font-semibold text-stone-800 uppercase tracking-wide">El carrito está vacío</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-light">
            Explorá nuestro catálogo y elegí tus prendas favoritas de Luisinna Pilcheria.
          </p>
          <button
            onClick={() => navigate('/catalogo')}
            className="inline-block bg-stone-900 text-white text-xs font-medium uppercase tracking-widest px-6 py-3 rounded-xs hover:bg-stone-800 transition cursor-pointer"
          >
            Ver Catálogo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            
            {step === 'cart' ? (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const itemKey = item.cartItemId || item._id;
                  const unitPrice = getItemUnitPrice(item);
                  const minQty = Number(item.minWholesaleQty) > 0 ? Number(item.minWholesaleQty) : 1;
                  const isWholesale = Number(item.priceWholesale) > 0 && item.qty >= minQty;

                  return (
                    <div
                      key={itemKey}
                      className="bg-white p-3.5 rounded-xs border border-rose-100 shadow-2xs flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 bg-stone-50 rounded-xs border border-stone-100 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-medium text-xs text-stone-800 uppercase truncate">{item.name}</h4>
                          {isWholesale && (
                            <span className="bg-stone-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                              🔥 Precio Mayorista
                            </span>
                          )}
                        </div>

                        {/* Muestra de Talle y Color */}
                        {item.selectedVariant && (
                          <p className="text-[11px] font-semibold text-rose-900 mt-0.5">
                            Talle: {item.selectedVariant.size} | Color: {item.selectedVariant.color}
                          </p>
                        )}

                        <p className="text-xs text-stone-500 mt-0.5 font-light">
                          ${unitPrice.toLocaleString('es-AR')} c/u
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-stone-300 rounded-xs overflow-hidden bg-stone-50">
                            <button
                              onClick={() => updateQuantity(itemKey, -1)}
                              className="px-2.5 py-0.5 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2.5 text-xs font-bold text-stone-800">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(itemKey, 1)}
                              className="px-2.5 py-0.5 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(itemKey)}
                            className="text-[11px] text-rose-800 hover:text-rose-950 transition font-medium cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-stone-900">
                          ${(unitPrice * item.qty).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-stone-500 hover:text-rose-800 transition cursor-pointer"
                  >
                    🗑️ Vaciar todo el carrito
                  </button>
                </div>
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handlePaymentSubmit} className="bg-white p-6 rounded-xs border border-rose-200 shadow-2xs space-y-4 text-xs">
                <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide flex items-center gap-2">
                    📋 Datos de Facturación y Envío
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-xs">
                    Directo a WhatsApp
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-stone-700 mb-1">Nombre y Apellido Completo *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Ej: María Laura Giménez"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="ejemplo@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="Ej: 3482202857"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">DNI / CUIT *</label>
                    <input
                      type="text"
                      name="dni"
                      required
                      placeholder="12345678"
                      value={formData.dni}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Condición Fiscal *</label>
                    <select
                      name="taxType"
                      value={formData.taxType}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    >
                      <option value="Consumidor Final">Consumidor Final</option>
                      <option value="Monotributo">Monotributo</option>
                      <option value="Responsable Inscripto">Responsable Inscripto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Localidad / Ciudad *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      placeholder="Ej: Reconquista, Avellaneda..."
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Dirección *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Calle 12 N° 345"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-stone-700 mb-1">Aclaraciones o Notas para el pedido</label>
                    <textarea
                      name="notes"
                      rows="2"
                      placeholder="Talles de preferencia, aclaraciones de envío, etc."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* PRODUCTOS RECOMENDADOS */}
            {relatedProducts.length > 0 && (
              <div className="bg-white p-4 rounded-xs border border-rose-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span>✨</span> También te podría interesar
                  </h4>
                  <button
                    onClick={() => navigate('/catalogo')}
                    className="text-[10px] font-semibold text-rose-800 hover:underline"
                  >
                    Ver todo
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {relatedProducts.map((product) => {
                    const price = product.priceRetail || product.price || 0;
                    return (
                      <div
                        key={product._id}
                        className="bg-stone-50 p-2 rounded-xs border border-stone-100 flex flex-col justify-between items-center text-center group"
                      >
                        <div className="w-full h-20 bg-white rounded-xs overflow-hidden mb-1.5 flex items-center justify-center p-1 border border-stone-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="w-full">
                          <p className="text-[10px] font-medium text-stone-800 truncate uppercase">{product.name}</p>
                          <p className="text-[10px] font-bold text-stone-900 mt-0.5">${Number(price).toLocaleString('es-AR')}</p>
                        </div>
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="mt-2 w-full bg-stone-900 hover:bg-stone-800 text-white text-[9px] font-bold py-1 px-1 rounded-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          + Agregar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* RESUMEN DE COMPRA */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-xs border border-rose-200 shadow-2xs sticky top-6 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-800 border-b border-rose-100 pb-3 flex items-center justify-between">
                <span>Resumen de Compra</span>
                <span className="text-[10px] text-stone-400 font-normal">({cartItems.length} prendas)</span>
              </h3>

              <div className="space-y-2.5 text-xs text-stone-600">
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                  <span>Total Estimado:</span>
                  <span className="text-base text-stone-900">${computedTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 text-xs uppercase tracking-[0.2em] rounded-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Cargar Datos de Envío</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className={`w-full py-3.5 text-white font-semibold text-xs uppercase tracking-[0.2em] rounded-xs transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                    isProcessing
                      ? 'bg-stone-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Registrando Pedido...</span>
                    </>
                  ) : (
                    <>
                      <span>📱 Enviar Pedido por WhatsApp</span>
                    </>
                  )}
                </button>
              )}

              <div className="pt-2 border-t border-rose-100 space-y-2 text-center">
                <div className="flex items-center justify-center gap-3 text-stone-400 text-lg">
                  <span title="WhatsApp Directo">📱</span>
                  <span title="Múltiples Formas de Pago">💳</span>
                  <span title="Atención Personalizada">🛍️</span>
                </div>
                <p className="text-[10px] text-stone-400 font-medium">
                  Al hacer clic se enviará el pedido directamente al WhatsApp de Luisinna Pilcheria.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}