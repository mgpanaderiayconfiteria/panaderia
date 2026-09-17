import React, { createContext, useState, useEffect } from 'react';

export const SaleContext = createContext();

export const SaleProvider = ({ children }) => {
  const [sales, setSales] = useState([]);
  const [cashSessions, setCashSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const [isCashDiscountActive, setIsCashDiscountActive] = useState(() => {
    const savedState = localStorage.getItem('mg_cash_discount_active');
    return savedState ? JSON.parse(savedState) : false;
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    localStorage.setItem('mg_cash_discount_active', JSON.stringify(isCashDiscountActive));
  }, [isCashDiscountActive]);

  // Carga inicial de sesiones de caja e historial local
  useEffect(() => {
    const storedSessions = localStorage.getItem('mg_cash_sessions');
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions);
        setCashSessions(parsed);
        const active = parsed.find((s) => s.status === 'open');
        if (active) setCurrentSession(active);
      } catch (e) {
        console.error('Error al parsear sesiones de caja:', e);
      }
    }
    fetchSales();
  }, []);

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

  // === MÉTODOS DE GESTIÓN DE SESIÓN DE CAJA (ARQUEOS) ===

  const openCashSession = (initialAmount, user) => {
    const newSession = {
      id: `SESS-${Date.now()}`,
      openedAt: new Date().toISOString(),
      closedAt: null,
      openedBy: user?.name || user?.email || 'Cajero',
      closedBy: null,
      initialAmount: parseFloat(initialAmount) || 0,
      expectedAmount: parseFloat(initialAmount) || 0,
      actualAmount: 0,
      difference: 0,
      totalSalesCount: 0,
      totalSalesAmount: 0,
      status: 'open'
    };

    const updatedSessions = [newSession, ...cashSessions];
    setCashSessions(updatedSessions);
    setCurrentSession(newSession);
    localStorage.setItem('mg_cash_sessions', JSON.stringify(updatedSessions));
    return newSession;
  };

  const closeCashSession = (actualAmount, user) => {
    if (!currentSession) return null;

    // Filtrar solo las ventas cobradas durante ESTA sesión de caja
    const currentSales = sales.filter((s) => s.cashSessionId === currentSession.id || s.status === 'completed');
    const totalSalesAmount = currentSales.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
    const expected = currentSession.initialAmount + totalSalesAmount;
    const actual = parseFloat(actualAmount) || 0;

    const closedSession = {
      ...currentSession,
      closedAt: new Date().toISOString(),
      closedBy: user?.name || user?.email || 'Cajero',
      expectedAmount: expected,
      actualAmount: actual,
      difference: actual - expected,
      totalSalesCount: currentSales.length,
      totalSalesAmount: totalSalesAmount,
      status: 'closed'
    };

    const updatedSessions = cashSessions.map((s) => (s.id === currentSession.id ? closedSession : s));
    setCashSessions(updatedSessions);
    setCurrentSession(null);
    localStorage.setItem('mg_cash_sessions', JSON.stringify(updatedSessions));

    return closedSession;
  };

  // Agregar Venta asociada al ID de Sesión Activa
  const addSale = async (saleData) => {
    const payload = {
      items: saleData.items || [],
      paymentMethod: saleData.paymentMethod || 'efectivo',
      isCashDiscountActive: isCashDiscountActive,
      paidAmount: saleData.paidAmount,
      changeAmount: saleData.changeAmount || 0,
      seller: saleData.sellerId && saleData.sellerId.length === 24 ? saleData.sellerId : undefined,
      employee: saleData.sellerName || saleData.cashier || 'Empleado Caja',
      status: saleData.status || 'completed',
      cashSessionId: currentSession?.id || null,
      requiresInvoice: saleData.requiresInvoice || false,
      invoiceType: saleData.invoiceType || null,
      clientEmail: saleData.clientEmail || null,
      clientDocNum: saleData.clientDocNum || null,
      clientName: saleData.clientName || null
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
        setSales((prev) => [createdOrder, ...prev]);
        return createdOrder;
      } else {
        throw new Error('Error al registrar orden');
      }
    } catch (error) {
      const subtotal = saleData.subtotal || saleData.total || 0;
      const discountAmount = (isCashDiscountActive && payload.paymentMethod === 'efectivo') ? subtotal * 0.10 : 0;
      const totalFinal = subtotal - discountAmount;

      const fallbackSale = {
        _id: `SALE-LOCAL-${Date.now()}`,
        id: `SALE-${Date.now()}`,
        cashSessionId: currentSession?.id || null,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        dateStr: new Date().toLocaleDateString('es-AR'),
        timeStr: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        sellerName: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
        cashier: saleData.sellerName || saleData.cashier || 'Cajero Desconocido',
        items: saleData.items || [],
        paymentMethod: payload.paymentMethod,
        subtotal: subtotal,
        discountAmount: discountAmount,
        total: totalFinal,
        paidAmount: saleData.paidAmount || totalFinal,
        changeAmount: saleData.changeAmount || 0,
        status: saleData.status || 'completed'
      };

      setSales((prev) => [fallbackSale, ...prev]);
      return fallbackSale;
    }
  };

  const deleteSale = async (saleId) => {
    setSales((prev) => prev.filter((s) => (s._id || s.id) !== saleId));
    return { success: true };
  };

  // Obtiene únicamente las ventas del turno activo actual
  const currentTurnSales = currentSession
    ? sales.filter((s) => s.cashSessionId === currentSession.id)
    : sales;

  return (
    <SaleContext.Provider
      value={{
        sales: currentTurnSales,
        allSales: sales,
        cashSessions,
        currentSession,
        openCashSession,
        closeCashSession,
        addSale,
        deleteSale,
        fetchSales,
        loading,
        isCashDiscountActive,
        toggleCashDiscount
      }}
    >
      {children}
    </SaleContext.Provider>
  );
};