const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product'); // Revisa la ruta a tu modelo Product.js

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mg_panaderia';

const productsData = [
  // --- PANADERÍA ---
  {
    name: 'Plumitas, Abizcochadas y Grisines',
    category: 'Panadería',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 14000,
    price: 14000,
    cogs: 0, // <--- Queda en 0 para ser completado luego
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Bizcochitos y Libritos',
    category: 'Panadería',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 14000,
    price: 14000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Pan Común',
    category: 'Panadería',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 4000,
    price: 4000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Pan Fugazza / Salvado',
    category: 'Panadería',
    allowByUnit: true,
    allowByWeight: false,
    priceUnit: 6500,
    price: 6500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Cremona',
    category: 'Panadería',
    allowByUnit: true,
    allowByWeight: false,
    priceUnit: 5000,
    price: 5000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },

  // --- FACTURERÍA ---
  {
    name: 'Factura (Unidad)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 1500,
    price: 1500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Facturas (Media Docena)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 7000,
    price: 7000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Facturas (Docena)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 12000,
    price: 12000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Churros (Unidad)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 1000,
    price: 1000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Churros (Media Docena)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 4000,
    price: 4000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Churros (Docena)',
    category: 'Facturería',
    allowByUnit: true,
    priceUnit: 7000,
    price: 7000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },

  // --- ESPECIALIDADES & SALADOS ---
  {
    name: 'Chipá',
    category: 'Especialidades',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 20000,
    price: 20000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Palitos de Queso',
    category: 'Especialidades',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 20000,
    price: 20000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },

  // --- REPOSTERÍA & DULCES ---
  {
    name: 'Masas Secas',
    category: 'Repostería',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 26000,
    price: 26000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Pastelitos (Kg)',
    category: 'Repostería',
    allowByUnit: false,
    allowByWeight: true,
    priceKg: 26000,
    price: 26000,
    cogs: 0,
    stockGrams: 0,
    stock: 0
  },
  {
    name: 'Pastelitos (Unidad)',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 2500,
    price: 2500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Pastafrola Chica',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 4000,
    price: 4000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Pastafrola Grande',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 10000,
    price: 10000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Tarta Toffi / Coco Chica',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 8000,
    price: 8000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Tarta Toffi / Coco Grande',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 16000,
    price: 16000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Alfajor Chocolate',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 5000,
    price: 5000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Alfajor Maicena',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 4000,
    price: 4000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Budín',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 7000,
    price: 7000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Cookies',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 1500,
    price: 1500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },

  // --- POSTRES (HELADERA) ---
  {
    name: 'Postres Heladera',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 8000,
    price: 8000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Torta Chica',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 15000,
    price: 15000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Torta Grande',
    category: 'Repostería',
    allowByUnit: true,
    priceUnit: 35000,
    price: 35000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },

  // --- COMIDAS ---
  {
    name: 'Pizza Muzza',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 8000,
    price: 8000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Pizza Calabresa / Especial',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 10000,
    price: 10000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Empanada (Unidad)',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 2500,
    price: 2500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Sándwich de Miga (Unidad)',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 2000,
    price: 2000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Sándwich de Miga (Docena)',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 20000,
    price: 20000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Tarta Salada',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 5000,
    price: 5000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },

  // --- BEBIDAS ---
  {
    name: 'Agua Mineral',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 1500,
    price: 1500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Jugo Baggio',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 1500,
    price: 1500,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  },
  {
    name: 'Coca Cola',
    category: 'Especialidades',
    allowByUnit: true,
    priceUnit: 3000,
    price: 3000,
    cogs: 0,
    stockUnits: 0,
    stock: 0
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🟢 Conectado a MongoDB...');

    await Product.deleteMany({});
    console.log('🧹 Lista anterior limpiada.');

    const created = await Product.insertMany(productsData);
    console.log(`✅ ¡Listo! Se cargaron ${created.length} productos con precios de venta oficial y campos de costo vacíos.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar el script:', error);
    process.exit(1);
  }
};

seedDatabase();