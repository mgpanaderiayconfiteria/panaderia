const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  mode: { type: String, default: 'unit' }, // 'unit' o 'weight'
  costPrice: { type: Number, default: 0 },
  totalLoss: { type: Number, default: 0 }, // Loss = quantity * costPrice
  employee: { type: String, required: true },
  reason: { type: String, default: 'Sobrante de fin de turno' },
  dateStr: { type: String, default: () => new Date().toLocaleDateString('es-AR') }
}, { timestamps: true });

module.exports = mongoose.model('Waste', wasteSchema);