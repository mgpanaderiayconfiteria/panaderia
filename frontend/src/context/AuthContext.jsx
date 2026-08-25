import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mg_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('mg_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      setUser(data);
      localStorage.setItem('mg_user', JSON.stringify(data));
      if (data.token) {
        localStorage.setItem('mg_token', data.token);
      }
      return { success: true, user: data };
    } catch (error) {
      // Fallback local: Administrador
      if (email === 'mgpanaderiayconfiteria@gmail.com' && password === 'pana80y2') {
        const adminUser = {
          _id: 'USR-ADMIN',
          email,
          name: 'MG Administrador',
          role: 'admin',
          isAdmin: true
        };
        setUser(adminUser);
        localStorage.setItem('mg_user', JSON.stringify(adminUser));
        return { success: true, user: adminUser };
      }

      // Fallback local: Cajero / Empleado de prueba
      if (email === 'caja@mgpanaderia.com' && password === 'caja123') {
        const cajeroUser = {
          _id: 'USR-CAJA1',
          email,
          name: 'Empleado Caja',
          role: 'cajero',
          isAdmin: false
        };
        setUser(cajeroUser);
        localStorage.setItem('mg_user', JSON.stringify(cajeroUser));
        return { success: true, user: cajeroUser };
      }

      return { success: false, message: error.message || 'Credenciales incorrectas' };
    }
  };

  // Cierre de sesión centralizado
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mg_user');
    localStorage.removeItem('mg_token');
    localStorage.removeItem('mg_initial_cash'); // Opcional: elimina también el fondo de caja activo
  };

  const value = {
    user,
    currentUser: user, // Alias para compatibilidad con el resto del sistema
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin' || user?.isAdmin === true,
    isCajero: user?.role === 'cajero' || user?.role === 'empleado'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};