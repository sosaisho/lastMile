// ── STATE ──
// Shared application state — all modules read/write these globals directly.
const A = {};
let qIdx = 0, tasks = [], customTasks = [], selTask = null, draftTxt = '';
const taskDone = {}, taskNotes = {}, wfState = {}, vaultFiles = { cert: [], bank: [], w2: [], other: [] };
let emailOk = false, simCode = '';

// API: all Anthropic traffic goes through the backend proxy (/v1/messages). On Vercel, same-origin
// uses the serverless app + ANTHROPIC_API_KEY from project env. No browser API keys.

function isLocalDev() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function apiRoot() {
  if (typeof window !== 'undefined' && window.PASSAGE_API_BASE) {
    return String(window.PASSAGE_API_BASE).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h && h !== 'localhost' && h !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  return 'http://localhost:8787';
}

async function anthropicFetch(bodyObj) {
  const proxyHeaders = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };

  let res;
  try {
    res = await fetch(apiRoot() + '/v1/messages', {
      method: 'POST',
      headers: proxyHeaders,
      body: JSON.stringify(bodyObj),
    });
  } catch (networkErr) {
    if (isLocalDev()) {
      _notifyHostedApiError('Cannot reach the API server. From the project folder run: npm start (see README).');
    } else {
      _notifyHostedApiError('Could not reach the server. Please try again in a moment.');
    }
    throw networkErr;
  }

  if (res.status === 401 || res.status === 403) {
    _notifyHostedApiError(
      isLocalDev()
        ? 'Anthropic rejected the request. Check ANTHROPIC_API_KEY in server/.env.'
        : 'AI features are temporarily unavailable. Please try again later.',
    );
    throw new Error('authentication_error');
  }

  if (res.status === 503) {
    _notifyHostedApiError(
      isLocalDev()
        ? 'Server has no API key. Set ANTHROPIC_API_KEY in server/.env and restart npm start.'
        : 'AI features are temporarily unavailable. Please try again later.',
    );
    throw new Error('service_unavailable');
  }

  if (!bodyObj.stream) {
    const clone = res.clone();
    try {
      const d = await clone.json();
      if (d && d.error && d.error.type === 'authentication_error') {
        _notifyHostedApiError(
          isLocalDev()
            ? 'Invalid Anthropic API key. Update ANTHROPIC_API_KEY in server/.env.'
            : 'AI features are temporarily unavailable. Please try again later.',
        );
        throw new Error('authentication_error');
      }
    } catch (e) {
      if (e.message === 'authentication_error') throw e;
    }
  }

  return res;
}

function _notifyHostedApiError(msg) {
  if (typeof showToast === 'function') showToast(msg, 6000);
  else if (typeof window !== 'undefined' && window.alert) window.alert(msg);
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
