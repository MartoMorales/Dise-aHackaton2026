// controllers/classController.js — Funcionalidades 3, 4 y 5
// CRUD de clases: crear, listar, hostear (activar con código), unirse por código

const Class = require("../models/Class");
const { generateUniqueCode } = require("../utils/codeGenerator");

/**
 * POST /api/classes — Funcionalidad 3
 * Crea una clase nueva vinculada al profesor autenticado.
 * Body: { name, subject, course, maxStudents, schedule }
 */
async function createClass(req, res) {
  const { name, subject, course, maxStudents, schedule } = req.body;

  if (!name || !subject || !course) {
    return res.status(400).json({ message: "Nombre, materia y curso son requeridos" });
  }

  const newClass = await Class.create({
    name,
    subject,
    course,
    maxStudents: maxStudents || 40,
    schedule: schedule || "",
    professor: req.user.id,
  });

  res.status(201).json(newClass);
}

/**
 * GET /api/classes — Lista clases del profesor autenticado
 */
async function getMyClasses(req, res) {
  const classes = await Class.find({ professor: req.user.id }).sort({ createdAt: -1 });
  res.json(classes);
}

/**
 * GET /api/classes/student — Lista clases activas (para alumnos que buscan unirse)
 */
async function getActiveClasses(req, res) {
  const classes = await Class.find({ status: "activa" }).populate("professor", "name email");
  res.json(classes);
}

/**
 * POST /api/classes/:id/host — Funcionalidad 4
 * El profesor activa la clase: cambia estado, genera código único.
 */
async function hostClass(req, res) {
  const cls = await Class.findOne({ _id: req.params.id, professor: req.user.id });
  if (!cls) {
    return res.status(404).json({ message: "Clase no encontrada o sin permiso" });
  }

  const code = await generateUniqueCode();
  cls.status = "activa";
  cls.code = code;
  await cls.save();

  res.json({ message: "Clase iniciada", code, classId: cls._id });
}

/**
 * POST /api/classes/join — Funcionalidad 5
 * Busca la clase activa por código para aprobar el ingreso.
 * Body: { code }
 */
async function joinByCode(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Código requerido" });

  const cls = await Class.findOne({ code: code.toUpperCase(), status: "activa" }).populate(
    "professor",
    "name email"
  );

  if (!cls) {
    return res.status(404).json({ message: "Clase no encontrada o no activa" });
  }

  // Devuelve info básica de la clase para mostrar en el frontend del alumno
  res.json({
    classId: cls._id,
    name: cls.name,
    subject: cls.subject,
    course: cls.course,
    schedule: cls.schedule,
    professor: cls.professor,
  });
}

/**
 * POST /api/classes/:id/close — Cierra la clase activa
 */
async function closeClass(req, res) {
  const cls = await Class.findOne({ _id: req.params.id, professor: req.user.id });
  if (!cls) return res.status(404).json({ message: "Clase no encontrada" });

  cls.status = "cerrada";
  cls.code = null;
  await cls.save();
  res.json({ message: "Clase cerrada" });
}

module.exports = { createClass, getMyClasses, getActiveClasses, hostClass, joinByCode, closeClass };