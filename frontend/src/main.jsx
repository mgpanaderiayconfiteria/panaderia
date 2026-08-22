import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// 1. IMPORTAR GOOGLE ANALYTICS
import ReactGA from 'react-ga4';

// Contextos activos
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// 2. INICIALIZAR ANALYTICS (Reemplazá G-XXXXXXXXXX por tu ID real)
ReactGA.initialize('G-ZR6R1Z104T');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);