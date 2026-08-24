const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Panadería', 'Facturería', 'Repostería', 'Cafetería', 'Especialidades'],
    default: 'Panadería'
  },
  // Habilitadores de modalidades de venta
  allowByUnit: {
    type: Boolean,
    default: true
  },
  allowByWeight: {
    type: Boolean,
    default: true
  },
  allowByAmount: {
    type: Boolean,
    default: true
  },
  // Precios de referencia según la modalidad elegida en caja
  priceUnit: {
    type: Number,
    default: 0,
    min: 0
  },
  priceKg: {
    type: Number,
    default: 0,
    min: 0
  },
  // El precio base retrocompatible por si el punto de venta busca 'price'
  price: {
    type: Number,
    required: [true, 'El precio de venta es obligatorio'],
    min: 0
  },
  cogs: {
    type: Number,
    default: 0,
    min: 0
  },
  // El stock se almacena unificado (ej: en gramos para productos pesables o en unidades)
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  stockUnit: {
    type: String,
    enum: ['un', 'gr', 'kg', 'porcion'],
    default: 'gr'
  },
  image: {
    type: String,
    default: ''
  },
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);