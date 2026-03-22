// Legacy no-op — HTML may still call saveApiKey / showApiKeyModal; AI uses the server proxy only.
function showApiKeyModal() {}
function saveApiKey() {}

/** Warm-up /health (helps surface local “forgot to run server” early). */
async function checkApiConnectivity() {
  try {
    const res = await fetch(apiRoot() + '/health', { signal: AbortSignal.timeout(12000) });
    if (res.ok) return;
  } catch (_) {}
  const h = typeof window !== 'undefined' ? window.location.hostname : '';
  const local = h === 'localhost' || h === '127.0.0.1';
  if (local && typeof showToast === 'function') {
    showToast('Start the API server: npm start (from the project folder). AI needs the backend.', 8000);
  }
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
