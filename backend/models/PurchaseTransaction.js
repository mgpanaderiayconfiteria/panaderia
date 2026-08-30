const mongoose = require('mongoose');

const purchaseTransactionSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  supplierName: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    category: { type: String },
    subcategory: { type: String },
    sellType: { type: String, default: 'unidad' }, // 'unidad' o 'peso'
    quantity: { type: Number, required: true },
    unitCost: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }, // Total de la caja pagado al proveedor
  invoiceNumber: { type: String, default: '' }, // N° de remito o factura
  paymentMethod: { type: String, default: 'efectivo' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseTransaction', purchaseTransactionSchema);