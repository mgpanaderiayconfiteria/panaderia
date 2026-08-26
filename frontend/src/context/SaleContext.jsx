import React, { createContext, useState, useEffect } from 'react';

export const SaleContext = createContext();

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado del descuento del 10% en efectivo, guardado en localStorage
  const [isCashDiscountActive, setIsCashDiscountActive] = useState(() => {
    const savedState = localStorage.getItem('mg_cash_discount_active');
    return savedState ? JSON.parse(savedState) : false;
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Guardar en localStorage cuando cambie la promo
  useEffect(() => {
    localStorage.setItem('mg_cash_discount_active', JSON.stringify(isCashDiscountActive));
  }, [isCashDiscountActive]);

  const toggleCashDiscount = () => {
    setIsCashDiscountActive((prev) => !prev);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('mg_user'));
      const token = storedUser?.token;

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error al obtener ventas desde el servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const addSale = async (saleData) => {
    // Enviamos el flag de la promo al servidor para que este aplique y valide las cuentas
    const payload = {
      items: saleData.items || [],
      paymentMethod: saleData.paymentMethod || 'efectivo',
      isCashDiscountActive: isCashDiscountActive, // Flag global
      paidAmount: saleData.paidAmount,
      changeAmount: saleData.changeAmount || 0,
      seller: saleData.sellerId && saleData.sellerId.length === 24 ? saleData.sellerId : undefined,
      employee: saleData.sellerName || saleData.cashier || 'Empleado Caja',
      status: saleData.status || 'completed'
    };

    try {
      const storedUser = JSON.parse(localStorage.getItem('mg_user'));
      const token = storedUser?.token;

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const createdOrder = await response.json();
        setSales((prevSales) => [createdOrder, ...prevSales]);
        return createdOrder;
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error en el servidor al registrar la orden');
      }
    } catch (error) {
      console.warn('Conexión con servidor fallida. Guardando en modo contingencia local:', error);
      
      // Contingencia local calculada adecuadamente
      const subtotal = saleData.subtotal || saleData.total || 0;
      const discountAmount = (isCashDiscountActive && payload.paymentMethod === 'efectivo') ? subtotal * 0.10 : 0;
      const totalFinal = subtotal - discountAmount;

      const fallbackSale = {
        _id: `SALE-LOCAL-${Date.now()}`,
        id: `SALE-${Date.now()}`,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('es-AR'),
        timeStr: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        sellerName: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
        cashier: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
        sellerRole: saleData.sellerRole || 'cajero',
        items: saleData.items || [],
        paymentMethod: payload.paymentMethod,
        subtotal: subtotal,
        discountAmount: discountAmount,
        isCashDiscountApplied: isCashDiscountActive && payload.paymentMethod === 'efectivo',
        total: totalFinal,
        paidAmount: saleData.paidAmount || totalFinal,
        changeAmount: saleData.changeAmount || 0,
        status: saleData.status || 'completed'
      };

      setSales((prevSales) => [fallbackSale, ...prevSales]);
      return fallbackSale;
    }
  };

  const deleteSale = async (saleId) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('mg_user'));
      const token = storedUser?.token;

      if (saleId.toString().startsWith('SALE-LOCAL-')) {
        setSales((prevSales) => prevSales.filter((s) => (s._id || s.id) !== saleId));
        return { success: true };
      }

      const response = await fetch(`${API_URL}/api/orders/${saleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Error al eliminar la orden en el servidor');
      }

      setSales((prevSales) => prevSales.filter((s) => (s._id || s.id) !== saleId));
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <SaleContext.Provider value={{ 
      sales, 
      addSale, 
      deleteSale, 
      fetchSales, 
      loading,
      isCashDiscountActive,
      toggleCashDiscount
    }}>
      {children}
    </SaleContext.Provider>
  );
};