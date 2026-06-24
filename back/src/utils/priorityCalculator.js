// utils/priorityCalculator.js — Funcionalidad 9
// Calcula el score de prioridad de una pregunta según su categoría y popularidad

// Peso por categoría: mayor peso = más urgente para el profesor
const CATEGORY_WEIGHTS = {
  repetir: 5,
  duda_puntual: 4,
  desarrollo: 3,
  significado: 2,
  curiosidad: 1,
};

/**
 * Calcula el score: mergeCount × peso de categoría.
 * @param {number} mergeCount - Cuántas veces se repitió la duda
 * @param {string} category
 * @returns {number}
 */
function calculateScore(mergeCount, category) {
  const weight = CATEGORY_WEIGHTS[category] ?? 1;
  return mergeCount * weight;
}

/**
 * Ordena un array de preguntas de mayor a menor prioridad.
 * @param {Array} questions
 * @returns {Array}
 */
function sortByPriority(questions) {
  return [...questions].sort((a, b) => b.priority - a.priority);
}

module.exports = { calculateScore, sortByPriority };