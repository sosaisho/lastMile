// ── API KEY BOOTSTRAP ──
// If the user previously saved their Anthropic key, restore it now so isDemoMode()
// returns true before any other code runs. This covers the case where someone opens
// the app without a backend and has already entered their key once before.
(function bootstrapApiKey() {
  try {
    const saved = localStorage.getItem('ANTHROPIC_API_KEY');
    if (saved && saved.startsWith('sk-ant-') && !window.ANTHROPIC_API_KEY) {
      window.ANTHROPIC_API_KEY = saved;
    }
  } catch (_) {}
})();

// ── STATE ──
// Shared application state — all modules read/write these globals directly.
const A = {};
let qIdx = 0, tasks = [], customTasks = [], selTask = null, draftTxt = '';
const taskDone = {}, taskNotes = {}, wfState = {}, vaultFiles = { cert: [], bank: [], w2: [] };
let emailOk = false, simCode = '';

// API configuration
// Priority: window.PASSAGE_API_BASE > direct browser key > localhost backend
const API_BASE = (typeof window !== 'undefined' && window.PASSAGE_API_BASE)
  ? window.PASSAGE_API_BASE
  : 'http://localhost:8787';

function isDemoMode() {
  return typeof window !== 'undefined' &&
    window.ANTHROPIC_API_KEY &&
    window.ANTHROPIC_API_KEY !== 'sk-ant-YOUR-KEY-HERE' &&
    !window.PASSAGE_API_BASE;
}

function apiRoot() { return (API_BASE || 'http://localhost:8787').replace(/\/$/, ''); }

async function anthropicFetch(bodyObj) {
  const directHeaders = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': window.ANTHROPIC_API_KEY,
    'anthropic-dangerous-direct-browser-iab': 'true',
  };
  const proxyHeaders = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };

  if (isDemoMode()) {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: directHeaders, body: JSON.stringify(bodyObj),
    });
  }

  let res;
  try {
    res = await fetch(apiRoot() + '/v1/messages', {
      method: 'POST', headers: proxyHeaders, body: JSON.stringify(bodyObj),
    });
  } catch (networkErr) {
    // Backend unreachable — fall through to key prompt
    _handleApiKeyError('Could not reach the backend server. Enter your Anthropic API key to continue directly from your browser.');
    throw networkErr;
  }

  // Intercept auth errors so the user gets a clear path to fix the issue.
  if (res.status === 401 || res.status === 403) {
    _handleApiKeyError('The API key on the server is invalid or expired. Enter a working Anthropic API key to continue.');
    throw new Error('authentication_error');
  }

  // Clone the response to peek at non-streaming bodies without consuming the stream.
  if (!bodyObj.stream) {
    const clone = res.clone();
    try {
      const d = await clone.json();
      if (d && d.error && d.error.type === 'authentication_error') {
        _handleApiKeyError('The API key on the server is invalid or expired. Enter a working Anthropic API key to continue.');
        throw new Error('authentication_error');
      }
    } catch (e) { if (e.message === 'authentication_error') throw e; }
  }

  return res;
}

function _handleApiKeyError(msg) {
  const modal = document.getElementById('api-key-modal');
  if (!modal) return;
  const note = modal.querySelector('p');
  if (note) note.textContent = msg;
  modal.style.display = 'flex';
  const inp = document.getElementById('api-key-inp');
  if (inp) inp.focus();
}

function orchestrateBankUrl() { return apiRoot() + '/api/orchestrate/bank-draft'; }

// Tracker state (persisted separately for clarity)
let trackerState = { certOrdered: 0, certOnHand: 0, certMailed: 0, certNote: '', responses: [], dateOfDeath: '' };

// ── PERSISTENCE ──
const PASSAGE_LS_KEY = 'passage_estate_v1';

function savePassageState() {
  try {
    localStorage.setItem(PASSAGE_LS_KEY, JSON.stringify({
      A, tasks, customTasks, taskDone, taskNotes, wfState, vaultFiles,
      trackerState, qIdx, customTasksId: window._customTaskSeq || 0,
    }));
  } catch (e) { console.warn('save state', e); }
}

function loadPassageState() {
  try {
    const raw = localStorage.getItem(PASSAGE_LS_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    Object.assign(A, s.A || {});
    if (s.tasks && s.tasks.length) tasks = s.tasks;
    if (s.customTasks && s.customTasks.length) customTasks = s.customTasks;
    else customTasks = (tasks || []).filter(t => String(t.id).startsWith('custom-'));
    if (s.taskDone) Object.assign(taskDone, s.taskDone);
    if (s.taskNotes) Object.assign(taskNotes, s.taskNotes);
    if (s.wfState) Object.assign(wfState, s.wfState);
    if (s.vaultFiles) Object.assign(vaultFiles, s.vaultFiles);
    if (s.trackerState) Object.assign(trackerState, s.trackerState);
    if (typeof s.qIdx === 'number') qIdx = s.qIdx;
    if (s.customTasksId) window._customTaskSeq = s.customTasksId;
    if (s.trackerState && s.trackerState.dateOfDeath) trackerState.dateOfDeath = s.trackerState.dateOfDeath;
  } catch (e) { console.warn('load state', e); }
}

function scheduleSave() {
  clearTimeout(window._saveT);
  window._saveT = setTimeout(savePassageState, 400);
}
