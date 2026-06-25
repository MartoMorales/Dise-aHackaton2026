// front/alumno/clase/main.js
const MAX_LEN = 500;

let categoriaSeleccionada = null;
let esAnonimo = true; 

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("alumno")) return;

  const classId = sessionStorage.getItem("classId");
  if (!classId) {
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

  // CORRECCIÓN: Ahora trae la instancia compartida de front/js/socket.js
  const socket = obtenerSocket(); 
  if (!socket) return;

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
  const elementoNombre = document.getElementById("userName");
  // CORRECCIÓN: Validamos de forma segura que el elemento exista en este HTML específico
  if (elementoNombre) {
    elementoNombre.textContent = u.nombre || u.email || "Usuario";
  }
}

function pintarNombreClase() {
  const raw = sessionStorage.getItem("classInfo");
  if (!raw) return;
  try {
    const info = JSON.parse(raw);
    const titulo = info.course ? `${info.name} (${info.course})` : info.name;
    document.getElementById("className").textContent = titulo || "Clase";
  } catch {
    /* error bypass */
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}