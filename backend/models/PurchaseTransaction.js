const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  name: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 0 },
  unitCost: { type: Number, required: true, default: 0 }
});

const purchaseTransactionSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: false
  },
  supplierName: { type: String, default: 'Proveedor General' },
  items: [purchaseItemSchema],
  totalAmount: { type: Number, required: true, default: 0 },
  invoiceNumber: { type: String, default: '' },
  paymentMethod: { type: String, default: 'Efectivo' },
  isPaid: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('PurchaseTransaction', purchaseTransactionSchema);