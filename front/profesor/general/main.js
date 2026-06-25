// front/profesor/general/main.js
// Pantalla "Tus clases" (profesor). Modo demo: las clases se guardan en
// localStorage y se renderizan como tarjetas. Al crear una con el botón "+",
// se agrega una tarjeta nueva en el mismo formato.

const STORAGE_KEY = "demo_clases_profesor";

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("profesor")) return;

  const u = obtenerUsuario();
  document.getElementById("userName").textContent = u.nombre || u.email;

  render();

  document.getElementById("fab").addEventListener("click", () => abrirModal("modal-crear"));
  document.getElementById("btnCrearConfirm").addEventListener("click", crearClase);

  // Reacomodar columnas al cambiar el tamaño de la ventana
  let lastCols = numCols();
  window.addEventListener("resize", () => {
    if (numCols() !== lastCols) {
      lastCols = numCols();
      render();
    }
  });
});

/* ── Cantidad de columnas según ancho ─────────────────── */
function numCols() {
  return window.innerWidth <= 640 ? 1 : 3;
}

/* ── Persistencia ─────────────────────────────────────── */
function getClases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveClases(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

/* ── Render ───────────────────────────────────────────── */
function render() {
  const grid = document.getElementById("classesGrid");
  const clases = getClases();
  grid.innerHTML = "";

  if (!clases.length) {
    grid.innerHTML =
      '<p class="pc-empty">Todavía no creaste ninguna clase. Tocá el botón + para agregar una.</p>';
    return;
  }

  // Crear N columnas y repartir por orden de creación: i % N
  const n = numCols();
  const cols = [];
  for (let k = 0; k < n; k++) {
    const col = document.createElement("div");
    col.className = "pc-col";
    grid.appendChild(col);
    cols.push(col);
  }

  clases.forEach((c, i) => {
    cols[i % n].insertAdjacentHTML("beforeend", cardHTML(c, i));
  });
}

function cardHTML(c, i) {
  const desc = c.descripcion
    ? `<div class="pc-desc filled">${escapeHtml(c.descripcion)}</div>`
    : `<div class="pc-desc">Descripción de la clase</div>`;

  return `
    <div class="pc-card">
      <h3>${escapeHtml(c.nombre)}</h3>
      ${desc}
      <div class="pc-card-footer">
        <button class="pc-iniciar" onclick="iniciarClase(${i})">Iniciar</button>
        <button class="pc-eliminar" onclick="eliminarClase(${i})">Eliminar</button>
      </div>
    </div>`;
}

/* ── Crear clase ──────────────────────────────────────── */
function crearClase() {
  const nombre = document.getElementById("f-name").value.trim();
  const descripcion = document.getElementById("f-desc").value.trim();
  const errorBox = document.getElementById("crear-error");

  if (!nombre) {
    errorBox.textContent = "Poné un nombre para la clase.";
    errorBox.style.display = "block";
    return;
  }

  const clases = getClases();
  clases.push({ nombre, descripcion });
  saveClases(clases);

  // Limpiar y cerrar
  document.getElementById("f-name").value = "";
  document.getElementById("f-desc").value = "";
  errorBox.style.display = "none";
  cerrarModal("modal-crear");

  render();
}

/* ── Eliminar clase ───────────────────────────────────── */
function eliminarClase(i) {
  const clases = getClases();
  const nombre = clases[i] ? clases[i].nombre : "esta clase";
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

  clases.splice(i, 1);
  saveClases(clases);
  render();
}

/* ── Iniciar clase ────────────────────────────────────── */
function iniciarClase(i) {
  const clases = getClases();
  const c = clases[i];
  if (!c) return;

  // id estable por clase (para guardar/recuperar sus preguntas)
  if (!c.id) {
    c.id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    saveClases(clases);
  }

  // Código SIEMPRE nuevo y aleatorio cada vez que se abre la sala
  const codigo = generarCodigo();

  sessionStorage.setItem("classId", c.id);
  sessionStorage.setItem("classCode", codigo);
  sessionStorage.setItem(
    "classDemo",
    JSON.stringify({
      name: c.nombre,
      subject: c.descripcion || "",
      course: "",
      schedule: "",
    })
  );

  window.location.href = "../clase/index.html";
}

function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let k = 0; k < 6; k++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

/* ── Helpers de modal ─────────────────────────────────── */
function abrirModal(id) {
  document.getElementById(id).classList.add("open");
}
function cerrarModal(id) {
  document.getElementById(id).classList.remove("open");
}

/* ── Util ─────────────────────────────────────────────── */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}
