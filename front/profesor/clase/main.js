// front/profesor/clase/main.js
// Panel del profesor en la sala — conectado al backend real via Socket.io.

const SVG_TRASH =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

const CAT_INFO = {
  desarrollo:   { label: "Desarrollar",         color: "#7C3AED" },
  duda_puntual: { label: "Duda puntual",         color: "#2563EB" },
  curiosidad:   { label: "Curiosidad",           color: "#059669" },
  repetir:      { label: "Repetir/Reformular",   color: "#D97706" },
  significado:  { label: "Significado",          color: "#DC2626" },
};

let socket   = null;
let classId  = null;
let classCode = null;
let preguntasMap = new Map();

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("profesor")) return;

  classId   = sessionStorage.getItem("classId");
  classCode = sessionStorage.getItem("classCode");

  if (!classId || !classCode) {
    window.location.href = "../general/index.html";
    return;
  }

  const u = obtenerUsuario();
  document.getElementById("userName").textContent = u.nombre || u.email;
  document.getElementById("clsCode").textContent  = "Código: " + classCode;

  initSocket();
});

/* ── Socket ──────────────────────────────────────────── */
function initSocket() {
  socket = crearSocket();
  if (!socket) { showToast("No se pudo conectar con el servidor", "error"); return; }

  socket.on("connect", () => {
    socket.emit("join_class", {
      code:      classCode,
      role:      "profesor",
      sessionId: socket.id,
    });
  });

  socket.on("class_info", (cls) => {
    classId = cls.classId;
    document.getElementById("clsName").textContent = "Clase: " + cls.name;
    document.getElementById("clsCode").textContent = "Código: " + cls.code;
  });

  socket.on("student_count", ({ count }) => {
    // opcional: mostrar cantidad de alumnos si hay un elemento para eso
    const el = document.getElementById("studentCount");
    if (el) el.textContent = count + " alumnos";
  });

  // Llega cuando se crea/actualiza una pregunta
  socket.on("question_update", ({ question, sortedList }) => {
    if (sortedList) {
      preguntasMap.clear();
      sortedList.forEach(q => preguntasMap.set(q.id, q));
    } else if (question) {
      preguntasMap.set(question.id, question);
    }
    render();
  });

  socket.on("error", ({ message }) => showToast(message, "error"));

  socket.on("disconnect", () => showToast("Desconectado del servidor", "error"));
}

/* ── Render ──────────────────────────────────────────── */
function render() {
  const list = document.getElementById("msgList");

  const preguntas = [...preguntasMap.values()]
    .filter(q => q.status === "pendiente" || q.status === "pospuesta")
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (!preguntas.length) {
    list.innerHTML = '<div class="cls-empty">No hay preguntas por ahora.</div>';
    return;
  }

  list.innerHTML = preguntas.map(q => cardHTML(q)).join("");
}

function cardHTML(q) {
  const cat    = CAT_INFO[q.category] || { label: q.category, color: "#2563EB" };
  const autor  = q.author_session && q.author_session !== "anónimo"
    ? q.author_session
    : "Anónimo";
  const prioTag = (q.priority > 1)
    ? `<span style="margin-left:8px;color:#D97706;font-size:13px;font-weight:700;">🔥 ×${q.priority}</span>`
    : "";

  return `
    <div class="msg-card">
      <h3>${escapeHtml(autor)}${prioTag}</h3>
      <div class="msg-box">${escapeHtml(q.text)}</div>
      <div class="msg-footer">
        <div class="msg-cat" style="background:${cat.color}">${cat.label}</div>
        <div class="msg-actions">
          <button class="msg-btn msg-ok"  onclick="responder('${q.id}')"  title="Marcar como respondida">✓</button>
          <button class="msg-btn msg-del" onclick="eliminar('${q.id}')"   title="Eliminar">${SVG_TRASH}</button>
        </div>
      </div>
    </div>`;
}

/* ── Acciones ────────────────────────────────────────── */
function responder(questionId) {
  if (!socket) return;
  socket.emit("update_question_status", { questionId, status: "respondida", classId });
  preguntasMap.delete(questionId);
  render();
}

async function eliminar(questionId) {
  try {
    await apiFetch(`/moderation/question/${questionId}`, { method: "DELETE" });
    preguntasMap.delete(questionId);
    render();
  } catch (err) {
    showToast("Error al eliminar: " + err.message, "error");
  }
}

/* ── Util ────────────────────────────────────────────── */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}
