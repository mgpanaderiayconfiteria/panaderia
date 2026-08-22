import React, { createContext, useState, useEffect } from 'react';

export const ProductContext = createContext();

// Selección dinámica del servidor backend
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://mgpanaderia.onrender.com';

const API_URL = `${BASE_URL}/api/products`;

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  // Cargar productos desde la base de datos
  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('Respuesta no válida del servidor backend');
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error en fetchProducts:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Agregar nuevo producto (Alta en Backend)
  const addProduct = async (productData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('El servidor no devolvió un objeto JSON válido');
      }

      const savedProduct = await response.json();
      setProducts((prev) => [savedProduct, ...prev]);
    } catch (error) {
      console.error('Error en addProduct:', error);
    }
  };

  // Actualizar producto (Modificación en Backend)
  const updateProduct = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        throw new Error('Error al actualizar el producto en el servidor');
      }

      const updatedProduct = await response.json();

      setProducts((prev) =>
        prev.map((p) => ((p._id || p.id) === id ? updatedProduct : p))
      );
    } catch (error) {
      console.error('Error en updateProduct:', error);
    }
  };

  // Eliminar producto (Baja en Backend)
  const deleteProduct = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar el producto');

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