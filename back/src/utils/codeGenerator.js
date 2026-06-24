// utils/codeGenerator.js — Funcionalidad 4
// Genera un código alfanumérico corto y único usando crypto nativo

const crypto = require("crypto");
const Class = require("../models/Class");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

/**
 * Genera un código de 6 caracteres alfanumérico en mayúsculas.
 * Verifica contra la BD que no exista uno igual (sin colisiones).
 * @returns {Promise<string>}
 */
async function generateUniqueCode() {
  let code;
  let exists = true;

  while (exists) {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += ALPHABET[bytes[i] % ALPHABET.length];
    }
    exists = await Class.findOne({ code });
  }

  return code;
}

module.exports = { generateUniqueCode };