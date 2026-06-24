// front/js/api.js
//
// Helpers compartidos por todas las pantallas: URL base de la API,
// guardar/leer el token de sesion, y un wrapper de fetch que agrega
// automaticamente el header Authorization cuando hay sesion activa.
// front/js/api.js
// Helpers compartidos: URL base, sesión, fetch autenticado, toasts

const API_BASE_URL = "http://localhost:3000/api";

/* ── Sesión ─────────────────────────────────────────── */
function guardarSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}
function obtenerToken()   { return localStorage.getItem("token"); }
function obtenerUsuario() {
  const u = localStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}
function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login/login.html";
}
function requiereAuth(rolRequerido) {
  const usuario = obtenerUsuario();
  if (!usuario || !obtenerToken()) {
    window.location.href = "/login/login.html";
    return false;
  }
  if (rolRequerido && usuario.rol !== rolRequerido) {
    const destino = usuario.rol === "profesor"
      ? "/profesor/general/index.html"
      : "/alumno/general/index.html";
    window.location.href = destino;
    return false;
  }
  return true;
}

/* ── Fetch wrapper ───────────────────────────────────── */
async function apiFetch(ruta, opciones = {}) {
  const token = obtenerToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers,
  });
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || "Error en la petición.");
  return datos;
}

/* ── Toast ───────────────────────────────────────────── */
function showToast(message, type = "default", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ── Socket.io helper ────────────────────────────────── */
function crearSocket() {
  if (typeof io === "undefined") return null;
  return io("http://localhost:3000", {
    auth: { token: obtenerToken() },
    transports: ["websocket"],
  });
}

/* ── Formato de fecha ────────────────────────────────── */
function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });
}
function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/* ── Categoría helpers ───────────────────────────────── */
const CATEGORIAS = {
  desarrollo:  { label: "Desarrollo",       class: "tag-desarrollo"  },
  duda:        { label: "Duda puntual",      class: "tag-duda"        },
  curiosidad:  { label: "Curiosidad",        class: "tag-curiosidad"  },
  repetir:     { label: "Repetir/Reformular",class: "tag-repetir"     },
  significado: { label: "Significado",       class: "tag-significado" },
};
function catTag(cat) {
  const c = CATEGORIAS[cat] || { label: cat, class: "tag-duda" };
  return `<span class="cat-tag ${c.class}">${c.label}</span>`;
}