// back/src/utils/cryptoHelper.js
//
// FUNCIONALIDAD 1: helpers usados por el login.
// - hashearPassword / compararPassword: usan bcryptjs para nunca guardar
//   ni comparar contraseñas en texto plano.
// - generarToken / verificarToken: usan jsonwebtoken para crear y validar
//   el token de sesion que se devuelve al loguearse.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

/**
 * Genera el hash de una contraseña en texto plano.
 * Se usa al crear un usuario (seed), nunca al loguearse.
 * @param {string} passwordPlano
 * @returns {Promise<string>} hash listo para guardar en la DB
 */
async function hashearPassword(passwordPlano) {
  return bcrypt.hash(passwordPlano, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano contra un hash almacenado.
 * @param {string} passwordPlano - lo que escribio el usuario en el login
 * @param {string} hashAlmacenado - lo que esta guardado en la DB
 * @returns {Promise<boolean>} true si coinciden
 */
async function compararPassword(passwordPlano, hashAlmacenado) {
  return bcrypt.compare(passwordPlano, hashAlmacenado);
}

/**
 * Genera un JWT de sesion para un usuario ya autenticado.
 * @param {{ id: string, rol: string }} payload - datos minimos a guardar en el token
 * @returns {string} token firmado
 */
function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

/**
 * Verifica y decodifica un JWT. Lanza error si es invalido o expiro.
 * @param {string} token
 * @returns {object} payload decodificado
 */
function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  hashearPassword,
  compararPassword,
  generarToken,
  verificarToken,
};