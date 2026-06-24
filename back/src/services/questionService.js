// services/questionService.js — Funcionalidades 7, 8, 9
// Lógica centralizada para crear una pregunta, fusionar redundantes y calcular prioridad.
// Usada tanto por questionController.js (HTTP) como por classSocket.js (tiempo real)
// para no duplicar el mismo flujo en dos archivos distintos.

const Question = require("../models/Question");
const { mergeIfRedundant } = require("../utils/questionMerger");
const { calculateScore, sortByPriority } = require("../utils/priorityCalculator");

/**
 * Crea una pregunta nueva, detecta si es redundante, calcula su prioridad
 * y devuelve la lista actualizada de preguntas pendientes de la clase.
 *
 * @param {Object} params
 * @param {string} params.classId
 * @param {string} params.text
 * @param {string} params.category
 * @param {string} params.authorSession
 * @param {boolean} [params.sentOutOfClass]
 * @returns {Promise<{ question: Object, merged: boolean, sortedList: Array }>}
 */
async function processNewQuestion({ classId, text, category, authorSession, sentOutOfClass }) {
  let question = await Question.create({
    classId,
    text: text.trim(),
    category,
    authorSession: authorSession || "anónimo",
    sentOutOfClass: sentOutOfClass || false,
  });

  let merged = false;

  // Funcionalidad 8: solo se busca redundancia para preguntas dentro de clase
  if (!question.sentOutOfClass) {
    const result = await mergeIfRedundant(question);
    merged = result.merged;

    if (merged && result.original) {
      result.original.priority = calculateScore(result.original.mergeCount, result.original.category);
      await result.original.save();
      question = result.original;
    }
  }

  // Funcionalidad 9: calcula score si no fue fusionada
  if (!merged) {
    question.priority = calculateScore(question.mergeCount, question.category);
    await question.save();
  }

  const pending = await Question.find({ classId, status: "pendiente", sentOutOfClass: false });
  const sortedList = sortByPriority(pending);

  return { question, merged, sortedList };
}

module.exports = { processNewQuestion };