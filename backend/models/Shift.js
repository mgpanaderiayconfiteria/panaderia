const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shiftType: { type: String, enum: ['Mañana', 'Tarde', 'Noche'], default: 'Mañana' },
  initialCash: { type: Number, required: true, default: 0 },
  finalCashCalculated: { type: Number, default: 0 },
  cashSales: { type: Number, default: 0 },
  digitalSales: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['open', 'closed'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);