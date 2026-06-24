// controllers/moderationController.js — Funcionalidades 12 y 13
// Reportar/eliminar preguntas inapropiadas y expulsar alumnos

const Question = require("../models/Question");

// Lista negra de sockets temporal (en memoria, se resetea al reiniciar servidor)
const bannedSockets = new Set();

/**
 * DELETE /api/moderation/question/:id — Funcionalidad 12
 * Marca la pregunta como reportada y la elimina de la BD.
 * Solo accesible por el profesor.
 */
async function deleteQuestion(req, res) {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ message: "Pregunta no encontrada" });

  // Expone el autor para el panel de moderación antes de borrar
  const authorSession = question.authorSession;

  await Question.findByIdAndDelete(req.params.id);
  res.json({ message: "Pregunta eliminada", authorSession });
}

/**
 * POST /api/moderation/ban — Funcionalidad 13
 * Agrega el socketId del infractor a la lista negra.
 * La desconexión real se maneja en classSocket.js.
 * Body: { socketId }
 */
async function banUser(req, res) {
  const { socketId } = req.body;
  if (!socketId) return res.status(400).json({ message: "socketId requerido" });

  bannedSockets.add(socketId);
  res.json({ message: "Usuario baneado", socketId });
}

/**
 * Verifica si un socketId está baneado (usado internamente por classSocket).
 */
function isBanned(socketId) {
  return bannedSockets.has(socketId);
}

module.exports = { deleteQuestion, banUser, isBanned };