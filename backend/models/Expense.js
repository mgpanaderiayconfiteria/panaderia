const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
  supplierName: { type: String, default: '' },
  category: { type: String, required: true },
  description: { type: String, required: true },
  invoiceNumber: { type: String, default: '' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['transferencia', 'efectivo', 'cheque'], default: 'transferencia' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);