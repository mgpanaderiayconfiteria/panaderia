const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  mode: { 
    type: String, 
    enum: ['unit', 'weight', 'porcion', 'dozen', 'half_dozen'], 
    default: 'unit' 
  },
  costPrice: { type: Number, default: 0 },
  totalLoss: { type: Number, default: 0 },
  employee: { type: String, required: true },
  reason: { type: String, default: 'Sobrante de fin de turno' },
  dateStr: { type: String, default: () => new Date().toLocaleDateString('es-AR') }
}, { timestamps: true });

module.exports = mongoose.model('Waste', wasteSchema);