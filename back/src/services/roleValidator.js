// back/src/services/roleValidator.js
//
// FUNCIONALIDAD 2: Marcar como alumno o profesor dependiendo del dominio
// del mail.
//
// Analiza el mail del usuario y devuelve "alumno" si termina en
// @est.ort.edu.ar, o "profesor" si termina en @ort.edu.ar.
// No usa ninguna libreria externa, es logica de string nativa de JS.

const DOMINIO_ALUMNO = "@est.ort.edu.ar";
const DOMINIO_PROFESOR = "@ort.edu.ar";

/**
 * Calcula el rol de un usuario en base al dominio de su mail institucional.
 * @param {string} mail - mail completo del usuario (ej: "juan@est.ort.edu.ar")
 * @returns {"alumno" | "profesor"} rol calculado
 * @throws {Error} si el mail no pertenece a ningun dominio reconocido
 */
function calcularRolPorMail(mail) {
  const mailNormalizado = mail.trim().toLowerCase();

  // Importante: hay que chequear primero el dominio de alumno porque
  // "@est.ort.edu.ar" tambien termina en "ort.edu.ar". Si se chequeara
  // primero el de profesor, todos los alumnos quedarian mal clasificados.
  if (mailNormalizado.endsWith(DOMINIO_ALUMNO)) {
    return "alumno";
  }

  if (mailNormalizado.endsWith(DOMINIO_PROFESOR)) {
    return "profesor";
  }

  throw new Error("El mail no pertenece a un dominio institucional valido.");
}

module.exports = { calcularRolPorMail };