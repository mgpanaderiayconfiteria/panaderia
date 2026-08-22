import React, { createContext, useState } from 'react';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([
    { id: 1, name: 'Pan Felipe (Kg)', category: 'Panadería', price: 1500, cogs: 600, stock: 50 },
    { id: 2, name: 'Factura de Crema', category: 'Facturería', price: 350, cogs: 120, stock: 120 },
    { id: 3, name: 'Chipá Tradicional', category: 'Especialidades', price: 800, cogs: 300, stock: 80 }
  ]);

  const addProduct = (newProduct) => {
    setProducts((prev) => [...prev, { ...newProduct, id: Date.now() }]);
  };

  return (
    <ProductContext.Provider value={{ products, addProduct }}>
      {children}
    </ProductContext.Provider>
  );
};