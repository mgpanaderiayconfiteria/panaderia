const express = require('express');
const router = express.Router();
const { 
  registerWaste, 
  closeShift, 
  getShifts, 
  getWastes 
} = require('../controllers/shiftWasteController');

// Rutas de Registro
router.post('/waste', registerWaste);
router.post('/close', closeShift);

// Rutas de Consulta (Para el Panel Admin)
router.get('/', getShifts);
router.get('/waste', getWastes);

module.exports = router;