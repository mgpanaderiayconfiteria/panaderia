import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import CajaHome from './pages/CajaHome';
import AdminPanel from './components/AdminPanel';

function ProtectedRoute({ children, roleRequired }) {
  const { user, isAdmin } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se requiere rol de admin y el usuario no lo es, se lo reorienta a la caja
  if (roleRequired === 'admin' && !isAdmin && user?.role !== 'admin') {
    return <Navigate to="/caja" replace />;
  }

  return children;
}

function App() {
  const { user, isAdmin } = useContext(AuthContext);

  // Determinar si el usuario posee privilegios administrativos
  const userIsAdmin = isAdmin || user?.role === 'admin';

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to={userIsAdmin ? "/admin" : "/caja"} replace /> : <Login />} 
        />
        
        {/* Vista exclusiva para Cajeros y personal operativo */}
        <Route 
          path="/caja" 
          element={
            <ProtectedRoute>
              <CajaHome />
            </ProtectedRoute>
          } 
        />

        {/* Panel exclusivo para Administrador */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto según perfil */}
        <Route 
          path="*" 
          element={<Navigate to={user ? (userIsAdmin ? "/admin" : "/caja") : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;