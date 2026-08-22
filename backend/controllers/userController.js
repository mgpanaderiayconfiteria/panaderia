const User = require('../models/User');

// Obtener la lista general de usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios', error: error.message });
  }
};

// Crear/Dar de Alta un nuevo usuario o empleado
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userExists = await User.findOne({ email: cleanEmail });

    if (userExists) {
      return res.status(400).json({ message: 'El usuario con ese correo electrónico ya existe' });
    }

    const user = await User.create({
      name: name.trim(),
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
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al dar de alta el usuario', error: error.message });
  }
};

// Dar de Baja / Eliminar un usuario por su ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Protección para evitar la eliminación del administrador principal
    if (user.email === 'mgpanaderiayconfiteria@gmail.com') {
      return res.status(400).json({ message: 'No se puede eliminar la cuenta del administrador principal' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};