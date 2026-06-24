// front/profesor/general/main.js
// Funcionalidades 3, 4 (profesor): CRUD de clases, iniciar/hostear clase.

const COLORES = ['accent-0','accent-1','accent-2','accent-3','accent-4','accent-5'];

document.addEventListener('DOMContentLoaded', () => {
  if (!requiereAuth('profesor')) return;

  const u = obtenerUsuario();
  document.getElementById('userName').textContent = u.nombre || u.email;
  document.getElementById('userAvatar').textContent = (u.nombre || 'P')[0].toUpperCase();

  cargarClases();

  document.getElementById('btnCrear').addEventListener('click', () => abrirModal('modal-crear'));
  document.getElementById('btnCrearConfirm').addEventListener('click', crearClase);
});

/* ── Cargar clases ─────────────────────────────────────── */
async function cargarClases() {
  try {
    const res = await apiFetch('/clases');
    const clases = res.clases || [];
    const activas  = clases.filter(c => c.status === 'activa');
    const todas    = clases;

    document.getElementById('statTotal').textContent   = clases.length;
    document.getElementById('statActivas').textContent  = activas.length;
    document.getElementById('statAlumnos').textContent  = clases.reduce((s,c) => s + (c.maxStudents || 0), 0);

    renderGrid('activeGrid', activas, true);
    renderGrid('allGrid',    todas,   true);
  } catch (err) {
    renderGrid('activeGrid', [], true);
    renderGrid('allGrid', [], true);
    showToast(err.message, 'error');
  }
}

function renderGrid(gridId, clases, esProfesor) {
  const grid = document.getElementById(gridId);
  if (!clases.length) {
    const esActiva = gridId === 'activeGrid';
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">${esActiva ? '✨' : '📭'}</div>
      <h3>${esActiva ? 'Ninguna clase activa' : 'No tenés clases todavía'}</h3>
      <p>${esActiva ? 'Iniciá una clase para que los alumnos puedan conectarse.' : 'Creá tu primera clase con el botón de arriba.'}</p>
      ${!esActiva ? '<button class="btn btn-primary" onclick="abrirModal(\'modal-crear\')">+ Nueva clase</button>' : ''}
    </div>`;
    return;
  }
  grid.innerHTML = clases.map((cls, i) => cardHTML(cls, i)).join('');
}

function cardHTML(cls, i) {
  const activa = cls.status === 'activa';
  return `
    <div class="class-card ${COLORES[i % COLORES.length]}">
      <div class="class-card-header">
        <div class="class-card-icon">📚</div>
        <span class="status-pill ${activa ? 'activa' : 'inactiva'}">
          <div class="status-dot"></div>
          ${activa ? 'En curso' : 'Inactiva'}
        </span>
      </div>
      <h3>${cls.name}</h3>
      <p class="class-subject">${cls.subject || ''}</p>
      <div class="class-meta">
        <div class="class-meta-row">🏫 ${cls.course || '—'}</div>
        ${cls.schedule ? `<div class="class-meta-row">🕐 ${cls.schedule}</div>` : ''}
        <div class="class-meta-row">👥 Máx. ${cls.maxStudents || '—'} alumnos</div>
      </div>
      <div class="class-footer">
        ${activa
          ? `<button class="btn btn-primary btn-sm" style="flex:2" onclick="irAClase('${cls._id}','${cls.code}')">Ver clase →</button>
             <button class="btn btn-danger btn-sm" onclick="cerrarClase('${cls._id}')">Cerrar</button>`
          : `<button class="btn btn-secondary btn-sm" style="flex:2" onclick="iniciarClase('${cls._id}')">▶ Iniciar clase</button>`
        }
      </div>
    </div>`;
}

/* ── Crear clase ───────────────────────────────────────── */
async function crearClase() {
  const nombre   = document.getElementById('f-name').value.trim();
  const materia  = document.getElementById('f-subject').value.trim();
  const curso    = document.getElementById('f-course').value.trim();
  const aula     = document.getElementById('f-room').value.trim();
  const maxSt    = parseInt(document.getElementById('f-max').value) || 40;
  const horario  = document.getElementById('f-schedule').value.trim();

  const errEl = document.getElementById('crear-error');
  if (!nombre || !materia || !curso) {
    errEl.textContent = 'Completá nombre, materia y curso.';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  const btn = document.getElementById('btnCrearConfirm');
  btn.disabled = true; btn.textContent = 'Creando…';

  try {
    await apiFetch('/clases', {
      method: 'POST',
      body: JSON.stringify({ name: nombre, subject: materia, course: curso, room: aula, maxStudents: maxSt, schedule: horario }),
    });
    cerrarModal('modal-crear');
    showToast('Clase creada ✓', 'success');
    cargarClases();
  } catch (err) {
    errEl.textContent = err.message; errEl.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'Crear clase';
  }
}

/* ── Iniciar / hostear ─────────────────────────────────── */
async function iniciarClase(classId) {
  try {
    const res = await apiFetch(`/clases/${classId}/host`, { method: 'POST' });
    document.getElementById('codigoDisplay').textContent = res.code || res.clase?.code;
    document.getElementById('btnIrAClase').onclick = () => irAClase(classId, res.code || res.clase?.code);
    abrirModal('modal-codigo');
    cargarClases();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function cerrarClase(classId) {
  if (!confirm('¿Cerrar esta clase? Los alumnos serán desconectados.')) return;
  try {
    await apiFetch(`/clases/${classId}/close`, { method: 'POST' });
    showToast('Clase cerrada', 'success');
    cargarClases();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function irAClase(classId, code) {
  sessionStorage.setItem('classId', classId);
  sessionStorage.setItem('classCode', code || '');
  window.location.href = '../clase/index.html';
}

/* ── Helpers modal ─────────────────────────────────────── */
function abrirModal(id)  { document.getElementById(id).classList.add('open');    }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
