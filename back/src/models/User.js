// back/src/models/User.js
//
// FUNCIONALIDAD 1: estructura donde se busca al usuario por mail/usuario
// y se compara la contraseña hasheada.
// FUNCIONALIDAD 2: guarda el campo "rol", que se calcula a partir del
// dominio del mail (ver services/roleValidator.js) y no se puede mandar
// manualmente desde el frontend.
//
// Nota: como el colegio entrega las cuentas (no hay sign up publico),
// estos documentos se cargan de antemano en la base, por ejemplo con un
// script de seed. Ver seed.js para un ejemplo de como crear usuarios.

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    usuario: {
      // nombre de usuario con el que se loguea (puede ser distinto del mail)
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mail: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      // nunca se guarda la contraseña en texto plano, solo su hash (bcrypt)
      type: String,
      required: true,
    },
    rol: {
      // se calcula automaticamente segun el dominio del mail al crear
      // el usuario (Funcionalidad 2). No lo elige el usuario.
      type: String,
      enum: ["alumno", "profesor"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);