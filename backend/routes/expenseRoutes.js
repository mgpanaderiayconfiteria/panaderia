const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Supplier = require('../models/Supplier');

// GET /api/expenses - Obtener historial de egresos
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });
    
    const formatted = await Promise.all(
      expenses.map(async (e) => {
        let name = e.supplierName || e.category;
        if (e.supplierId && !e.supplierName) {
          const sup = await Supplier.findById(e.supplierId);
          if (sup) name = sup.name;
        }
        return {
          ...e._doc,
          supplierName: name
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener egresos', error: error.message });
  }
});

// POST /api/expenses - Registrar nuevo egreso / factura
router.post('/', async (req, res) => {
  try {
    const { supplierId, description, amount, paymentMethod, invoiceNumber, category } = req.body;

    let supplierName = '';
    if (supplierId) {
      const sup = await Supplier.findById(supplierId);
      if (sup) supplierName = sup.name;
    }

    const newExpense = new Expense({
      supplierId,
      supplierName,
      description,
      amount: parseFloat(amount) || 0,
      paymentMethod,
      invoiceNumber,
      category
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar egreso', error: error.message });
  }
});

module.exports = router;