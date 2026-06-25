// controllers/questionController.js — Funcionalidades 7, 8, 9, 10, 11
const Question = require("../models/Question");
const Class    = require("../models/Class");
const { processNewQuestion } = require("../services/questionService");

/** POST /api/questions */
async function createQuestion(req, res) {
  try {
    const { classId, text, category, authorSession, sentOutOfClass } = req.body;

    if (!classId || !text || !category) {
      return res.status(400).json({ message: "classId, text y category son requeridos" });
    }
    if (text.trim().length === 0) {
      return res.status(400).json({ message: "La pregunta no puede estar vacía" });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: "Máximo 500 caracteres" });
    }
    const validCategories = ["desarrollo", "duda_puntual", "curiosidad", "repetir", "significado"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Categoría inválida" });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: "Clase no encontrada" });

    const isOutOfClass = cls.status !== "activa";
    const { question, merged, sortedList } = await processNewQuestion({
      classId, text, category, authorSession,
      sentOutOfClass: sentOutOfClass || isOutOfClass,
    });

    res.status(201).json({ question, merged, sortedList });
  } catch (err) {
    console.error("Error en createQuestion:", err.message);
    res.status(500).json({ message: "Error al crear la pregunta" });
  }
}

/** GET /api/questions/:classId */
async function getQuestions(req, res) {
  try {
    const { classId } = req.params;
    const { status, outOfClass } = req.query;

    const filter = {
      status: status || "pendiente",
    };
    if (outOfClass !== undefined) {
      filter.sentOutOfClass = outOfClass === "true";
    }

    const questions = await Question.findByClass(classId, filter);
    res.json(questions);
  } catch (err) {
    console.error("Error en getQuestions:", err.message);
    res.status(500).json({ message: "Error al obtener preguntas" });
  }
}

/** PATCH /api/questions/:id/status */
async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["respondida", "pospuesta", "pendiente"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Estado inválido" });
    }
    const question = await Question.updateStatus(req.params.id, status);
    if (!question) return res.status(404).json({ message: "Pregunta no encontrada" });
    res.json(question);
  } catch (err) {
    console.error("Error en updateStatus:", err.message);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
}

module.exports = { createQuestion, getQuestions, updateStatus };
