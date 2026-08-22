import React, { createContext, useState, useEffect } from 'react';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  // Cargar productos desde la base de datos
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Error al obtener los productos');
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
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) throw new Error('Error al crear el producto');
      const savedProduct = await response.json();

      setProducts((prev) => [savedProduct, ...prev]);
    } catch (error) {
      console.error('Error en addProduct:', error);
    }
  };

  // Actualizar producto (Modificación en Backend)
  const updateProduct = async (id, updatedData) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) throw new Error('Error al actualizar el producto');
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
      const response = await fetch(`/api/products/${id}`, {
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