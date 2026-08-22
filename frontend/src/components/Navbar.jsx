import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

export default function Navbar() {
  const { cart } = useContext(CartContext);
  const location = useLocation();

  // Calcular la cantidad total de artículos en el carrito
  const totalItems = cart ? cart.reduce((acc, item) => acc + (item.quantity || 1), 0) : 0;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-rose-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center">
        
        {/* NAVEGACIÓN */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs uppercase tracking-wider font-medium">
          <Link 
            to="/" 
            className={`transition-colors duration-200 ${
              isActive('/') ? 'text-rose-900 font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Inicio
          </Link>

          <Link 
            to="/catalogo" 
            className={`transition-colors duration-200 ${
              isActive('/catalogo') ? 'text-rose-900 font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Catálogo
          </Link>

          <Link 
            to="/carrito" 
            className={`relative flex items-center gap-1.5 transition-colors duration-200 ${
              isActive('/carrito') ? 'text-rose-900 font-semibold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span>Carrito</span>
            <span className="text-sm">🛍️</span>
            {totalItems > 0 && (
              <span className="bg-stone-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center -ml-1">
                {totalItems}
              </span>
            )}
          </Link>

          <Link 
            to="/admin" 
            className={`transition-colors duration-200 text-[11px] px-2.5 py-1 rounded-xs border ${
              isActive('/admin') 
                ? 'bg-stone-900 text-white border-stone-900' 
                : 'border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-800'
            }`}
          >
            Admin
          </Link>
        </nav>

      </div>
    </header>
  );
}