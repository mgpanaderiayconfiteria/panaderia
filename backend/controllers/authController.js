const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey_mgpanaderia_2026', { expiresIn: '30d' });
};

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

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingresá email y contraseña' });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Traemos explícitamente el campo password que tiene select: false
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin || user.role === 'admin',
        token: generateToken(user._id)
      });
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en loginUser:', error);
    res.status(500).json({ message: 'Error interno en el servidor', error: error.message });
  }
};