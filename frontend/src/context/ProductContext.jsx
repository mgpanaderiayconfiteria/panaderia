import React, { createContext, useState, useEffect } from 'react';

export const ProductContext = createContext();

// URL exacta del Web Service (Backend en Node.js)
const BACKEND_URL = 'https://panaderia-2syo.onrender.com';

const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : BACKEND_URL;

const API_URL = `${BASE_URL}/api/products`;

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('⚠️ Respuesta no JSON en GET /api/products:', response.status, text);
        return;
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error de red en fetchProducts:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (productData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('⚠️ Error en POST /api/products:', response.status, text);
        alert(`Error al guardar (${response.status}): Revisá que la API esté activa.`);
        return;
      }

      const savedProduct = await response.json();
      setProducts((prev) => [savedProduct, ...prev]);
    } catch (error) {
      console.error('Error de red en addProduct:', error);
    }
  };

  const updateProduct = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('⚠️ Error en PUT /api/products:', response.status, text);
        return;
      }

      const updatedProduct = await response.json();
      setProducts((prev) =>
        prev.map((p) => ((p._id || p.id) === id ? updatedProduct : p))
      );
    } catch (error) {
      console.error('Error en updateProduct:', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) return;
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
    } catch (error) {
      console.error('Error en deleteProduct:', error);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        fetchProducts
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};