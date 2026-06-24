// models/Question.js — Funcionalidades 7, 8, 10, 11, 12
// Esquema de pregunta con categoría, prioridad, estado y vínculo a clase

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    text: { type: String, required: true, maxlength: 500 },
    // Categorías disponibles con sus pesos de prioridad
    category: {
      type: String,
      enum: ["desarrollo", "duda_puntual", "curiosidad", "repetir", "significado"],
      required: true,
    },
    // Funcionalidad 8: cuántas veces se repitió esta duda
    mergeCount: { type: Number, default: 1 },
    // Funcionalidad 9: score calculado
    priority: { type: Number, default: 0 },
    // Funcionalidades 10, 12: estado de la pregunta
    status: {
      type: String,
      enum: ["pendiente", "respondida", "pospuesta", "reportada"],
      default: "pendiente",
    },
    // Funcionalidad 5 y 12: sesión del autor (socket ID temporal o email)
    authorSession: { type: String, default: "anónimo" },
    // Funcionalidad extra: preguntas fuera de clase
    sentOutOfClass: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);