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

  if (roleRequired === 'admin' && !isAdmin) {
    return <Navigate to="/caja" replace />;
  }

  return children;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' || user.isAdmin ? "/admin" : "/caja"} replace /> : <Login />} />
        
        {/* Vista del cajero */}
        <Route 
          path="/caja" 
          element={
            <ProtectedRoute>
              <CajaHome />
            </ProtectedRoute>
          } 
        />

        {/* Panel del Administrador */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to={user ? "/caja" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;