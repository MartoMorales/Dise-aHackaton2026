// controllers/moderationController.js — Funcionalidades 12 y 13
const Question = require("../models/Question");

// Lista negra temporal (se resetea al reiniciar el servidor)
const bannedSessions = new Set();

/** DELETE /api/moderation/question/:id */
async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Pregunta no encontrada" });

    const authorSession = question.author_session;
    // Marcar como reportada y borrar
    await Question.updateStatus(question.id, "reportada");
    await Question.delete(question.id);

    res.json({ message: "Pregunta eliminada", authorSession });
  } catch (err) {
    console.error("Error en deleteQuestion:", err.message);
    res.status(500).json({ message: "Error al eliminar la pregunta" });
  }
}

/** POST /api/moderation/ban */
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

function isBanned(sessionId) {
  return bannedSessions.has(sessionId);
}

module.exports = { deleteQuestion, banUser, isBanned };
