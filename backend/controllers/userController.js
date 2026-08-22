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
  const { name, username, email, password, role } = req.body;
  try {
    if (!name || !password || (!username && !email)) {
      return res.status(400).json({ message: 'Nombre, usuario/email y contraseña son obligatorios' });
    }

    const cleanUsername = username ? username.trim().toLowerCase() : null;
    const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@panaderia.local`;

    // Verificación de duplicados
    const userExists = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanUsername ? [{ username: cleanUsername }] : [])
      ]
    });

    if (userExists) {
      return res.status(400).json({ message: 'El nombre de usuario o correo ya se encuentra registrado' });
    }

    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      role: role || 'cajero',
      isAdmin: role === 'admin'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
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

// Cambiar / Resetear contraseña desde el panel de Admin
exports.updateUserPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({ message: 'La nueva contraseña es requerida' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña', error: error.message });
  }
};

// Dar de Baja / Eliminar un usuario por su ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.email === 'mgpanaderiayconfiteria@gmail.com' || user.username === 'admin') {
      return res.status(400).json({ message: 'No se puede eliminar la cuenta del administrador principal' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario', error: error.message });
  }
};