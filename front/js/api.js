// front/js/api.js
// Helpers compartidos: URL base, sesión, fetch autenticado, toasts

// En producción (Vercel) la API está en el mismo origen.
// En desarrollo cambiá esto a "http://localhost:3000/api"
const API_BASE_URL = "/api";

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
const DEMO_TOKEN = "demo-token";

async function apiFetch(ruta, opciones = {}) {
  const token = obtenerToken();
  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };
  // No enviar el demo-token al backend (no es un JWT válido)
  if (token && token !== DEMO_TOKEN) headers["Authorization"] = `Bearer ${token}`;

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers,
  });

  const datos = await respuesta.json();

  // Si el token expiró en una ruta protegida (no en login), limpiar sesión
  if (respuesta.status === 401 && !ruta.includes("/auth/")) {
    cerrarSesion();
    return;
  }

  // FIX: el backend devuelve { message }, no { error }
  if (!respuesta.ok) throw new Error(datos.message || datos.error || "Error en la petición.");
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
  // En producción (mismo origen), no hay que poner URL explícita
  const serverUrl = window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin;
  return io(serverUrl, {
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
  desarrollo:  { label: "Desarrollo",        class: "tag-desarrollo"  },
  duda_puntual:{ label: "Duda puntual",       class: "tag-duda"        },
  curiosidad:  { label: "Curiosidad",         class: "tag-curiosidad"  },
  repetir:     { label: "Repetir/Reformular", class: "tag-repetir"     },
  significado: { label: "Significado",        class: "tag-significado" },
};
function catTag(cat) {
  const c = CATEGORIAS[cat] || { label: cat, class: "tag-duda" };
  return `<span class="cat-tag ${c.class}">${c.label}</span>`;
}
