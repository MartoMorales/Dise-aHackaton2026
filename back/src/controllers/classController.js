const Class = require("../models/Class");
const { generateUniqueCode } = require("../utils/codeGenerator");

/** POST /api/classes */
async function createClass(req, res) {
  try {
    const { name, subject, course, maxStudents, schedule } = req.body;
    if (!name || !subject || !course) {
      return res.status(400).json({ message: "Nombre, materia y curso son requeridos" });
    }
    const newClass = await Class.create({
      name, subject, course,
      maxStudents: maxStudents || 40,
      schedule: schedule || "",
      professorId: req.user.id,
    });
    res.status(201).json(newClass);
  } catch (err) {
    console.error("Error en createClass:", err.message);
    res.status(500).json({ message: "Error al crear la clase" });
  }
}

/** GET /api/classes */
async function getMyClasses(req, res) {
  try {
    const classes = await Class.findByProfessor(req.user.id);
    res.json({ clases: classes });
  } catch (err) {
    console.error("Error en getMyClasses:", err.message);
    res.status(500).json({ message: "Error al obtener clases" });
  }
}

/** GET /api/classes/active */
async function getActiveClasses(req, res) {
  try {
    const classes = await Class.findActive();
    res.json({ clases: classes });
  } catch (err) {
    console.error("Error en getActiveClasses:", err.message);
    res.status(500).json({ message: "Error al obtener clases activas" });
  }
}

/** POST /api/classes/:id/host */
async function hostClass(req, res) {
  try {
    const cls = await Class.findByProfessorAndId(req.params.id, req.user.id);
    if (!cls) {
      return res.status(404).json({ message: "Clase no encontrada o sin permiso" });
    }
    const code = await generateUniqueCode();
    const updated = await Class.updateCodeAndStatus(cls.id, code, "activa");
    res.json({ message: "Clase iniciada", code, classId: updated.id });
  } catch (err) {
    console.error("Error en hostClass:", err.message);
    res.status(500).json({ message: "Error al iniciar la clase" });
  }
}

/** POST /api/classes/join */
async function joinByCode(req, res) {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Código requerido" });

    const cls = await Class.findByCode(code);
    if (!cls) {
      return res.status(404).json({ message: "Clase no encontrada o no activa" });
    }

    res.json({
      clase: {
        _id: cls.id,
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        course: cls.course,
        schedule: cls.schedule,
        professor: { name: cls.professor_name, email: cls.professor_email },
      },
    });
  } catch (err) {
    console.error("Error en joinByCode:", err.message);
    res.status(500).json({ message: "Error al unirse a la clase" });
  }
}

/** POST /api/classes/:id/close */
async function closeClass(req, res) {
  try {
    const cls = await Class.findByProfessorAndId(req.params.id, req.user.id);
    if (!cls) return res.status(404).json({ message: "Clase no encontrada" });
    await Class.clearCode(cls.id);
    res.json({ message: "Clase cerrada" });
  } catch (err) {
    console.error("Error en closeClass:", err.message);
    res.status(500).json({ message: "Error al cerrar la clase" });
  }
}

/** DELETE /api/classes/:id */
async function deleteClass(req, res) {
  try {
    const cls = await Class.findByProfessorAndId(req.params.id, req.user.id);
    if (!cls) {
      return res.status(404).json({ message: "Clase no encontrada o sin permiso" });
    }
    await Class.delete(cls.id);
    res.json({ message: "Clase eliminada" });
  } catch (err) {
    console.error("Error en deleteClass:", err.message);
    res.status(500).json({ message: "Error al eliminar la clase" });
  }
}

module.exports = { createClass, getMyClasses, getActiveClasses, hostClass, joinByCode, closeClass, deleteClass };