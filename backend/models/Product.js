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
  salesCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);