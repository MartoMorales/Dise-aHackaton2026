// utils/questionMerger.js — Funcionalidad 8
// Detecta preguntas redundantes y las fusiona (adaptado a Neon/PostgreSQL)

const Question = require("../models/Question");
const { getSimilarity, SIMILARITY_THRESHOLD } = require("./nlpAnalyzer");

async function mergeIfRedundant(newQuestion) {
  // findPendingByClass excluye sent_out_of_class automáticamente
  const existing = await Question.findPendingByClass(newQuestion.class_id);

  for (const question of existing) {
    // No comparar consigo misma
    if (question.id === newQuestion.id) continue;
    // Solo misma categoría
    if (question.category !== newQuestion.category) continue;

    const similarity = getSimilarity(newQuestion.text, question.text);

    if (similarity >= SIMILARITY_THRESHOLD) {
      await Question.delete(newQuestion.id);
      const newMergeCount = question.merge_count + 1;
      const updated = await Question.updatePriorityAndMergeCount(
        question.id,
        question.priority, // se recalculará en questionService
        newMergeCount
      );
      return { merged: true, original: updated };
    }
  }

  return { merged: false, original: null };
}

module.exports = { mergeIfRedundant };
