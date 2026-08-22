import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import CajaHome from './pages/CajaHome';

function App() {
  return (
    <ProductProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Vista principal para el cajero */}
          <Route path="/" element={<CajaHome />} />
          <Route path="/caja" element={<CajaHome />} />
          
          {/* Panel de administración */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProductProvider>
  );
}

export default App;