import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { SaleProvider } from './context/SaleContext';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import CajaHome from './pages/CajaHome';
import NuevoCliente from './pages/NuevoCliente';
import UltimosMovimientos from './pages/UltimosMovimientos';
import AdminPanel from './pages/AdminPanel'; // Ajustado a la carpeta /pages/ si corresponde

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
        
        <Route 
          path="/caja" 
          element={
            <ProtectedRoute>
              <CajaHome />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/nuevo-cliente" 
          element={
            <ProtectedRoute>
              <NuevoCliente />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/ultimos-movimientos" 
          element={
            <ProtectedRoute>
              <UltimosMovimientos />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

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