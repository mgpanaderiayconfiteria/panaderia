const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraer token
      token = req.headers.authorization.split(' ')[1];

      // Verificar Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey_ambar_2026');

      // Buscar usuario soportando 'id' o '_id' en el token guardado
      const userId = decoded.id || decoded._id;
      
      if (!userId) {
        console.error("❌ El token no contiene ID de usuario válido.");
        return res.status(401).json({ message: 'No autorizado, ID inválido en token' });
      }

      req.user = await User.findById(userId).select('-password');

      if (!req.user) {
        console.error("❌ Usuario no encontrado en la BD con ID:", userId);
        return res.status(401).json({ message: 'No autorizado, usuario inexistente' });
      }

      return next();
    } catch (error) {
      console.error("❌ Error en verificación de JWT:", error.message);
      return res.status(401).json({ message: 'No autorizado, token falló o expiró' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token en la petición' });
  }
};

const admin = (req, res, next) => {
  // Acepta si es 'role === admin' O si tiene 'isAdmin === true'
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin === true)) {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador' });
  }
};

module.exports = { protect, admin };