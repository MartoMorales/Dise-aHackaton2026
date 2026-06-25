// front/alumno/clase/main.js
// Funcionalidades 5, 6, 7 (alumno): join socket, enviar preguntas, ver feed en tiempo real.

let socket = null;
let classId = null;
let classCode = null;
let selectedCat = 'duda';

const RISK_THRESHOLD = 60;

document.addEventListener('DOMContentLoaded', () => {
  if (!requiereAuth('alumno')) return;

  classId   = sessionStorage.getItem('classId');
  classCode = sessionStorage.getItem('classCode');

  if (!classId && !classCode) {
    window.location.href = '../general/index.html';
    return;
  }

  initSocket();
  initUI();
});

/* ── Socket ───────────────────────────────────────────── */
function initSocket() {
  socket = crearSocket();
  if (!socket) { showToast('No se pudo conectar con el servidor', 'error'); return; }

  socket.on('connect', () => {
    document.getElementById('connStatus').className = 'badge badge-green';
    document.getElementById('connStatus').textContent = '🟢 Conectado';
    socket.emit('join_class', {
      code: classCode,
      role: 'alumno',
      sessionId: socket.id,
    });
  });

  socket.on('disconnect', () => {
    document.getElementById('connStatus').className = 'badge badge-red';
    document.getElementById('connStatus').textContent = '🔴 Desconectado';
  });

  socket.on('class_info', (cls) => {
    classId = cls.classId;
    document.getElementById('className').textContent    = cls.name;
    document.getElementById('classSubject').textContent = cls.subject || '';
    document.getElementById('classCourse').textContent  = cls.course  || '—';
    document.getElementById('classSchedule').textContent = cls.schedule || '—';
  });

  socket.on('student_count', ({ count }) => {
    document.getElementById('classCount').textContent = count;
  });

  // Lista actualizada de preguntas (ordenada por prioridad)
  socket.on('questions_update', ({ questions }) => {
    renderFeed(questions);
  });

  // Nueva pregunta llega (añadir al feed)
  socket.on('new_question', ({ question }) => {
    addOrUpdateQuestion(question);
  });

  // Pregunta actualizada (respondida, pospuesta, etc.)
  socket.on('question_status', ({ questionId, status }) => {
    updateQuestionStatus(questionId, status);
  });

  socket.on('kicked', ({ message }) => {
    showToast(message, 'error');
    setTimeout(() => window.location.href = '../general/index.html', 2000);
  });

  socket.on('error', ({ message }) => {
    showToast(message, 'error');
  });
}

/* ── UI ───────────────────────────────────────────────── */
function initUI() {
  // Categorías
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCat = btn.dataset.cat;
    });
  });

  // Contador de caracteres
  const textarea = document.getElementById('questionText');
  textarea.addEventListener('input', () => {
    document.getElementById('charCount').textContent = textarea.value.length;
  });

  // Enviar pregunta
  document.getElementById('btnSend').addEventListener('click', enviarPregunta);
  textarea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') enviarPregunta();
  });

  // Inbox fuera de clase
  document.getElementById('btnInbox').addEventListener('click', enviarInbox);
}

async function enviarPregunta() {
  const text = document.getElementById('questionText').value.trim();
  if (!text) { showToast('Escribí algo primero', 'error'); return; }

  const anon = document.getElementById('anonCheck').checked;
  const usuario = obtenerUsuario();

  if (!socket || !socket.connected) {
    showToast('Sin conexión con el servidor', 'error'); return;
  }

  socket.emit('send_question', {
    classId,
    text,
    category: selectedCat,
    anonymous: anon,
    authorName: anon ? null : (usuario?.nombre || usuario?.email),
  });

  document.getElementById('questionText').value = '';
  document.getElementById('charCount').textContent = '0';
  showToast('Pregunta enviada ✓', 'success');
}

async function enviarInbox() {
  const text = document.getElementById('inboxText').value.trim();
  if (!text) { showToast('Escribí tu pregunta primero', 'error'); return; }
  try {
    await apiFetch('/questions', {
      method: 'POST',
      body: JSON.stringify({ classId, text, category: 'duda_puntual', status: 'inbox', anonymous: true }),
    });
    document.getElementById('inboxText').value = '';
    showToast('Guardada para la próxima clase ✓', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Feed ─────────────────────────────────────────────── */
const questionsMap = new Map();

function renderFeed(questions) {
  questionsMap.clear();
  questions.forEach(q => questionsMap.set(q._id, q));
  redrawFeed();
}

function addOrUpdateQuestion(q) {
  questionsMap.set(q._id, q);
  redrawFeed();
}

function updateQuestionStatus(questionId, status) {
  const q = questionsMap.get(questionId);
  if (q) { q.status = status; redrawFeed(); }
}

function redrawFeed() {
  const feed = document.getElementById('questionFeed');
  const count = document.getElementById('feedCount');

  const list = [...questionsMap.values()].filter(q => q.status !== 'inbox');
  count.textContent = list.length;

  if (!list.length) {
    feed.innerHTML = `<div class="empty-feed"><span class="icon">🤫</span>Todavía no hay preguntas. ¡Sé el primero!</div>`;
    return;
  }

  // Actualizar barra de riesgo (basada en la pregunta de mayor prioridad)
  const maxPriority = Math.max(...list.map(q => q.priority || 0));
  const riskPct = Math.min(100, maxPriority * 20);
  document.getElementById('riskBar').style.width = riskPct + '%';
  document.getElementById('riskBanner').classList.toggle('show', riskPct >= RISK_THRESHOLD);

  feed.innerHTML = list.map(q => questionHTML(q)).join('');
}

const CAT_BORDER = {
  desarrollo:  'var(--cat-desarrollo)',
  duda:        'var(--cat-duda)',
  curiosidad:  'var(--cat-curiosidad)',
  repetir:     'var(--cat-repetir)',
  significado: 'var(--cat-significado)',
};

function questionHTML(q) {
  const color = CAT_BORDER[q.category] || 'var(--cat-duda)';
  const done = q.status === 'respondida';
  return `
    <div class="question-item" style="border-left-color:${color}">
      <div class="qi-top">
        <span class="qi-author">${q.anonymous || !q.authorName ? '🎭 Anónimo' : `👤 ${q.authorName}`}</span>
        ${catTag(q.category)}
        ${(q.priority > 1) ? `<span class="priority-badge">🔥 ×${q.priority}</span>` : ''}
        <span class="qi-time">${formatearHora(q.createdAt)}</span>
      </div>
      <p class="qi-text">${escapeHTML(q.text)}</p>
      <span class="qi-status ${done ? 'respondida' : 'pendiente'}">
        ${done ? '✅ Respondida' : '⏳ Pendiente'}
      </span>
    </div>`;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
