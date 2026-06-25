// sockets/classSocket.js — Funcionalidades 4, 5, 6, 7, 9, 10 y 13
const Class    = require("../models/Class");
const Question = require("../models/Question");
const { isBanned }           = require("../controllers/moderationController");
const { processNewQuestion } = require("../services/questionService");
const { sortByPriority }     = require("../utils/priorityCalculator");

function initClassSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // ── Funcionalidad 5: UNIRSE A SALA ──────────────────────────────────────
    socket.on("join_class", async ({ code, role, sessionId }) => {
      try {
        if (!code) { socket.emit("error", { message: "Código requerido" }); return; }

        const candidateSession = sessionId || socket.id;
        if (isBanned(candidateSession)) {
          socket.emit("kicked", { message: "Fuiste expulsado de la clase" });
          socket.disconnect(true);
          return;
        }

        const cls = await Class.findByCode(code);
        if (!cls) { socket.emit("error", { message: "Clase no activa o inexistente" }); return; }

        const classId = cls.id;
        socket.join(classId);
        socket.data.classId   = classId;
        socket.data.role      = role;
        socket.data.sessionId = candidateSession;

        socket.emit("class_info", {
          classId,
          name:     cls.name,
          subject:  cls.subject,
          course:   cls.course,
          schedule: cls.schedule,
          code:     cls.code,
        });

        // Enviar historial de preguntas pendientes al conectarse
        const pending = await Question.findPendingByClass(classId);
        if (pending.length > 0) {
          if (role === "profesor") {
            const sortedList = sortByPriority(pending);
            socket.emit("question_update", { sortedList });
          } else {
            socket.emit("questions_history", { questions: pending });
          }
        }

        emitStudentCount(io, classId);
        console.log(`👤 Socket ${socket.id} unido a clase ${classId} como ${role}`);
      } catch (err) {
        console.error("Error en join_class:", err.message);
        socket.emit("error", { message: "Error al unirse a la clase" });
      }
    });

    // ── Funcionalidad 7: ENVIAR PREGUNTA ────────────────────────────────────
    socket.on("send_question", async ({ classId, text, category }) => {
      try {
        // Fallback: si el frontend no mandó classId, usar el del socket
        const resolvedClassId = classId || socket.data.classId;

        if (!resolvedClassId) {
          socket.emit("error", { message: "No estás en ninguna clase" }); return;
        }
        if (!text || text.trim().length === 0 || text.length > 500) {
          socket.emit("error", { message: "Pregunta inválida" }); return;
        }
        const { question, merged, sortedList } = await processNewQuestion({
          classId: resolvedClassId,
          text,
          category,
          authorSession: socket.data.sessionId || socket.id,
        });
        io.to(resolvedClassId).emit("question_update", { question, merged, sortedList });
      } catch (err) {
        console.error("Error en send_question:", err.message);
        socket.emit("error", { message: "Error al enviar la pregunta" });
      }
    });
    // ── Funcionalidad 10: CAMBIAR ESTADO ────────────────────────────────────
    socket.on("update_question_status", async ({ questionId, status, classId }) => {
      try {
        if (socket.data.role !== "profesor") return;
        const allowed = ["respondida", "pospuesta", "pendiente"];
        if (!allowed.includes(status)) return;

        const question = await Question.updateStatus(questionId, status);
        if (!question) return;

        const pending     = await Question.findPendingByClass(classId);
        const sortedList  = sortByPriority(pending);

        io.to(classId).emit("question_update", { question, sortedList });
      } catch (err) {
        console.error("Error en update_question_status:", err.message);
        socket.emit("error", { message: "Error al actualizar estado" });
      }
    });

    // ── Funcionalidad 13: EXPULSAR ALUMNO ───────────────────────────────────
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

    // ── DESCONEXIÓN ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { classId } = socket.data;
      if (classId) emitStudentCount(io, classId);
      console.log(`🔌 Socket desconectado: ${socket.id}`);
    });
  });
}

async function emitStudentCount(io, classId) {
  const sockets = await io.in(classId).fetchSockets();
  const count   = sockets.filter((s) => s.data.role === "alumno").length;
  io.to(classId).emit("student_count", { count });
}

module.exports = { initClassSocket };