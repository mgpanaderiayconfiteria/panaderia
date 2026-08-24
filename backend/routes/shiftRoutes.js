const express = require('express');
const router = express.Router();

// Importar el controlador con su NOMBRE EXACTO
const {
  closeShift,
  registerWaste,
  getShifts,
  getWastes
} = require('../controllers/shiftWasteController');

// Fallbacks seguros por si alguna función no está definida en el controller
const handleCloseShift = closeShift || ((req, res) => res.status(501).json({ message: 'Método closeShift no implementado' }));
const handleRegisterWaste = registerWaste || ((req, res) => res.status(501).json({ message: 'Método registerWaste no implementado' }));
const handleGetShifts = getShifts || ((req, res) => res.status(200).json([]));
const handleGetWastes = getWastes || ((req, res) => res.status(200).json([]));

// Rutas de turnos y mermas
router.post('/close', handleCloseShift);
router.post('/waste', handleRegisterWaste);
router.get('/shifts', handleGetShifts);
router.get('/wastes', handleGetWastes);
router.get('/', handleGetShifts); // Soporte si tenías un router.get('/') apuntando a los turnos

module.exports = router;