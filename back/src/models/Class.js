// models/Class.js — Funcionalidad 3, 4 y 5
// Esquema de una clase con su código único y estado activo/inactivo

const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    course: { type: String, required: true },
    maxStudents: { type: Number, default: 40 },
    schedule: { type: String, default: "" },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Funcionalidad 4: código único generado al hostear
    code: { type: String, default: null, unique: true, sparse: true },
    // Estado: inactiva | activa | cerrada
    status: { type: String, enum: ["inactiva", "activa", "cerrada"], default: "inactiva" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);