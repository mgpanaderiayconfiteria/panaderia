// backend/fixAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ Error: No se encontró MONGO_URI en el archivo .env local.');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas.');

    const email = 'luisinnapilcheria@gmail.com';
    const rawPassword = 'Luisinna123456';

    // Acceso directo a la colección sin pasar por el esquema de Mongoose
    const usersCollection = mongoose.connection.db.collection('users');
    const user = await usersCollection.findOne({ email });

    if (!user) {
      console.log('⚠️ El usuario no existe en esta Base de Datos. Creándolo...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      await usersCollection.insertOne({
        name: 'Administradora Luisinna',
        email,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      console.log('🎉 Usuario creado con éxito.');
    } else {
      console.log('👤 Usuario encontrado ID:', user._id);
      
      // Verificación directa de Bcrypt
      const isMatch = await bcrypt.compare(rawPassword, user.password || '');
      
      if (!isMatch) {
        console.log('🔄 La clave guardada no coincide. Reemplazando por hash limpio...');
        const salt = await bcrypt.genSalt(10);
        const cleanHash = await bcrypt.hash(rawPassword, salt);

        await usersCollection.updateOne(
          { email },
          { 
            $set: { 
              password: cleanHash, 
              role: 'admin' 
            } 
          }
        );
        console.log('⚡ Contraseña y rol de admin actualizados correctamente.');
      } else {
        console.log('👍 La contraseña ya coincide correctamente en la base de datos.');
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixAdmin();