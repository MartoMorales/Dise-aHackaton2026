// front/alumno/general/main.js
// Pantalla "Unirse a clase" (alumno).
//
// Flujo: el alumno ingresa el código de 6 caracteres que le dio el profesor,
// se valida el formato en el cliente, y se intenta unir a la clase vía
// Socket.io (evento join_class), que es el mismo canal que va a usar la
// pantalla de clase en tiempo real (preguntas, conteo de presentes, etc).
//
// Requiere: js/api.js (requiereAuth, obtenerUsuario, cerrarSesion) y
// js/socket.js (conexión socket compartida) cargados antes de este archivo.

const CODE_LENGTH = 6;

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("alumno")) return;

  const usuario = obtenerUsuario();
  pintarUsuario(usuario);

  const inputCodigo = document.getElementById("f-code");
  const btnUnirse = document.getElementById("btnUnirse");
  const errorBox = document.getElementById("join-error");

  // Solo deja escribir letras/números y los pasa a mayúsculas en vivo
  inputCodigo.addEventListener("input", () => {
    inputCodigo.value = inputCodigo.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LENGTH);
    ocultarError();
  });

  inputCodigo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unirseAClase();
  });

  btnUnirse.addEventListener("click", unirseAClase);

  function unirseAClase() {
    const code = inputCodigo.value.trim();

    if (code.length !== CODE_LENGTH) {
      mostrarError(`El código debe tener ${CODE_LENGTH} caracteres.`);
      return;
    }

    setCargando(true);

    const sessionId = obtenerSessionId();
    const socket = obtenerSocket();

    // Limpiamos listeners previos por si el usuario reintenta unirse
    socket.off("class_info");
    socket.off("error");
    socket.off("kicked");

    socket.once("class_info", (data) => {
      sessionStorage.setItem("classId", data.classId);
      sessionStorage.setItem("classCode", code);
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
      setCargando(false);
      window.location.href = "../clase/index.html";
    });

    socket.once("error", (data) => {
      setCargando(false);
      mostrarError(data?.message || "No se pudo unir a la clase.");
    });

    socket.once("kicked", (data) => {
      setCargando(false);
      mostrarError(data?.message || "No podés unirte a esta clase.");
    });

    socket.emit("join_class", { code, role: "alumno", sessionId });
  }

  function setCargando(activo) {
    btnUnirse.disabled = activo;
    btnUnirse.textContent = activo ? "Uniendo..." : "Unirse";
  }

  function mostrarError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = "block";
    inputCodigo.classList.add("invalid");
  }

  function ocultarError() {
    errorBox.style.display = "none";
    inputCodigo.classList.remove("invalid");
  }
});

/* ── Helpers ────────────────────────────────────────── */

function pintarUsuario(u) {
  if (!u) return;
  const nombreCompleto = u.nombre || u.email || "Usuario";
  const primerNombre = nombreCompleto.split(" ")[0];
  document.getElementById("userName").textContent = nombreCompleto;
  document.getElementById("userFirstName").textContent = primerNombre;
}

// El sessionId identifica al alumno para baneos y conteo de presentes.
// No puede ser solo socket.id porque ese cambia en cada reconexión;
// se genera una vez por sesión de navegador y se reutiliza.
function obtenerSessionId() {
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}