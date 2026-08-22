// backend/resetPassword.js
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require(path.join(__dirname, 'models', 'User'));

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'luisinnapilcheria@gmail.com';
    const newPassword = 'Luisinna123456';
    
    // Hash manual si tu modelo no tiene middleware pre('save')
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findOneAndUpdate(
      { email },
      { 
        password: hashedPassword,
        role: 'admin',
        name: 'Administradora Luisinna'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Contraseña restablecida con éxito para:', user.email);
    console.log('🔑 Nueva contraseña:', newPassword);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetAdmin();