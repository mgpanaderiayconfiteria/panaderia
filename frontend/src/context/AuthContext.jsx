import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('mg_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
      return { success: true, user: data };
    } catch (error) {
      // Validación fallback con credenciales acordadas
      if (email === 'mgpanaderiayconfiteria@gmail.com' && password === 'pana80y2') {
        const adminUser = {
          email,
          name: 'MG Administrador',
          role: 'admin',
          isAdmin: true
        };
        setUser(adminUser);
        localStorage.setItem('mg_user', JSON.stringify(adminUser));
        return { success: true, user: adminUser };
      }

      return { success: false, message: error.message || 'Credenciales incorrectas' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mg_user');
  };

  const value = {
    user,
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