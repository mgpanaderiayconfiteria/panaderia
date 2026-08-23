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
  sellType: {
    type: String,
    required: true,
    enum: ['unidad', 'peso', 'porcion'],
    default: 'unidad'
  },
  unit: {
    type: String,
    required: true,
    enum: ['un', 'kg', 'gr', 'porcion'],
    default: 'un'
  },
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
  stock: {
    type: Number,
    default: 0,
    min: 0
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