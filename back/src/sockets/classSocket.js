// sockets/classSocket.js — Funcionalidades 4, 5, 6, 7, 9, 10 y 13
// Gestiona toda la comunicación en tiempo real de las salas de clase

const Question = require("../models/Question");
const Class = require("../models/Class");
const { mergeIfRedundant } = require("../utils/questionMerger");
const { calculateScore, sortByPriority } = require("../utils/priorityCalculator");
const { isBanned } = require("../controllers/moderationController");

/**
 * Inicializa todos los eventos de Socket.io.
 * Llamado desde app.js pasando la instancia `io`.
 */
function initClassSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    // Funcionalidad 13: rechazar sockets baneados en la reconexión
    if (isBanned(socket.id)) {
      socket.emit("kicked", { message: "Fuiste expulsado de la clase" });
      socket.disconnect(true);
      return;
    }

    // ─── Funcionalidad 5: UNIRSE A SALA ───────────────────────────────────────
    // Evento: join_class
    // Payload: { classId, role: "profesor"|"alumno", sessionId }
    socket.on("join_class", async ({ classId, role, sessionId }) => {
      const cls = await Class.findById(classId);
      if (!cls || cls.status !== "activa") {
        socket.emit("error", { message: "Clase no activa o inexistente" });
        return;
      }

      socket.join(classId); // Une al socket a la sala de la clase
      socket.data.classId = classId;
      socket.data.role = role;
      socket.data.sessionId = sessionId || socket.id;

      // Envía info de la clase al que se une
      socket.emit("class_info", {
        name: cls.name,
        subject: cls.subject,
        course: cls.course,
        schedule: cls.schedule,
        code: cls.code,
      });

      // Funcionalidad 6: notifica al profesor la cantidad actualizada
      emitStudentCount(io, classId);

      console.log(`👤 Socket ${socket.id} unido a clase ${classId} como ${role}`);
    });

    // ─── Funcionalidad 7: ENVIAR PREGUNTA ─────────────────────────────────────
    // Evento: send_question
    // Payload: { classId, text, category }
    socket.on("send_question", async ({ classId, text, category }) => {
      // Validaciones
      if (!text || text.trim().length === 0 || text.length > 500) {
        socket.emit("error", { message: "Pregunta inválida" });
        return;
      }

      // Crear pregunta en BD
      let question = await Question.create({
        classId,
        text: text.trim(),
        category,
        authorSession: socket.data.sessionId || socket.id,
      });

      // Funcionalidad 8: detecta y fusiona redundantes
      const { merged, original } = await mergeIfRedundant(question);

      if (merged && original) {
        original.priority = calculateScore(original.mergeCount, original.category);
        await original.save();
        question = original;
      } else {
        question.priority = calculateScore(question.mergeCount, question.category);
        await question.save();
      }

      // Funcionalidad 9: obtiene lista ordenada y la emite al profesor
      const pending = await Question.find({ classId, status: "pendiente", sentOutOfClass: false });
      const sortedList = sortByPriority(pending);

      // Emite a toda la sala: nueva pregunta o actualización de prioridad
      io.to(classId).emit("question_update", { question, merged, sortedList });
    });

    // ─── Funcionalidad 10: CAMBIAR ESTADO DE PREGUNTA ─────────────────────────
    // Evento: update_question_status
    // Payload: { questionId, status, classId }
    socket.on("update_question_status", async ({ questionId, status, classId }) => {
      if (socket.data.role !== "profesor") return; // Solo el profesor puede

      const allowed = ["respondida", "pospuesta", "pendiente"];
      if (!allowed.includes(status)) return;

      const question = await Question.findByIdAndUpdate(questionId, { status }, { new: true });
      if (!question) return;

      const pending = await Question.find({ classId, status: "pendiente", sentOutOfClass: false });
      const sortedList = sortByPriority(pending);

      // Notifica a toda la sala el cambio de estado
      io.to(classId).emit("question_update", { question, sortedList });
    });

    // ─── Funcionalidad 13: EXPULSAR ALUMNO ────────────────────────────────────
    // Evento: kick_user
    // Payload: { targetSocketId, classId }
    socket.on("kick_user", ({ targetSocketId, classId }) => {
      if (socket.data.role !== "profesor") return;

      const targetSocket = io.sockets.sockets.get(targetSocketId);
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