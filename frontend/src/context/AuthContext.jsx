import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

// Limpieza profunda de la URL de la API y anti-duplicación
const getCleanApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'https://luisinnapilcheria-api.onrender.com/api';

  // Si por error la URL viene duplicada (ej: dom.com/apihttps://dom.com/api)
  if ((url.match(/https?:\/\//g) || []).length > 1) {
    const parts = url.split(/(?=https?:\/\/)/);
    url = parts[parts.length - 1]; // Toma únicamente la última URL válida
  }

  // Sanitizado básico de comillas, corchetes y barras finales
  url = url.replace(/[\[\]\(\)'"]/g, '').trim().replace(/\/+$/, '');

  // Asegura la terminación en /api
  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const API_URL = getCleanApiUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userInfo');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    try {
      // Intento principal a /auth/login
      let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      // Fallback a /login directo si la API no usa el prefijo /auth
      if (res.status === 404) {
        res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });
      }

      const contentType = res.headers.get('content-type');
      let data = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.message || `Error en el servidor (${res.status})`);
      }

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      // Si el backend envía token, lo guardamos explícitamente para el uso de peticiones protegidas
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return { success: true };
    } catch (error) {
      console.error('Error en Login:', error);
      return { 
        success: false, 
        message: error.message || 'No se pudo conectar con el servidor. Verificá si el backend terminó de despertar en Render.' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};