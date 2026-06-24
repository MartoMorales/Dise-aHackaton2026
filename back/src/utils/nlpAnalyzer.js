// utils/nlpAnalyzer.js — Funcionalidad 8
// Analiza similitud entre textos de preguntas usando palabras clave (nativo, sin librerías)

// Palabras vacías en español que se ignoran en la comparación
const STOP_WORDS = new Set([
  "que", "de", "la", "el", "en", "y", "a", "es", "se", "no",
  "un", "una", "por", "con", "los", "las", "del", "al", "lo",
  "como", "más", "pero", "sus", "le", "ya", "o", "porque", "cuando",
  "muy", "sin", "sobre", "también", "me", "hasta", "hay", "donde",
  "quien", "desde", "todo", "nos", "durante", "ni", "si", "para",
]);

/**
 * Extrae términos relevantes de un texto (sin stopwords, en minúsculas).
 * @param {string} text
 * @returns {Set<string>}
 */
function extractKeywords(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-záéíóúüñ\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/**
 * Calcula el coeficiente de similitud Jaccard entre dos textos.
 * Devuelve un número entre 0 (nada en común) y 1 (idénticos).
 * @param {string} textA
 * @param {string} textB
 * @returns {number}
 */
function getSimilarity(textA, textB) {
  const setA = extractKeywords(textA);
  const setB = extractKeywords(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;

  return intersection / union;
}

// Umbral mínimo para considerar dos preguntas redundantes
const SIMILARITY_THRESHOLD = 0.4;

module.exports = { getSimilarity, SIMILARITY_THRESHOLD };