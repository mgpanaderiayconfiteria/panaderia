const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuit: { type: String, default: '' },
  phone: { type: String, default: '' },
  category: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);