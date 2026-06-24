// utils/codeGenerator.js — Funcionalidad 4
// Genera un código alfanumérico corto y único usando crypto nativo

const crypto = require("crypto");
const Class = require("../models/Class");

/**
 * Genera un código de 6 caracteres alfanumérico en mayúsculas.
 * Verifica contra la BD que no exista uno igual (sin colisiones).
 * @returns {Promise<string>}
 */
async function generateUniqueCode() {
  let code;
  let exists = true;

  while (exists) {
    // Genera 3 bytes aleatorios → 6 chars hex en mayúsculas
    code = crypto.randomBytes(3).toString("hex").toUpperCase();
    exists = await Class.findOne({ code });
  }

  return code;
}

module.exports = { generateUniqueCode };