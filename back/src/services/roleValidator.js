// back/src/services/roleValidator.js
//
// FUNCIONALIDAD 2: Marcar como alumno o profesor dependiendo del dominio
// del mail.
//
// Analiza el mail del usuario y devuelve "alumno" si termina en
// @est.ort.edu.ar, o "profesor" si termina en @ort.edu.ar.
// No usa ninguna libreria externa, es logica de string nativa de JS.
// services/roleValidator.js — Funcionalidad 2
// Determina el rol del usuario según el dominio de su email institucional

const STUDENT_DOMAIN = "@est.ort.edu.ar";
const PROFESSOR_DOMAIN = "@ort.edu.ar";

/**
 * Devuelve "alumno", "profesor" o null si el dominio no es válido.
 * @param {string} email
 * @returns {"alumno" | "profesor" | null}
 */
function getRoleFromEmail(email) {
  if (!email || typeof email !== "string") return null;
  const lower = email.toLowerCase();
  if (lower.endsWith(STUDENT_DOMAIN)) return "alumno";
  if (lower.endsWith(PROFESSOR_DOMAIN)) return "profesor";
  return null;
}

module.exports = { getRoleFromEmail };