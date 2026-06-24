// controllers/moderationController.js — Funcionalidades 12 y 13
// Reportar/eliminar preguntas inapropiadas y expulsar alumnos

const Question = require("../models/Question");

// Lista negra de sesiones, temporal (en memoria, se resetea al reiniciar servidor)
const bannedSessions = new Set();

/**
 * DELETE /api/moderation/question/:id — Funcionalidad 12
 * Marca la pregunta como reportada, expone el autor, y la elimina de la BD.
 * Solo accesible por el profesor.
 */
async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Pregunta no encontrada" });

    // Marca como reportada antes de borrar, para dejar registro del motivo
    question.status = "reportada";
    await question.save();

    const authorSession = question.authorSession;

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Pregunta eliminada", authorSession });
  } catch (err) {
    console.error("Error en deleteQuestion:", err.message);
    res.status(500).json({ message: "Error al eliminar la pregunta" });
  }
}

/**
 * POST /api/moderation/ban — Funcionalidad 13
 * Agrega la sesión del infractor a la lista negra.
 * La desconexión real se maneja en classSocket.js.
 * Body: { sessionId }
 */
async function banUser(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: "sessionId requerido" });

    bannedSessions.add(sessionId);
    res.json({ message: "Usuario baneado", sessionId });
  } catch (err) {
    console.error("Error en banUser:", err.message);
    res.status(500).json({ message: "Error al banear usuario" });
  }
}

/**
 * Verifica si una sesión está baneada (usado internamente por classSocket).
 */
function isBanned(sessionId) {
  return bannedSessions.has(sessionId);
}

module.exports = { deleteQuestion, banUser, isBanned };