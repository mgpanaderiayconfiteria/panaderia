const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Efectivo' },
  employee: { type: String, default: 'Cajero' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);