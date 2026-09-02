const express = require('express');
const router = express.Router();

// Importar el controlador
const {
  closeShift,
  registerWaste,
  getShifts,
  getWastes
} = require('../controllers/shiftController');

// Fallbacks seguros por si alguna función no está definida
const handleCloseShift = closeShift || ((req, res) => res.status(501).json({ message: 'Método closeShift no implementado' }));
const handleRegisterWaste = registerWaste || ((req, res) => res.status(501).json({ message: 'Método registerWaste no implementado' }));
const handleGetShifts = getShifts || ((req, res) => res.status(200).json([]));
const handleGetWastes = getWastes || ((req, res) => res.status(200).json([]));

// Rutas de turnos y mermas
router.post('/close', handleCloseShift);
router.post('/waste', handleRegisterWaste);
router.get('/shifts', handleGetShifts);
router.get('/wastes', handleGetWastes);
router.get('/close', handleGetShifts);
router.get('/waste', handleGetWastes);
router.get('/', handleGetShifts);

module.exports = router;