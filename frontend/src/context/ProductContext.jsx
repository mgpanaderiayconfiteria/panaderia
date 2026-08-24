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
      // Formatear payload para garantizar compatibilidad con el esquema del backend
      const formattedPayload = {
        name: productData.name,
        category: productData.category || 'Panadería',
        cogs: parseFloat(productData.cogs || productData.cost || 0),
        allowByUnit: productData.allowByUnit ?? (productData.sellType === 'unidad' || true),
        allowByWeight: productData.allowByWeight ?? (productData.sellType === 'peso'),
        allowByPorcion: productData.allowByPorcion ?? (productData.sellType === 'porcion'),
        priceUnit: parseFloat(productData.priceUnit || (productData.sellType === 'unidad' ? productData.price : 0) || 0),
        priceKg: parseFloat(productData.priceKg || (productData.sellType === 'peso' ? productData.price : 0) || 0),
        pricePorcion: parseFloat(productData.pricePorcion || (productData.sellType === 'porcion' ? productData.price : 0) || 0),
        price: parseFloat(productData.price || 0),
        stockUnits: parseFloat(productData.stockUnits || (productData.sellType === 'unidad' ? productData.stock : 0) || 0),
        stockGrams: parseFloat(productData.stockGrams || (productData.sellType === 'peso' ? productData.stock : 0) || 0),
        stockPorciones: parseFloat(productData.stockPorciones || (productData.sellType === 'porcion' ? productData.stock : 0) || 0),
        stock: parseFloat(productData.stock || 0)
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedPayload)
      });

      const contentType = response.headers.get('content-type');

      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('⚠️ Error en POST /api/products:', response.status, text);
        alert(`Error al guardar (${response.status}): Revisá los datos enviados o que la API esté activa.`);
        return null;
      }

      const savedProduct = await response.json();
      setProducts((prev) => [savedProduct, ...prev]);
      return savedProduct;
    } catch (error) {
      console.error('Error de red en addProduct:', error);
      return null;
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