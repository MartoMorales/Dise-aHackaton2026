// back/src/config/db.js
//
// Maneja la conexion a MongoDB usando Mongoose.
// No implementa ninguna funcionalidad de negocio: es infraestructura pura,
// usada como paso previo a todas las funcionalidades (1 a 13) que necesitan
// leer o escribir en la base de datos.

const mongoose = require("mongoose");

async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB correctamente.");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
    // Si no hay DB no tiene sentido levantar el servidor.
    process.exit(1);
  }
}

module.exports = conectarDB;