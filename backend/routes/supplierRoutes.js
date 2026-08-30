const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');

// --- PROVEEDORES ---

// GET /api/suppliers - Listar todos los proveedores
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener proveedores', error: err.message });
  }
});

// POST /api/suppliers - Crear nuevo proveedor
router.post('/suppliers', async (req, res) => {
  try {
    const newSupplier = new Supplier(req.body);
    await newSupplier.save();
    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear proveedor', error: err.message });
  }
});

// --- EGRESOS / FACTURAS ---

// GET /api/expenses - Listar historial de egresos
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener egresos', error: err.message });
  }
});

// POST /api/expenses - Registrar un nuevo comprobante / gasto
router.post('/expenses', async (req, res) => {
  try {
    let supplierName = '';
    
    // Asignar el nombre del proveedor si vino un ID
    if (req.body.supplierId) {
      const supp = await Supplier.findById(req.body.supplierId);
      if (supp) supplierName = supp.name;
    }

    const newExpense = new Expense({
      ...req.body,
      supplierName
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: 'Error al registrar el egreso', error: err.message });
  }
});

module.exports = router;