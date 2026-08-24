const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Función para generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretopanes123', {
    expiresIn: '30d',
  });
};

// @desc    Autenticar usuario & obtener token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor complete todos los campos' });
    }

    const cleanInput = email.trim().toLowerCase();

    // Busca por email O por username trayendo la contraseña (+password)
    const user = await User.findOne({
      $or: [{ email: cleanInput }, { username: cleanInput }]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Compara la contraseña usando el método del esquema
    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role || 'cajero',
        isAdmin: user.isAdmin || user.role === 'admin',
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({ message: 'Error interno en el servidor', error: error.message });
  }
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public / Admin
const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, role, isAdmin } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Por favor complete los campos obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username ? username.trim().toLowerCase() : undefined;

    const userExists = await User.findOne({
      $or: [{ email: cleanEmail }, ...(cleanUsername ? [{ username: cleanUsername }] : [])]
    });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario o email ya se encuentra registrado' });
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      username: cleanUsername,
      password,
      role: role || 'cajero',
      isAdmin: isAdmin || role === 'admin'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isAdmin: user.isAdmin,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
  } catch (error) {
    console.error('Error en registerUser:', error);
    res.status(500).json({ message: 'Error interno al registrar usuario', error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser
};