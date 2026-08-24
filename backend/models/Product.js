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

  // Habilitadores independientes de modalidades de venta
  allowByUnit: {
    type: Boolean,
    default: true
  },
  allowByWeight: {
    type: Boolean,
    default: false
  },
  allowByPorcion: {
    type: Boolean,
    default: false
  },
  allowByAmount: {
    type: Boolean,
    default: false
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
  pricePorcion: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: [true, 'El precio de venta es obligatorio'],
    default: 0,
    min: 0
  },

  cogs: {
    type: Number,
    default: 0,
    min: 0
  },

  // Stocks independientes por tipo de unidad
  stockUnits: {
    type: Number,
    default: 0,
    min: 0
  },
  stockGrams: {
    type: Number,
    default: 0,
    min: 0
  },
  stockPorciones: {
    type: Number,
    default: 0,
    min: 0
  },

  // Campos retrocompatibles
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  stockUnit: {
    type: String,
    enum: ['un', 'gr', 'kg', 'porcion'],
    default: 'un'
  },
  sellType: {
    type: String,
    default: 'unidad'
  },
  unit: {
    type: String,
    default: 'un'
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