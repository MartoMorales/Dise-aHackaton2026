// front/profesor/clase/main.js
// Panel de la sala iniciada (profesor) — modo demo.
// Muestra los mensajes que irían mandando los alumnos, con acciones
// de responder (✓) y eliminar (🗑). Sin backend.

const SVG_TRASH =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

// Categorías que puede elegir el alumno (etiqueta + color)
const CAT_INFO = {
  desarrollo:  { label: "Desarrollar",         color: "#7C3AED" },
  duda:        { label: "Duda puntual",        color: "#2563EB" },
  repetir:     { label: "Repetir/Reformular",  color: "#D97706" },
  significado: { label: "Significado",         color: "#DC2626" },
};

// Mensajes de ejemplo que se siembran la primera vez que se abre una clase
const MENSAJES_DEMO = [
  { autor: "Anónimo",    categoria: "duda",        texto: "¿Por qué la Revolución de Mayo fue en 1810 y no antes?" },
  { autor: "Anónimo",    categoria: "repetir",     texto: "¿Podés repetir las causas de la independencia?" },
  { autor: "Martina G.", categoria: "significado", texto: "¿Qué diferencia hay entre unitarios y federales?" },
  { autor: "Anónimo",    categoria: "desarrollo",  texto: "No entendí lo del Cabildo Abierto, ¿lo explicás de nuevo?" },
  { autor: "Tomás R.",   categoria: "duda",        texto: "¿Esto entra en la prueba del viernes?" },
];

let mensajes = [];
let CLASS_KEY = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("profesor")) return;

  // Datos de la clase (guardados al tocar "Iniciar")
  const classId   = sessionStorage.getItem("classId") || "x";
  const classCode = sessionStorage.getItem("classCode") || "XXXXXX";
  let className = "Clase";
  const demo = sessionStorage.getItem("classDemo");
  if (demo) {
    try { className = JSON.parse(demo).name || "Clase"; } catch {}
  }

  document.getElementById("clsName").textContent = "Clase: " + className;
  document.getElementById("clsCode").textContent = "Código: " + classCode;

  const u = obtenerUsuario();
  document.getElementById("userName").textContent = u.nombre || u.email;

  // Las preguntas no respondidas se guardan por clase y se recuperan al reabrir
  CLASS_KEY = "demo_mensajes_v2_" + classId;
  mensajes = cargarMensajes();

  render();
});

/* ── Persistencia de preguntas ────────────────────────── */
function cargarMensajes() {
  const raw = localStorage.getItem(CLASS_KEY);
  if (raw === null) {
    // Primera vez para esta clase: sembrar ejemplos
    const seed = MENSAJES_DEMO.slice();
    localStorage.setItem(CLASS_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw) || []; } catch { return []; }
}

function guardarMensajes() {
  localStorage.setItem(CLASS_KEY, JSON.stringify(mensajes));
}

function render() {
  const list = document.getElementById("msgList");

  if (!mensajes.length) {
    list.innerHTML = '<div class="cls-empty">No hay mensajes por ahora.</div>';
    return;
  }

  list.innerHTML = mensajes.map((m, i) => cardHTML(m, i)).join("");
}

function cardHTML(m, i) {
  const autor = m.autor || "Anónimo";
  const box = m.texto
    ? `<div class="msg-box">${escapeHtml(m.texto)}</div>`
    : `<div class="msg-box placeholder">Mensaje de alumnos</div>`;

  const cat = CAT_INFO[m.categoria] || CAT_INFO.duda;
  const catTag = `<div class="msg-cat" style="background:${cat.color}">${cat.label}</div>`;

  return `
    <div class="msg-card">
      <h3>${escapeHtml(autor)}</h3>
      ${box}
      <div class="msg-footer">
        ${catTag}
        <div class="msg-actions">
          <button class="msg-btn msg-ok"  onclick="responder(${i})"  title="Marcar como respondida">✓</button>
          <button class="msg-btn msg-del" onclick="eliminar(${i})"   title="Eliminar">${SVG_TRASH}</button>
        </div>
      </div>
    </div>`;
}

/* ── Acciones ─────────────────────────────────────────── */
function responder(i) {
  // Marcar como respondida = sacarla de la lista (no se vuelve a guardar)
  mensajes.splice(i, 1);
  guardarMensajes();
  render();
}

function eliminar(i) {
  mensajes.splice(i, 1);
  guardarMensajes();
  render();
}

/* ── Util ─────────────────────────────────────────────── */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}
