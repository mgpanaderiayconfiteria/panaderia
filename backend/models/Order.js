const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    mode: { type: String }, // 'weight', 'unit', 'portion', 'amount'
    detailLabel: { type: String },
    subtotal: { type: Number, required: true } // 👈 AGREGAR ESTE CAMPO
  }],
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  isCashDiscountApplied: { type: Boolean, default: false },
  total: { type: Number, required: true },
  paidAmount: { type: Number },
  changeAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['efectivo', 'digital'], default: 'efectivo' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employee: { type: String, default: 'Cajero' },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);