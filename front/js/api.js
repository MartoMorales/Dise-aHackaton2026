// front/js/api.js
//
// Helpers compartidos por todas las pantallas: URL base de la API,
// guardar/leer el token de sesion, y un wrapper de fetch que agrega
// automaticamente el header Authorization cuando hay sesion activa.

const API_BASE_URL = "http://localhost:3000/api";

function guardarSesion(token, usuario) {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function obtenerToken() {
  return localStorage.getItem("token");
}

function obtenerUsuario() {
  const usuario = localStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
}

function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "../login/login.html";
}

/**
 * Wrapper de fetch que agrega el token de sesion automaticamente.
 * @param {string} ruta - ruta relativa a API_BASE_URL, ej: "/auth/login"
 * @param {object} opciones - mismas opciones que el fetch nativo
 */
async function apiFetch(ruta, opciones = {}) {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers,
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || "Error en la peticion.");
  }

  return datos;
}