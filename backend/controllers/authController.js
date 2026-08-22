const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey_mgpanaderia_2026', { expiresIn: '30d' });
};

// Registro de usuarios/empleados
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) return res.status(400).json({ message: 'El usuario ya existe' });

    const user = await User.create({ 
      name: name ? name.trim() : '', 
      email: cleanEmail, 
      password, 
      role: role || 'cajero',
      isAdmin: role === 'admin'
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Error en registerUser:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// Login de usuarios (Administrador y Cajeros)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingresá email y contraseña' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin',
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas. Verificá tu correo y contraseña.' });
    }
  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({ message: 'Error interno en el servidor de autenticación', error: error.message });
  }
};