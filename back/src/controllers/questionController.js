// controllers/questionController.js — Funcionalidades 7, 8, 9, 10, 11
// Crear pregunta, procesar redundancias, actualizar estado

const Question = require("../models/Question");
const Class = require("../models/Class");
const { mergeIfRedundant } = require("../utils/questionMerger");
const { calculateScore, sortByPriority } = require("../utils/priorityCalculator");

/**
 * POST /api/questions — Funcionalidad 7
 * Crea una pregunta, verifica reglas, detecta redundancia y calcula prioridad.
 * Body: { classId, text, category, authorSession }
 * Retorna: { question, merged, sortedList }
 */
async function createQuestion(req, res) {
  const { classId, text, category, authorSession, sentOutOfClass } = req.body;

  // Validaciones básicas
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

  // Verifica que la clase exista
  const cls = await Class.findById(classId);
  if (!cls) return res.status(404).json({ message: "Clase no encontrada" });

  // Funcionalidad extra: si la clase no está activa, se guarda como fuera-de-clase
  const isOutOfClass = cls.status !== "activa";

  // Funcionalidad 7: crea la pregunta
  let question = await Question.create({
    classId,
    text: text.trim(),
    category,
    authorSession: authorSession || "anónimo",
    sentOutOfClass: sentOutOfClass || isOutOfClass,
  });

  // Funcionalidad 8: detecta redundancias (solo para preguntas en clase activa)
  let merged = false;
  let original = null;
  if (!question.sentOutOfClass) {
    const result = await mergeIfRedundant(question);
    merged = result.merged;
    original = result.original;

    if (merged && original) {
      // Recalcula prioridad de la original
      original.priority = calculateScore(original.mergeCount, original.category);
      await original.save();
      question = original; // Devuelve la original actualizada
    }
  }

  // Funcionalidad 9: calcula score si no fue fusionada
  if (!merged) {
    question.priority = calculateScore(question.mergeCount, question.category);
    await question.save();
  }

  // Devuelve la lista ordenada de preguntas pendientes de esa clase
  const pending = await Question.find({ classId, status: "pendiente", sentOutOfClass: false });
  const sortedList = sortByPriority(pending);

  res.status(201).json({ question, merged, sortedList });
}

/**
 * GET /api/questions/:classId — Obtiene preguntas de una clase
 * Query: ?status=pendiente|respondida|pospuesta|all&outOfClass=true
 */
async function getQuestions(req, res) {
  const { classId } = req.params;
  const { status, outOfClass } = req.query;

  const filter = { classId };
  if (status && status !== "all") filter.status = status;
  if (outOfClass === "true") filter.sentOutOfClass = true;
  else filter.sentOutOfClass = false;

  const questions = await Question.find(filter).sort({ priority: -1, createdAt: 1 });
  res.json(questions);
}

/**
 * PATCH /api/questions/:id/status — Funcionalidad 10
 * Cambia el estado de una pregunta (respondida, pospuesta).
 * Body: { status }
 */
async function updateStatus(req, res) {
  const { status } = req.body;
  const allowed = ["respondida", "pospuesta", "pendiente"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  if (!question) return res.status(404).json({ message: "Pregunta no encontrada" });

  res.json(question);
}

module.exports = { createQuestion, getQuestions, updateStatus };