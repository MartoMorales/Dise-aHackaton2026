// sockets/classSocket.js — Funcionalidades 4, 5, 6, 7, 9, 10 y 13
// Gestiona toda la comunicación en tiempo real de las salas de clase

const Class = require("../models/Class");
const { isBanned } = require("../controllers/moderationController");
const { processNewQuestion } = require("../services/questionService");
const Question = require("../models/Question");
const { sortByPriority } = require("../utils/priorityCalculator");

/**
 * Inicializa todos los eventos de Socket.io.
 * Llamado desde app.js pasando la instancia `io`.
 */
function initClassSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // ─── Funcionalidad 5: UNIRSE A SALA ───────────────────────────────────────
    // Evento: join_class
    // Payload: { code, role: "profesor"|"alumno", sessionId }
    socket.on("join_class", async ({ code, role, sessionId }) => {
      try {
        if (!code) {
          socket.emit("error", { message: "Código requerido" });
          return;
        }

        // Funcionalidad 13: rechazar sesiones baneadas al unirse
        const candidateSession = sessionId || socket.id;
        if (isBanned(candidateSession)) {
          socket.emit("kicked", { message: "Fuiste expulsado de la clase" });
          socket.disconnect(true);
          return;
        }

        const cls = await Class.findOne({ code: code.toUpperCase(), status: "activa" });
        if (!cls) {
          socket.emit("error", { message: "Clase no activa o inexistente" });
          return;
        }

        const classId = cls._id.toString();

        socket.join(classId);
        socket.data.classId = classId;
        socket.data.role = role;
        socket.data.sessionId = candidateSession;

        socket.emit("class_info", {
          classId,
          name: cls.name,
          subject: cls.subject,
          course: cls.course,
          schedule: cls.schedule,
          code: cls.code,
        });

        // Funcionalidad 6: notifica al profesor la cantidad actualizada
        emitStudentCount(io, classId);

        console.log(`👤 Socket ${socket.id} unido a clase ${classId} como ${role}`);
      } catch (err) {
        console.error("Error en join_class:", err.message);
        socket.emit("error", { message: "Error al unirse a la clase" });
      }
    });

    // ─── Funcionalidad 7: ENVIAR PREGUNTA ─────────────────────────────────────
    // Evento: send_question
    // Payload: { classId, text, category }
    socket.on("send_question", async ({ classId, text, category }) => {
      try {
        if (!text || text.trim().length === 0 || text.length > 500) {
          socket.emit("error", { message: "Pregunta inválida" });
          return;
        }

        // Funcionalidades 7, 8, 9 centralizadas en un único servicio
        const { question, merged, sortedList } = await processNewQuestion({
          classId,
          text,
          category,
          authorSession: socket.data.sessionId || socket.id,
        });

        io.to(classId).emit("question_update", { question, merged, sortedList });
      } catch (err) {
        console.error("Error en send_question:", err.message);
        socket.emit("error", { message: "Error al enviar la pregunta" });
      }
    });

    // ─── Funcionalidad 10: CAMBIAR ESTADO DE PREGUNTA ─────────────────────────
    // Evento: update_question_status
    // Payload: { questionId, status, classId }
    socket.on("update_question_status", async ({ questionId, status, classId }) => {
      try {
        if (socket.data.role !== "profesor") return;

        const allowed = ["respondida", "pospuesta", "pendiente"];
        if (!allowed.includes(status)) return;

        const question = await Question.findByIdAndUpdate(questionId, { status }, { new: true });
        if (!question) return;

        const pending = await Question.find({ classId, status: "pendiente", sentOutOfClass: false });
        const sortedList = sortByPriority(pending);

        io.to(classId).emit("question_update", { question, sortedList });
      } catch (err) {
        console.error("Error en update_question_status:", err.message);
        socket.emit("error", { message: "Error al actualizar estado" });
      }
    });

    // ─── Funcionalidad 13: EXPULSAR ALUMNO ────────────────────────────────────
    // Evento: kick_user
    // Payload: { targetSessionId, classId }
    socket.on("kick_user", ({ targetSessionId, classId }) => {
      if (socket.data.role !== "profesor") return;

      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.data.sessionId === targetSessionId
      );

      if (targetSocket) {
        targetSocket.emit("kicked", { message: "Fuiste expulsado de la clase por el profesor" });
        targetSocket.leave(classId);
        targetSocket.disconnect(true);
      }

      emitStudentCount(io, classId);
    });

    // ─── DESCONEXIÓN ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { classId } = socket.data;
      if (classId) emitStudentCount(io, classId);
      console.log(`🔌 Socket desconectado: ${socket.id}`);
    });
  });
}

/**
 * Funcionalidad 6: cuenta sockets en la sala y notifica al profesor.
 * @param {Server} io
 * @param {string} classId
 */
async function emitStudentCount(io, classId) {
  const sockets = await io.in(classId).fetchSockets();
  const count = sockets.filter((s) => s.data.role === "alumno").length;
  io.to(classId).emit("student_count", { count });
}

module.exports = { initClassSocket };