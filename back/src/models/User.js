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

// models/User.js — Funcionalidad 1 y 2
// Define el esquema del usuario con rol automático según dominio de mail

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // Funcionalidad 2: el rol se asigna al crear el usuario
    role: { type: String, enum: ["alumno", "profesor"], required: true },
    name: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash de contraseña antes de guardar (Funcionalidad 1)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para comparar contraseña en login (Funcionalidad 1)
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);