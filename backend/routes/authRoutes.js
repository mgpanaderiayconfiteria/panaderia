const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/authController');

// Define los endpoints para la autenticación
router.post('/login', loginUser);
router.post('/register', registerUser);

module.exports = router;