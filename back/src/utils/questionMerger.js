// utils/questionMerger.js — Funcionalidad 8
// Detecta preguntas redundantes dentro de la misma clase y las fusiona

const Question = require("../models/Question");
const { getSimilarity, SIMILARITY_THRESHOLD } = require("./nlpAnalyzer");

/**
 * Compara la nueva pregunta contra las pendientes de la misma clase y categoría.
 * Si encuentra una redundante: elimina la nueva, incrementa el mergeCount de la original.
 *
 * @param {Object} newQuestion - Documento Mongoose de la pregunta recién creada
 * @returns {Promise<{ merged: boolean, original: Object|null }>}
 */
async function mergeIfRedundant(newQuestion) {
  const existing = await Question.find({
    classId: newQuestion.classId,
    category: newQuestion.category,
    status: "pendiente",
    _id: { $ne: newQuestion._id },
  });

  for (const question of existing) {
    const similarity = getSimilarity(newQuestion.text, question.text);

    if (similarity >= SIMILARITY_THRESHOLD) {
      // Eliminar la nueva pregunta redundante
      await Question.findByIdAndDelete(newQuestion._id);
      // Incrementar el contador de la original
      question.mergeCount += 1;
      await question.save();
      return { merged: true, original: question };
    }
  }

  return { merged: false, original: null };
}

module.exports = { mergeIfRedundant };