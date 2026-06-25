// utils/codeGenerator.js — Funcionalidad 4
// Genera un código alfanumérico corto y único

const crypto = require("crypto");
const Class  = require("../models/Class");

const ALPHABET   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

async function generateUniqueCode() {
  let code;
  let exists = true;

  while (exists) {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += ALPHABET[bytes[i] % ALPHABET.length];
    }
    exists = await Class.findByCodeExists(code);
  }

  return code;
}

module.exports = { generateUniqueCode };
