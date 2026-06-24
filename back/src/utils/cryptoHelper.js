// back/src/utils/cryptoHelper.js
//
// FUNCIONALIDAD 1: helpers usados por el login.
// - hashearPassword / compararPassword: usan bcryptjs para nunca guardar
//   ni comparar contraseñas en texto plano.
// - generarToken / verificarToken: usan jsonwebtoken para crear y validar
//   el token de sesion que se devuelve al loguearse.

// utils/cryptoHelper.js — Funcionalidad 1
// Utilidades de comparación de contraseñas (el hash se hace en el modelo)

const bcrypt = require("bcryptjs");

/**
 * Compara contraseña plana con hash almacenado.
 */
async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { verifyPassword };