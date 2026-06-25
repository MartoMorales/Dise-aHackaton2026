// front/alumno/clase/main.js
// Pantalla "Clase" (alumno).
//
// Flujo: el alumno escribe su pregunta, elige categoría (obligatoria) y
// el toggle de anónimo (sin efecto real en el backend actual — ver nota
// más abajo), y la envía vía Socket.io (evento send_question). El feed
// de la derecha se actualiza en vivo con question_update, que el server
// emite a toda la sala cada vez que hay una pregunta nueva o fusionada.
//
// Requiere: js/api.js, js/socket.js, y que la pantalla anterior haya
// guardado classId / classInfo en sessionStorage tras unirse a la clase.

const MAX_LEN = 500;

let categoriaSeleccionada = null;
let esAnonimo = true; // por defecto "Si", como en el mockup

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("alumno")) return;

  const classId = sessionStorage.getItem("classId");
  if (!classId) {
    // Sin clase activa no hay nada que hacer en esta pantalla
    window.location.href = "../general/index.html";
    return;
  }

  const usuario = obtenerUsuario();
  pintarUsuario(usuario);
  pintarNombreClase();

  const textarea = document.getElementById("f-text");
  const charCount = document.getElementById("charCount");
  const colorBar = document.getElementById("colorBar");
  const btnEnviar = document.getElementById("btnEnviar");
  const errorBox = document.getElementById("send-error");

  textarea.addEventListener("input", () => {
    charCount.textContent = textarea.value.length;
    ocultarError();
  });

  document.getElementById("btnAnonSi").addEventListener("click", () => setAnonimo(true));
  document.getElementById("btnAnonNo").addEventListener("click", () => setAnonimo(false));

  document.querySelectorAll(".cl-cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => seleccionarCategoria(btn));
  });

  btnEnviar.addEventListener("click", enviarPregunta);

  const socket = obtenerSocket();

  // Si el alumno llegó desde general/index.html (irAClase), el socket
  // existe pero todavía no emitió join_class — hacerlo ahora.
  const classCode = sessionStorage.getItem("classCode");
  if (classCode && !socket.data?.joined) {
    const sessionId = sessionStorage.getItem("sessionId") ||
      ("s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    sessionStorage.setItem("sessionId", sessionId);
    socket.emit("join_class", { code: classCode, role: "alumno", sessionId });
    if (socket.data) socket.data.joined = true;
  }

  // Historial de preguntas ya existentes en la clase al momento de unirse
  socket.on("questions_history", ({ questions }) => {
    if (!questions || !questions.length) return;
    // Pintamos de más antigua a más nueva para que prepend las deje en orden cronológico
    [...questions].reverse().forEach(agregarPreguntaAlFeed);
  });

  // Si el backend ya mandó class_info al unirse (pantalla anterior), puede
  // volver a emitirlo en reconexiones; lo escuchamos por si refresca la página.
  socket.on("class_info", (data) => {
    sessionStorage.setItem("classId", data.classId);
    sessionStorage.setItem(
      "classInfo",
      JSON.stringify({
        name: data.name,
        subject: data.subject,
        course: data.course,
        schedule: data.schedule,
        professor: data.professor,
      })
    );
    pintarNombreClase();
  });

  // Actualización en vivo de preguntas (propias y de otros alumnos)
  socket.on("question_update", ({ question }) => {
    if (!question) return;
    agregarPreguntaAlFeed(question);
  });

  socket.on("error", (data) => {
    mostrarError(data?.message || "Ocurrió un error en la clase.");
  });

  socket.on("kicked", (data) => {
    alert(data?.message || "Fuiste expulsado de la clase.");
    sessionStorage.removeItem("classId");
    window.location.href = "../general/index.html";
  });

  /* ── Funciones internas ─────────────────────────────── */

  function setAnonimo(valor) {
    esAnonimo = valor;
    document.getElementById("btnAnonSi").classList.toggle("active", valor === true);
    document.getElementById("btnAnonNo").classList.toggle("active", valor === false);
  }

  function seleccionarCategoria(btn) {
    document.querySelectorAll(".cl-cat-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    categoriaSeleccionada = btn.dataset.cat;
    colorBar.classList.add("active");
    ocultarError();
  }

  function enviarPregunta() {
    const text = textarea.value.trim();

    if (!text) {
      mostrarError("Escribí tu pregunta antes de enviar.");
      return;
    }
    if (text.length > MAX_LEN) {
      mostrarError(`Máximo ${MAX_LEN} caracteres.`);
      return;
    }
    if (!categoriaSeleccionada) {
      mostrarError("Elegí una categoría para tu pregunta.");
      return;
    }

    setCargando(true);

    socket.emit("send_question", {
      classId,
      text,
      category: categoriaSeleccionada,
    });

    // No esperamos una confirmación 1 a 1: el server responde a toda la
    // sala con question_update, que ya está escuchado arriba y repinta
    // el feed (incluida esta pregunta apenas vuelva).
    textarea.value = "";
    charCount.textContent = "0";
    setCargando(false);
  }

  function setCargando(activo) {
    btnEnviar.disabled = activo;
    btnEnviar.textContent = activo ? "Enviando..." : "Enviar";
  }

  function mostrarError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }

  function ocultarError() {
    errorBox.style.display = "none";
  }
});

/* ── Feed ─────────────────────────────────────────────── */

function agregarPreguntaAlFeed(question) {
  const feed = document.getElementById("feed");
  const empty = document.getElementById("feedEmpty");
  if (empty) empty.style.display = "none";

  const hora = new Date(question.createdAt || Date.now()).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Nota: el backend no devuelve un nombre legible de usuario, solo un
  // identificador de sesión interno. Como no hay campo real para "nombre
  // visible" en el modelo de Question, siempre se muestra "Anónimo".
  const div = document.createElement("div");
  div.className = "cl-msg";
  div.dataset.cat = question.category;
  div.innerHTML = `
    <div class="cl-msg-author">
      <span>Anónimo</span>
      <span class="cl-msg-time">${hora}</span>
    </div>
    <div class="cl-msg-bubble">${escapeHtml(question.text)}</div>
  `;

  feed.prepend(div);
}

/* ── Helpers ──────────────────────────────────────────── */

function pintarUsuario(u) {
  if (!u) return;
  document.getElementById("userName").textContent = u.nombre || u.email || "Usuario";
}

function volverAGeneral() {
  sessionStorage.removeItem("classId");
  sessionStorage.removeItem("classCode");
  sessionStorage.removeItem("classInfo");
  window.location.href = "../general/index.html";
}

function pintarNombreClase() {
  const raw = sessionStorage.getItem("classInfo");
  if (!raw) return;
  try {
    const info = JSON.parse(raw);
    const titulo = info.course ? `${info.name} (${info.course})` : info.name;
    document.getElementById("className").textContent = titulo || "Clase";
  } catch {
    /* si no se puede parsear, se deja el título por defecto */
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}