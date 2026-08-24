import React, { createContext, useState, useEffect } from 'react';

export const SaleContext = createContext();

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Obtener ventas guardadas en MongoDB desde el backend
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

  // Registrar venta enviando datos completos al servidor y actualizando estado local
  const addSale = async (saleData) => {
    const payload = {
      items: saleData.items || [],
      subtotal: saleData.subtotal || 0,
      discount: saleData.discount || 0,
      total: saleData.total || 0,
      paidAmount: saleData.paidAmount || saleData.total || 0,
      changeAmount: saleData.changeAmount || 0,
      paymentMethod: saleData.paymentMethod || 'efectivo',
      seller: saleData.sellerId !== 'N/A' ? saleData.sellerId : undefined,
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
        throw new Error('Error en el servidor al registrar la orden');
      }
    } catch (error) {
      console.warn('Conexión con servidor fallida, guardando en modo contingencia local:', error);
      
      const fallbackSale = {
        _id: `SALE-LOCAL-${Date.now()}`,
        id: `SALE-${Date.now()}`,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('es-AR'),
        timeStr: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        sellerName: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
        sellerRole: saleData.sellerRole || 'cajero',
        items: saleData.items || [],
        paymentMethod: saleData.paymentMethod || 'efectivo',
        subtotal: saleData.subtotal || 0,
        discount: saleData.discount || 0,
        total: saleData.total || 0,
        paidAmount: saleData.paidAmount || saleData.total || 0,
        changeAmount: saleData.changeAmount || 0,
        status: saleData.status || 'completed'
      };

      setSales((prevSales) => [fallbackSale, ...prevSales]);
      return fallbackSale;
    }
  };

  return (
    <SaleContext.Provider value={{ sales, addSale, fetchSales, loading }}>
      {children}
    </SaleContext.Provider>
  );
};