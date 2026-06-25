// front/profesor/general/main.js
// Pantalla "Tus clases" (profesor) — conectada al backend real.

document.addEventListener("DOMContentLoaded", () => {
  if (!requiereAuth("profesor")) return;

  const u = obtenerUsuario();
  document.getElementById("userName").textContent = u.nombre || u.email;

  cargarClases();

  document.getElementById("fab").addEventListener("click", () => abrirModal("modal-crear"));
  document.getElementById("btnCrearConfirm").addEventListener("click", crearClase);

  let lastCols = numCols();
  window.addEventListener("resize", () => {
    if (numCols() !== lastCols) { lastCols = numCols(); renderGrid(clasesCache); }
  });
});

let clasesCache = [];

function numCols() {
  return window.innerWidth <= 640 ? 1 : 3;
}

/* ── Cargar clases desde el backend ──────────────────── */
async function cargarClases() {
  try {
    const res = await apiFetch("/classes");
    clasesCache = res.clases || [];
    renderGrid(clasesCache);
  } catch (err) {
    showToast("Error al cargar clases: " + err.message, "error");
    renderGrid([]);
  }
}

function renderGrid(clases) {
  const grid = document.getElementById("classesGrid");
  grid.innerHTML = "";

  if (!clases.length) {
    grid.innerHTML = '<p class="pc-empty">Todavía no creaste ninguna clase. Tocá el botón + para agregar una.</p>';
    return;
  }

  const n = numCols();
  const cols = [];
  for (let k = 0; k < n; k++) {
    const col = document.createElement("div");
    col.className = "pc-col";
    grid.appendChild(col);
    cols.push(col);
  }

  clases.forEach((c, i) => {
    cols[i % n].insertAdjacentHTML("beforeend", cardHTML(c));
  });
}

function cardHTML(c) {
  const desc = c.subject
    ? `<div class="pc-desc filled">${escapeHtml(c.subject)}</div>`
    : `<div class="pc-desc">Sin descripción</div>`;

  const estado = c.status === "activa"
    ? `<span style="color:#1AD302;font-size:13px;font-weight:700;">● Activa</span>`
    : `<span style="color:#94a3b8;font-size:13px;">● Inactiva</span>`;

  return `
    <div class="pc-card">
      <h3>${escapeHtml(c.name)}</h3>
      ${desc}
      ${estado}
      <div class="pc-card-footer">
        <button class="pc-iniciar" onclick="iniciarClase('${c.id}')">Iniciar</button>
        <button class="pc-eliminar" onclick="eliminarClase('${c.id}', '${escapeHtml(c.name)}')">Eliminar</button>
      </div>
    </div>`;
}

/* ── Crear clase ─────────────────────────────────────── */
async function crearClase() {
  const nombre     = document.getElementById("f-name").value.trim();
  const descripcion = document.getElementById("f-desc").value.trim();
  const errorBox   = document.getElementById("crear-error");

  if (!nombre) {
    errorBox.textContent = "Poné un nombre para la clase.";
    errorBox.style.display = "block";
    return;
  }
  errorBox.style.display = "none";

  try {
    await apiFetch("/classes", {
      method: "POST",
      body: JSON.stringify({ name: nombre, subject: descripcion, course: "—", schedule: "" }),
    });
    document.getElementById("f-name").value = "";
    document.getElementById("f-desc").value = "";
    cerrarModal("modal-crear");
    showToast("Clase creada ✓", "success");
    await cargarClases();
  } catch (err) {
    errorBox.textContent = err.message || "Error al crear la clase.";
    errorBox.style.display = "block";
  }
}

/* ── Eliminar clase ──────────────────────────────────── */
async function eliminarClase(id, nombre) {
  if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    await apiFetch(`/classes/${id}/close`, { method: "POST" });
    showToast("Clase eliminada", "success");
    await cargarClases();
  } catch (err) {
    showToast("Error al eliminar: " + err.message, "error");
  }
}

/* ── Iniciar clase ───────────────────────────────────── */
async function iniciarClase(id) {
  try {
    const res = await apiFetch(`/classes/${id}/host`, { method: "POST" });
    sessionStorage.setItem("classId",   res.classId);
    sessionStorage.setItem("classCode", res.code);
    window.location.href = "../clase/index.html";
  } catch (err) {
    showToast("Error al iniciar: " + err.message, "error");
  }
}

/* ── Helpers ─────────────────────────────────────────── */
function abrirModal(id)  { document.getElementById(id).classList.add("open");    }
function cerrarModal(id) { document.getElementById(id).classList.remove("open"); }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}
