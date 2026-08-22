const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/panaderia');
    console.log('Conectado a MongoDB para seed...');

    const adminEmail = 'mgpanaderiayconfiteria@gmail.com';
    const adminPassword = 'pana80y2';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.isAdmin = true;
      await admin.save();
      console.log('Usuario administrador actualizado correctamente.');
    } else {
      admin = new User({
        name: 'MG Administrador',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isAdmin: true
      });
      await admin.save();
      console.log('Usuario administrador creado con éxito.');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar el usuario administrador:', error);
    process.exit(1);
  }
};

seedAdmin();