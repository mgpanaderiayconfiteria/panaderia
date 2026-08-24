import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { SaleProvider } from './context/SaleContext';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import CajaHome from './pages/CajaHome';
import NuevoCliente from './pages/NuevoCliente';
import AdminPanel from './components/AdminPanel';

function ProtectedRoute({ children, roleRequired }) {
  const { user, isAdmin } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired === 'admin' && !isAdmin && user?.role !== 'admin') {
    return <Navigate to="/caja" replace />;
  }

  return children;
}

function AppContent() {
  const { user, isAdmin } = useContext(AuthContext);
  const userIsAdmin = isAdmin || user?.role === 'admin';

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to={userIsAdmin ? "/admin" : "/caja"} replace /> : <Login />} 
        />
        
        {/* Vista principal de Caja */}
        <Route 
          path="/caja" 
          element={
            <ProtectedRoute>
              <CajaHome />
            </ProtectedRoute>
          } 
        />

        {/* Módulo Punto de Venta / Nuevo Cliente */}
        <Route 
          path="/nuevo-cliente" 
          element={
            <ProtectedRoute>
              <NuevoCliente />
            </ProtectedRoute>
          } 
        />

        {/* Panel de Administrador */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto */}
        <Route 
          path="*" 
          element={<Navigate to={user ? (userIsAdmin ? "/admin" : "/caja") : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <SaleProvider>
          <AppContent />
        </SaleProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;