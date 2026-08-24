import React, { createContext, useState } from 'react';

export const SaleContext = createContext();

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);

  // Registrar una venta asociando usuario/cajero, ítems y montos detallados
  const addSale = (saleData) => {
    const newSale = {
      id: saleData.id || `SALE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString('es-AR'),
      timeStr: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      
      // Datos del Vendedor / Cajero activo
      sellerId: saleData.sellerId || saleData.cashierId || 'N/A',
      sellerName: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
      sellerRole: saleData.sellerRole || 'cajero',
      
      items: saleData.items || [],
      paymentMethod: saleData.paymentMethod || 'efectivo', // 'efectivo' | 'digital'
      subtotal: saleData.subtotal || 0,
      discount: saleData.discount || 0,
      total: saleData.total || 0,
      paidAmount: saleData.paidAmount || saleData.total || 0,
      changeAmount: saleData.changeAmount || 0,
      status: saleData.status || 'completed'
    };

    setSales((prevSales) => [newSale, ...prevSales]);
    return newSale;
  };

  return (
    <SaleContext.Provider value={{ sales, addSale }}>
      {children}
    </SaleContext.Provider>
  );
};