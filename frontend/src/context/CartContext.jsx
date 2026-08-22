import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cartItems');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      // Sanitizamos para ignorar elementos nulos o sin _id
      return Array.isArray(parsed) 
        ? parsed.filter(item => item && item._id) 
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Agregar al carrito (Soporta combinación de Producto + Variante/Talle/Color)
  const addToCart = (product, quantityToAdd = 1) => {
    if (!product || !product._id) return;

    const variantId = product.selectedVariant?._id || 'unique';
    // Generamos un ID único para la combinación prenda + talle/color
    const cartItemId = `${product._id}_${variantId}`;

    setCartItems((prevItems) => {
      const exists = prevItems.find((x) => x.cartItemId === cartItemId);
      
      // Normalizar precio para minorista
      const actualPrice = Number(product.priceRetail || product.price || 0);

      if (exists) {
        const currentQty = exists.qty || exists.quantity || 0;
        const newQty = currentQty + quantityToAdd;

        return prevItems.map((x) =>
          x.cartItemId === cartItemId 
            ? { 
                ...x, 
                qty: newQty, 
                quantity: newQty // Sincronizamos ambas props
              } 
            : x
        );
      }

      // Si es una combinación variante/producto nueva
      const newProduct = { 
        ...product,
        cartItemId,
        variantId,
        price: actualPrice,
        priceRetail: actualPrice,
        qty: quantityToAdd,
        quantity: quantityToAdd // Sincronizamos ambas props
      };

      return [...prevItems, newProduct];
    });
  };

  // Actualizar cantidad específica (+1 / -1) usando cartItemId
  const updateQuantity = (cartItemId, delta) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.cartItemId === cartItemId || item._id === cartItemId) {
            const currentQty = item.qty || item.quantity || 1;
            const newQty = currentQty + delta;
            return newQty > 0 
              ? { ...item, qty: newQty, quantity: newQty } 
              : null;
          }
          return item;
        })
        .filter(Boolean) // Elimina los items que dieron null (cantidad <= 0)
    );
  };

  // Eliminar producto/variante del carrito
  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => 
      prevItems.filter((x) => x && x.cartItemId !== cartItemId && x._id !== cartItemId)
    );
  };

  // Vaciar carrito
  const clearCart = () => setCartItems([]);

  // CÁLCULOS DE MONTO SEGUROS
  const cartTotal = cartItems.reduce((acc, item) => {
    if (!item) return acc;
    const price = Number(item.priceRetail || item.price || 0)
    const quantity = Number(item.qty || item.quantity || 0);
    return acc + (price * quantity);
  }, 0);

  // Contador total de prendas para el badge del Navbar
  const totalCount = cartItems.reduce((acc, item) => {
    if (!item) return acc;
    return acc + Number(item.qty || item.quantity || 0);
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        totalCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};