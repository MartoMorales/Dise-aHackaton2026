// front/profesor/clase/main.js
// Funcionalidades 6, 9, 10, 12, 13 (profesor): socket tiempo real,
// gestión de preguntas, moderación.

let socket = null;
let classId = null;
let classCode = null;
let currentTab = 'pendientes';
const questionsMap = new Map();

const CAT_BORDER = {
  desarrollo:  'var(--cat-desarrollo)',
  duda:        'var(--cat-duda)',
  curiosidad:  'var(--cat-curiosidad)',
  repetir:     'var(--cat-repetir)',
  significado: 'var(--cat-significado)',
};

document.addEventListener('DOMContentLoaded', () => {
  if (!requiereAuth('profesor')) return;

  classId   = sessionStorage.getItem('classId');
  classCode = sessionStorage.getItem('classCode');

  if (!classId) { window.location.href = '../general/index.html'; return; }

  document.getElementById('sCode').textContent = classCode || '——';

  initSocket();

  document.getElementById('btnClose').addEventListener('click', cerrarClase);
});

/* ── Socket ───────────────────────────────────────────── */
function initSocket() {
  socket = crearSocket();
  if (!socket) return;

  socket.on('connect', () => {
    document.getElementById('connBadge').className = 'badge badge-green';
    document.getElementById('connBadge').textContent = '🟢 En vivo';
    socket.emit('join_class', { code: classCode, role: 'profesor', sessionId: socket.id });
  });

  socket.on('disconnect', () => {
    document.getElementById('connBadge').className = 'badge badge-red';
    document.getElementById('connBadge').textContent = '🔴 Desconectado';
  });

  socket.on('class_info', (cls) => {
    document.getElementById('sClassName').textContent    = cls.name;
    document.getElementById('sClassSubject').textContent = cls.subject || '';
    document.getElementById('sCode').textContent         = cls.code   || classCode;
    document.getElementById('sCourseMeta').textContent   = cls.course   || '—';
    document.getElementById('sScheduleMeta').textContent = cls.schedule || '—';
    // cargar preguntas históricas
    cargarPreguntas();
  });

  socket.on('student_count', ({ count }) => {
    document.getElementById('sAlumnos').textContent = count;
  });

  socket.on('questions_update', ({ questions }) => {
    questionsMap.clear();
    questions.forEach(q => questionsMap.set(q._id, q));
    redraw();
  });

  socket.on('new_question', ({ question }) => {
    questionsMap.set(question._id, question);
    redraw();
    if (question.status !== 'inbox') showToast('Nueva pregunta ↑', 'default');
  });

  socket.on('question_status', ({ questionId, status }) => {
    const q = questionsMap.get(questionId);
    if (q) { q.status = status; redraw(); }
  });

  socket.on('error', ({ message }) => showToast(message, 'error'));
}

/* ── Cargar preguntas via REST ─────────────────────────── */
async function cargarPreguntas() {
  try {
    const res = await apiFetch(`/preguntas/${classId}`);
    const list = res.questions || res.preguntas || [];
    list.forEach(q => questionsMap.set(q._id, q));
    redraw();
  } catch (err) {
    // Si falla, confiar solo en socket
  }
}

