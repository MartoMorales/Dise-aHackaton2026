// front/alumno/general/main.js
// Funcionalidades 3 y 5 (lado alumno): carga clases y permite unirse por código.

document.addEventListener('DOMContentLoaded', () => {
  if (!requiereAuth('alumno')) return;

  const usuario = obtenerUsuario();
  document.getElementById('userName').textContent = usuario.nombre || usuario.email;
  document.getElementById('userAvatar').textContent = (usuario.nombre || 'A')[0].toUpperCase();

  cargarClases();

  document.getElementById('btnJoin').addEventListener('click', buscarClasePorCodigo);
  document.getElementById('joinCodeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') buscarClasePorCodigo();
  });
});

/* ── Cargar mis clases ─────────────────────────────────── */
const COLORES = ['accent-0','accent-1','accent-2','accent-3','accent-4','accent-5'];

async function cargarClases() {
  try {
    const [activas, todas] = await Promise.all([
      apiFetch('/classes/active'),
      apiFetch('/classes'),
    ]);
    renderGrid('activeGrid', activas.clases || [], 'activa');
    renderGrid('allGrid',    todas.clases    || [], 'todas');
  } catch (err) {
    renderGrid('activeGrid', [], 'activa');
    renderGrid('allGrid', [], 'todas');
  }
}

function renderGrid(gridId, clases, tipo) {
  const grid = document.getElementById(gridId);
  if (!clases.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">${tipo === 'activa' ? '🔍' : '📭'}</div>
        <h3>${tipo === 'activa' ? 'No hay clases activas ahora' : 'Todavía no tenés clases'}</h3>
        <p>${tipo === 'activa' ? 'Cuando tu profe inicie una clase, aparecerá aquí.' : 'Usá el código que te dio el profe para unirte.'}</p>
      </div>`;
    return;
  }
  grid.innerHTML = clases.map((cls, i) => `
    <div class="class-card ${COLORES[i % COLORES.length]}"
         onclick="irAClase('${cls._id}', '${cls.code || ''}')">
      <div class="class-card-top">
        <div class="class-card-icon">📚</div>
        <div class="class-card-status">
          <div class="status-dot ${cls.status === 'activa' ? 'activa' : 'inactiva'}"></div>
          ${cls.status === 'activa' ? 'En curso' : 'Inactiva'}
        </div>
      </div>
      <h3>${cls.name}</h3>
      <p class="class-subject">${cls.subject || ''}</p>
      <div class="class-meta">
        <div class="class-meta-row"><span class="icon">👤</span>${cls.profesorNombre || 'Profesor'}</div>
        <div class="class-meta-row"><span class="icon">🏫</span>${cls.course || '—'}</div>
        ${cls.schedule ? `<div class="class-meta-row"><span class="icon">🕐</span>${cls.schedule}</div>` : ''}
      </div>
    </div>`).join('');
}

/* ── Unirse por código ──────────────────────────────────── */
let classIdPendiente = null;
let codePendiente = null;

async function buscarClasePorCodigo() {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();
  if (!code) { showToast('Ingresá un código', 'error'); return; }
  const btn = document.getElementById('btnJoin');
  btn.disabled = true; btn.textContent = 'Buscando…';

  try {
    const res = await apiFetch('/classes/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    const cls = res.clase;
    classIdPendiente = cls._id;
    codePendiente = code;
    document.getElementById('mji-subject').textContent = cls.subject || cls.name;
    document.getElementById('mji-course').textContent  = cls.course  || '—';
    document.getElementById('mji-code').textContent    = code;
    abrirModal('modal-join');
    document.getElementById('btnConfirmJoin').onclick = () => irAClase(classIdPendiente, codePendiente);
  } catch (err) {
    showToast(err.message || 'Código inválido o clase no activa', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Unirse';
  }
}

function irAClase(classId, code) {
  sessionStorage.setItem('classId', classId);
  sessionStorage.setItem('classCode', code);
  window.location.href = '../clase/index.html';
}

/* ── Helpers modal ─────────────────────────────────────── */
function abrirModal(id)  { document.getElementById(id).classList.add('open');    }
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
