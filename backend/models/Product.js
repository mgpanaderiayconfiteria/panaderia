const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true,
    default: 'General'
  },
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },

  allowByUnit: { type: Boolean, default: true },
  allowByWeight: { type: Boolean, default: false },
  allowByPorcion: { type: Boolean, default: false },
  allowByAmount: { type: Boolean, default: false },

  // Precios de venta
  priceUnit: { type: Number, default: 0, min: 0 },
  priceHalfDozen: { type: Number, default: 0, min: 0 },
  priceDozen: { type: Number, default: 0, min: 0 },
  priceKg: { type: Number, default: 0, min: 0 },
  pricePorcion: { type: Number, default: 0, min: 0 },
  price: {
    type: Number,
    required: [true, 'El precio de venta es obligatorio'],
    default: 0,
    min: 0
  },

  // === NUEVOS CAMPOS DE COSTOS (COGS) POR MODALIDAD ===
  cogsUnit: { type: Number, default: 0, min: 0 },
  cogsHalfDozen: { type: Number, default: 0, min: 0 },
  cogsDozen: { type: Number, default: 0, min: 0 },
  cogsKg: { type: Number, default: 0, min: 0 },
  cogsPorcion: { type: Number, default: 0, min: 0 },

  // Costo base/unitario para retrocompatibilidad
  cogs: {
    type: Number,
    default: 0,
    min: 0
  },

  // Stocks independientes por tipo de unidad
  stockUnits: { type: Number, default: 0, min: 0 },
  stockGrams: { type: Number, default: 0, min: 0 },
  stockPorciones: { type: Number, default: 0, min: 0 },

  // Campos retrocompatibles
  stock: { type: Number, default: 0, min: 0 },
  stockUnit: {
    type: String,
    enum: ['un', 'gr', 'kg', 'porcion'],
    default: 'un'
  },
  sellType: { type: String, default: 'unidad' },
  unit: { type: String, default: 'un' },
  image: { type: String, default: '' },
  salesCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);