/* ── Render ───────────────────────────────────────────── */
function redraw() {
  const all         = [...questionsMap.values()];
  const pendientes  = all.filter(q => q.status === 'pendiente' || q.status === 'pospuesta');
  const respondidas = all.filter(q => q.status === 'respondida');
  const inbox       = all.filter(q => q.status === 'inbox');

  // Counters
  document.getElementById('sPendientes').textContent  = pendientes.length;
  document.getElementById('sRespondidas').textContent = respondidas.length;
  document.getElementById('sTotales').textContent     = all.filter(q => q.status !== 'inbox').length;
  document.getElementById('cntPendientes').textContent  = pendientes.length;
  document.getElementById('cntRespondidas').textContent = respondidas.length;
  document.getElementById('cntInbox').textContent       = inbox.length;
  document.getElementById('tabCntP').textContent = pendientes.length;
  document.getElementById('tabCntR').textContent = respondidas.length;
  document.getElementById('tabCntI').textContent = inbox.length;

  // Paneles
  renderPanel('pendientes', pendientes.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
  renderPanel('respondidas', respondidas);
  renderInbox(inbox);
}

function renderPanel(tipo, list) {
  const panel = document.getElementById(`panel-${tipo}`);
  if (!list.length) {
    const msgs = {
      pendientes:  { icon: '🎉', text: 'No hay preguntas pendientes todavía.' },
      respondidas: { icon: '📭', text: 'Todavía no respondiste ninguna pregunta.' },
    };
    const m = msgs[tipo] || { icon: '📭', text: '' };
    panel.innerHTML = `<div class="q-empty"><span class="icon">${m.icon}</span>${m.text}</div>`;
    return;
  }
  panel.innerHTML = list.map(q => questionCard(q, tipo)).join('');
}

function renderInbox(list) {
  const panel = document.getElementById('panel-inbox');
  if (!list.length) {
    panel.innerHTML = `<div class="q-empty"><span class="icon">📬</span>No hay preguntas fuera de clase.</div>`;
    return;
  }
  panel.innerHTML = list.map(q => `
    <div class="inbox-q cat-${q.category || 'duda'}">
      <div class="q-card-top">
        <span class="q-author">${q.anonymous ? '🎭 Anónimo' : `👤 ${q.authorName || 'Alumno'}`}</span>
        ${catTag(q.category)}
        <span class="q-time">${formatearFecha(q.createdAt)}</span>
      </div>
      <p class="q-text">${escapeHTML(q.text)}</p>
      <p class="q-meta">Llegó antes de clase</p>
    </div>`).join('');
}

function questionCard(q, tipo) {
  const color = CAT_BORDER[q.category] || 'var(--cat-duda)';
  const prioridad = q.priority || 1;
  const acciones = tipo === 'pendientes' ? `
    <button class="q-btn tick"     onclick="accion('${q._id}','respondida')">✅ Responder</button>
    <button class="q-btn postpone" onclick="accion('${q._id}','pospuesta')">⏭ Posponer</button>
    <button class="q-btn cross"    onclick="accion('${q._id}','eliminada')">🗑 Eliminar</button>
    <button class="q-btn kick"     onclick="expulsar('${q._id}','${q.socketId || ''}')">🚫 Expulsar</button>
  ` : '';
  return `
    <div class="q-card ${tipo !== 'pendientes' ? tipo : ''}" style="border-left-color:${color}">
      <div class="q-card-top">
        <span class="q-author">${q.anonymous ? '🎭 Anónimo' : `👤 ${q.authorName || 'Alumno'}`}</span>
        ${catTag(q.category)}
        ${prioridad > 1 ? `<span class="priority-flame">🔥 ×${prioridad}</span>` : ''}
        <span class="q-time">${formatearHora(q.createdAt)}</span>
      </div>
      <p class="q-text">${escapeHTML(q.text)}</p>
      <div class="q-actions">${acciones}</div>
    </div>`;
}

/* ── Acciones sobre preguntas ──────────────────────────── */
async function accion(questionId, status) {
  try {
    await apiFetch(`/preguntas/${questionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const q = questionsMap.get(questionId);
    if (q) { q.status = status; redraw(); }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function expulsar(questionId, socketId) {
  if (!confirm('¿Expulsar al autor de esta pregunta?')) return;
  try {
    await apiFetch(`/moderacion/kick`, {
      method: 'POST',
      body: JSON.stringify({ classId, socketId, questionId }),
    });
    showToast('Usuario expulsado', 'success');
    // También eliminar la pregunta
    await accion(questionId, 'eliminada');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Cerrar clase ──────────────────────────────────────── */
async function cerrarClase() {
  if (!confirm('¿Cerrar la clase? Los alumnos serán desconectados.')) return;
  try {
    await apiFetch(`/clases/${classId}/close`, { method: 'POST' });
    showToast('Clase cerrada', 'success');
    setTimeout(() => window.location.href = '../general/index.html', 1200);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Tabs ──────────────────────────────────────────────── */
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn, .sidebar-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.questions-panel, .inbox-panel').forEach(p => {
    p.classList.add('hidden');
  });
  const target = document.getElementById(`panel-${tab}`);
  if (target) target.classList.remove('hidden');
}

/* ── Helpers ───────────────────────────────────────────── */
function copiarCodigo() {
  const code = document.getElementById('sCode').textContent;
  navigator.clipboard.writeText(code).then(() => showToast('Código copiado ✓', 'success'));
}

function escapeHTML(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
