// ── API KEY MODAL ──
function showApiKeyModal() {
  const m = document.getElementById('api-key-modal');
  if (m) { m.style.display = 'flex'; document.getElementById('api-key-inp').focus(); }
}

function saveApiKey() {
  const inp = document.getElementById('api-key-inp');
  const err = document.getElementById('api-key-err');
  const key = (inp.value || '').trim();
  if (!key.startsWith('sk-ant-')) {
    err.textContent = 'That doesn\'t look like a valid Anthropic key. It should start with sk-ant-.';
    return;
  }
  window.ANTHROPIC_API_KEY = key;
  try { localStorage.setItem('ANTHROPIC_API_KEY', key); } catch (_) {}
  document.getElementById('api-key-modal').style.display = 'none';
  showToast('API key saved. AI features are now active.');
}

// Check whether AI calls will work. Shows the key modal if neither demo mode
// nor a reachable backend is available.
async function checkApiConnectivity() {
  if (isDemoMode()) return; // key already set — we're good
  try {
    const res = await fetch(apiRoot() + '/health', { signal: AbortSignal.timeout(3000) });
    if (res.ok) return; // backend is running — we're good
  } catch (_) {}
  // Backend unreachable and no key set — prompt the user
  showApiKeyModal();
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', function () {
  loadPassageState();

  // Restore date/county inputs from persisted state
  if (A.dateOfDeath) {
    const e = document.getElementById('date-of-death-inp');
    if (e) e.value = A.dateOfDeath;
    trackerState.dateOfDeath = A.dateOfDeath;
  }
  if (A.deathCounty) {
    const e = document.getElementById('death-county-inp');
    if (e) e.value = A.deathCounty;
  }

  // If a session was saved mid-flow, resume at the dashboard
  if (tasks.length && A.name) {
    go('s-dashboard');
    renderDash();
    refreshFiles('cert');
    refreshFiles('bank');
  }

  checkApiConnectivity();
});
