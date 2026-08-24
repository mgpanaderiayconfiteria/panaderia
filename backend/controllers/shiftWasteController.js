const Shift = require('../models/Shift');
const Waste = require('../models/Waste');

// Cerrar turno
const closeShift = async (req, res) => {
  try {
    const newShift = new Shift(req.body);
    const savedShift = await newShift.save();
    res.status(201).json(savedShift);
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar el turno', error: error.message });
  }
};

// Registrar merma / sobrante
const registerWaste = async (req, res) => {
  try {
    const newWaste = new Waste(req.body);
    const savedWaste = await newWaste.save();
    res.status(201).json(savedWaste);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la merma', error: error.message });
  }
};

// Obtener historial de turnos
const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ createdAt: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener turnos', error: error.message });
  }
};

// Obtener historial de mermas
const getWastes = async (req, res) => {
  try {
    const wastes = await Waste.find().sort({ createdAt: -1 });
    res.json(wastes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mermas', error: error.message });
  }
};

module.exports = {
  closeShift,
  registerWaste,
  getShifts,
  getWastes
};