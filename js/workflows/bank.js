// ── BANK WORKFLOW ──

function bankWorkflow(t, wf) {
  const step = wf.step || 0;
  const steps = [
    { label: 'Select bank', status: step > 0 ? 'done' : step === 0 ? 'active' : 'pending' },
    { label: 'Verify contact', status: step > 1 ? 'done' : step === 1 ? 'active' : 'pending' },
    { label: 'Account details', status: step > 2 ? 'done' : step === 2 ? 'active' : 'pending' },
    { label: 'Draft letter', status: step > 3 ? 'done' : step === 3 ? 'active' : 'pending' },
    { label: 'Privacy check', status: step > 4 ? 'done' : step === 4 ? 'active' : 'pending' },
    { label: 'Send', status: step > 5 ? 'done' : step === 5 ? 'active' : 'pending' },
  ];

  let body = renderStepTrack(steps);

  const TOP_BANKS = ['JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Citibank', 'U.S. Bank', 'Truist Bank', 'PNC Bank', 'Goldman Sachs', 'Capital One', 'TD Bank', 'Citizens Bank', 'Ally Bank', 'Regions Bank', 'Fifth Third Bank', 'KeyBank', 'Huntington Bank', 'Navy Federal Credit Union', 'Charles Schwab', 'Fidelity', 'Vanguard', 'Merrill Lynch', 'Morgan Stanley', 'Edward Jones', 'Raymond James', 'Other / not listed'];
  const taxAccounts = window._taxAccounts || (window._taxParsed ? 'Tax return uploaded — click "Scan for accounts" below' : null);

  if (step === 0) {
    const bankOptions = TOP_BANKS.map(b => `<option value="${b}"${wf.data.bankName === b ? ' selected' : ''}>${b}</option>`).join('');
    body += `<div class="step-card active-step">
      <div class="step-card-hdr"><div class="step-num">1</div><div class="step-card-title">Select the financial institution</div><span class="step-card-status">In progress</span></div>
      <div class="step-card-body">
        <p class="step-desc">Choose from common banks below, or type the name if it is not listed.</p>
        ${taxAccounts ? `<div style="background:rgba(90,159,212,0.1);border:1px solid rgba(90,159,212,0.25);border-radius:6px;padding:10px 12px;font-size:12px;color:var(--blue);margin-bottom:12px">
          <div style="font-weight:500;margin-bottom:4px">📊 Accounts found in your tax documents</div>
          <div style="color:var(--text2);white-space:pre-wrap">${taxAccounts}</div>
        </div>` : ''}
        <div class="field-row">
          <label class="field-lbl">Institution name <span>*</span></label>
          <select class="field-inp" id="bank-select-${t.id}" onchange="syncBankInput('${t.id}')" style="margin-bottom:6px">
            <option value="">— Select a bank —</option>${bankOptions}
          </select>
          <input class="field-inp" id="bank-name-inp" placeholder="Or type bank name here…" value="${wf.data.bankName || ''}" oninput="syncBankSelect('${t.id}');document.getElementById('bank-name-err-${t.id}').textContent='';this.style.borderColor=''"/>
          <div id="bank-name-err-${t.id}" style="color:var(--red);font-size:11px;min-height:14px;margin-top:3px"></div>
        </div>
        <div class="field-row">
          <label class="field-lbl">Account type</label>
          <select class="field-inp" id="bank-acct-inp">
            <option value="">— Select type (optional) —</option>
            <option${wf.data.acctType === 'Checking' ? ' selected' : ''}>Checking</option>
            <option${wf.data.acctType === 'Savings' ? ' selected' : ''}>Savings</option>
            <option${wf.data.acctType === 'Money market' ? ' selected' : ''}>Money market</option>
            <option${wf.data.acctType === 'Joint checking' ? ' selected' : ''}>Joint checking</option>
            <option${wf.data.acctType === 'Investment / brokerage' ? ' selected' : ''}>Investment / brokerage</option>
            <option${wf.data.acctType === 'IRA' ? ' selected' : ''}>IRA</option>
            <option${wf.data.acctType === '401(k)' ? ' selected' : ''}>401(k)</option>
            <option${wf.data.acctType === 'Multiple accounts' ? ' selected' : ''}>Multiple accounts</option>
          </select>
        </div>
        <div class="step-actions">
          <button class="sa-btn primary" onclick="bankStep1Find('${t.id}')">Find contact information</button>
        </div>
      </div>
    </div>`;
  }

  if (step >= 1) {
    const info = findBankContact(wf.data.bankName || '');
    body += `<div class="step-card ${step === 1 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 1 ? '✓' : '2'}</div><div class="step-card-title">Verify contact information</div><span class="step-card-status">${step > 1 ? 'Done' : 'Confirm'}</span></div>
      <div class="step-card-body">
        <p class="step-desc">Here is what we found. Please confirm this looks correct before we proceed.</p>
        <div class="found-card">
          <div class="found-card-title">Contact found: ${info.name}</div>
          <div class="found-row"><span class="found-icon">🏛</span><div><div class="found-lbl">Department</div><div class="found-val">${info.dept}</div></div></div>
          <div class="found-row"><span class="found-icon">📞</span><div><div class="found-lbl">Phone</div><div class="found-val">${info.phone} <span style="font-size:10px;color:var(--text3)">${info.hours}</span></div></div></div>
          <div class="found-row"><span class="found-icon">✉</span><div><div class="found-lbl">Mailing address</div><div class="found-val" style="white-space:pre-line">${info.address}</div></div></div>
          ${info.form ? `<div class="found-row"><span class="found-icon">📋</span><div><div class="found-lbl">Required form</div><div class="found-val">${info.form}</div></div></div>` : ''}
          <div class="found-row"><span class="found-icon">📋</span><div><div class="found-lbl">Death certificate</div><div class="found-val">${info.certReq}</div></div></div>
          ${info.note ? `<div style="font-size:11px;color:var(--text3);margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">${info.note}</div>` : ''}
        </div>
        ${step === 1 ? `<div class="step-actions"><button class="sa-btn primary" onclick="bankStep2Confirm('${t.id}')">This looks correct — continue</button><button class="sa-btn" onclick="bankStep0Edit('${t.id}')">Edit institution</button></div>` : ''}
      </div>
    </div>`;
  }

  if (step >= 2) {
    const prefillNote = window._taxAccounts ? `<div style="font-size:11px;color:var(--blue);margin-bottom:8px;padding:6px 10px;background:rgba(90,159,212,0.07);border-radius:5px">Fields pre-filled from your tax documents where possible</div>` : '';
    body += `<div class="step-card ${step === 2 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 2 ? '✓' : '3'}</div><div class="step-card-title">Account details</div><span class="step-card-status">${step > 2 ? 'Done' : 'Fill in'}</span></div>
      <div class="step-card-body">
        ${step === 2 ? `${prefillNote}<div class="field-row"><label class="field-lbl">Account number — last 4 digits only</label><input class="field-inp" id="bank-acct-num" placeholder="e.g. 4242" maxlength="4" value="${wf.data.acctNum || ''}"/></div>
        <div class="field-row"><label class="field-lbl">Additional context (optional)</label><input class="field-inp" id="bank-context" placeholder="e.g. joint account with spouse, online-only account" value="${wf.data.context || ''}"/></div>
        <div class="step-actions"><button class="sa-btn primary" onclick="bankStep3Draft('${t.id}')">Draft the notification letter</button></div>`
        : `<div style="font-size:12px;color:var(--text2)">Account details saved.</div>`}
      </div>
    </div>`;
  }

  if (step >= 3) {
    const draft = getDraft(t.id) || wf.draft || '';
    body += `<div class="step-card ${step === 3 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 3 ? '✓' : '4'}</div><div class="step-card-title">Review the draft letter</div><span class="step-card-status">${step > 3 ? 'Done' : 'Review'}</span></div>
      <div class="step-card-body">
        ${wf.draftStreaming ? `<div class="draft-box streaming" id="draft-stream-${t.id}"></div>` : draft ? `<div class="draft-box" id="draft-box-${t.id}">${draft}</div>` : '<div style="font-size:12px;color:var(--text3)">Generating…</div>'}
        ${draft && !wf.draftStreaming ? aiDraftNote() : ''}
        ${step === 3 && draft && !wf.draftStreaming ? `<div class="step-actions">
          <label style="font-size:11px;color:var(--text2);display:flex;gap:6px;align-items:center;width:100%;margin-bottom:4px"><input type="checkbox" id="email-mode-${t.id}" onchange="window._bankEmailMode=this.checked"/> Format copy as email (To / Subject / body)</label>
          <button class="sa-btn primary" onclick="bankStepGtOpen('${t.id}')">This looks good — continue</button>
          <button class="sa-btn" onclick="redraftBank('${t.id}')">Redraft</button>
          <button class="sa-btn" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy letter</button>
          <button class="sa-btn" onclick="downloadDraftTxt('${t.id}')">Download .txt</button>
        </div>` : ''}
      </div>
    </div>`;
  }

  if (step >= 4) {
    const draft = getDraft(t.id) || wf.draft || '';
    const sensIssues = checkSensitivity(draft);
    body += `<div class="step-card ${step === 4 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">${step > 4 ? '✓' : '5'}</div><div class="step-card-title">Privacy check</div><span class="step-card-status">${step > 4 ? 'Done' : sensIssues.length ? 'Review needed' : 'Passed'}</span></div>
      <div class="step-card-body">
        ${sensIssues.length ? `<div class="sens-warn"><strong>Heads up:</strong> ${sensIssues.map(i => `<div style="margin-bottom:3px">${i.sev === 'error' ? '✕' : '⚠'} ${i.msg}</div>`).join('')}</div>` : '<div style="color:var(--green);font-size:13px;margin-bottom:8px">✓ No sensitive information detected in the letter.</div>'}
        ${step === 4 ? `<div class="step-actions"><button class="sa-btn primary" onclick="bankStep5Send('${t.id}')">Confirmed — ready to send</button></div>` : ''}
      </div>
    </div>`;
  }

  if (step >= 5) {
    const info = findBankContact(wf.data.bankName || '');
    body += `<div class="step-card ${step === 5 ? 'active-step' : 'done-step'}">
      <div class="step-card-hdr"><div class="step-num">6</div><div class="step-card-title">Send the letter</div><span class="step-card-status">${taskDone[t.id] ? 'Done' : 'Ready'}</span></div>
      <div class="step-card-body">
        <p class="step-desc">Your letter is ready. Copy it and send from your own email, or print and mail to the address below.</p>
        <div class="email-prompt">
          <div class="email-prompt-title">Send by email</div>
          <div class="email-prompt-hint">Copy the subject line and letter below, then paste into your email app.</div>
          <div class="found-lbl" style="margin-bottom:4px">To:</div>
          <div class="copy-box">${info.dept} — ${info.name}</div>
          <div class="found-lbl" style="margin-bottom:4px">Subject line:</div>
          <div class="copy-box">Estate Notification — ${A.name || '[Deceased Name]'} — Account Holder Deceased</div>
          <div class="step-actions">
            <button class="sa-btn primary" data-copy-tid="${t.id}" onclick="copyDraftFor('${t.id}')">Copy letter text</button>
            <button class="sa-btn" onclick="togDone('${t.id}')">Mark task complete</button>
          </div>
        </div>
        <div class="found-card" style="margin-top:8px">
          <div class="found-card-title">Or mail to:</div>
          <div class="found-row"><span class="found-icon">✉</span><div><div class="found-val" style="white-space:pre-line">${info.address}</div></div></div>
        </div>
      </div>
    </div>`;
  }

  return body;
}

// ── BANK STEP ACTIONS ──
function bankStep0Edit(tid) { setWFStep(tid, 0); }
function bankStep2Confirm(tid) { addTrace(tid, 'verify', 'Details confirmed', 'You confirmed the contact information looks right.'); setWFStep(tid, 2); }

function bankStepGtOpen(tid) {
  const draft = getDraft(tid) || getWF(tid).draft || '';
  const first = (A.name || '').split(/\s+/)[0] || '';
  const nameLikely = !first || !draft || draft.toLowerCase().includes(first.toLowerCase());
  const html = `<div><strong>Deceased (intake):</strong> ${A.name || '—'}</div><div><strong>State:</strong> ${A.state || '—'}</div><div><strong>Your role:</strong> ${A.rel || '—'}</div>${nameLikely ? '' : '<p style="color:var(--amber);margin-top:10px">The draft may not include the deceased name as you entered it. Review the letter text carefully.</p>'}`;
  document.getElementById('gt-body').innerHTML = html;
  document.getElementById('gt-modal').style.display = 'flex';
  window._gtTid = tid;
}
function gtClose() { document.getElementById('gt-modal').style.display = 'none'; window._gtTid = null; }
function gtConfirm() { const tid = window._gtTid; gtClose(); if (tid) bankStep4Review(tid); }

function bankStep4Review(tid) {
  const draft = getWF(tid).draft || '';
  const issues = checkSensitivity(draft);
  const errors = issues.filter(i => i.sev === 'error');
  const warns = issues.filter(i => i.sev === 'warn');
  let verifyText = '';
  if (errors.length) verifyText = 'We found something that needs to be fixed before you send: ' + errors.map(i => i.msg).join('; ');
  else if (warns.length) verifyText = 'Everything looks okay, but please double-check: ' + warns.map(i => i.msg).join('; ');
  else verifyText = 'Your letter looks good. Please read it through one more time before sending.';
  addTrace(tid, errors.length ? 'warn' : 'verify', errors.length ? 'Please fix before sending' : 'Letter ready to review', verifyText);
  setWFStep(tid, 4);
}

function bankStep5Send(tid) {
  traceAndOpenSendModal(tid, () => {
    addTrace(tid, 'step', 'Ready to send', 'You confirmed the letter is accurate. Choose how you would like to send it.');
    setWFStep(tid, 5);
  });
}

function syncBankInput(tid) {
  const sel = document.getElementById('bank-select-' + tid);
  const inp = document.getElementById('bank-name-inp');
  if (sel && inp && sel.value && sel.value !== 'Other / not listed') inp.value = sel.value;
}

function syncBankSelect(tid) {
  const sel = document.getElementById('bank-select-' + tid);
  if (sel) sel.value = '';
}

async function bankStep1Find(tid) {
  let bankName = (document.getElementById('bank-name-inp')?.value || '').trim();
  if (!bankName) { const sel = document.getElementById('bank-select-' + tid); bankName = (sel?.value || '').trim(); }
  if (!bankName) {
    const inp = document.getElementById('bank-name-inp');
    if (inp) inp.style.borderColor = 'var(--red)';
    const err = document.getElementById('bank-name-err-' + tid);
    if (err) err.textContent = 'Please select or enter an institution name.';
    return;
  }
  const inp = document.getElementById('bank-name-inp');
  if (inp) inp.style.borderColor = '';
  const err = document.getElementById('bank-name-err-' + tid);
  if (err) err.textContent = '';
  const acctType = (document.getElementById('bank-acct-inp')?.value || '');
  getWF(tid).data.bankName = bankName;
  getWF(tid).data.acctType = acctType;
  const taskName = (tasks.find(t => String(t.id) === String(tid)) || {}).name || 'Bank notification';
  if (!generalAssistantStart(tid, taskName, 'Search agent → Communication agent → Verify agent')) return;
  addTrace(tid, 'step', 'Looking up contact', 'Finding the right department at ' + bankName + '…');
  await delay(500);
  addTrace(tid, 'action', 'Searching our records', 'Checking our list of bank estate services contacts.');
  await delay(300);
  const info = findBankContact(bankName);
  const webHref = info.web && !info.web.startsWith('Search') ? info.web : null;
  addTrace(tid, 'verify', 'Contact found', info.name + ' — ' + info.dept + ' — ' + info.phone, webHref);
  setWFStep(tid, 1);
}

async function bankStep3Draft(tid) {
  const acctNum = document.getElementById('bank-acct-num')?.value || '';
  const context = document.getElementById('bank-context')?.value || '';
  getWF(tid).data.acctNum = acctNum;
  getWF(tid).data.context = context;
  addTrace(tid, 'step', 'Drafting your letter', 'Preparing the estate notification letter for ' + getWF(tid).data.bankName + '.');
  getWF(tid).draftStreaming = true;
  getWF(tid).draft = '';
  setWFStep(tid, 3);
  await delay(60);
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const taxCtx = window._taxParsed ? `\nFinancial context from uploaded tax documents: ${window._taxParsed}` : '';
  const formCtx = window._taxAccounts ? `\nAccounts identified from tax scan: ${window._taxAccounts}` : '';
  const payload = { bankName: getWF(tid).data.bankName, acctType: getWF(tid).data.acctType || '', acctNum, context, notes: taskNotes[tid] || '', taxContext: taxCtx, formContext: formCtx, information: { deceasedName: A.name || '', executorRelationship: A.rel || '', state: A.state || '' } };
  let txt = '';
  try {
    const r = await fetch(orchestrateBankUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok || !r.body) throw new Error('orchestrate HTTP ' + r.status);
    const reader = r.body.getReader(), dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done: d, value } = await reader.read(); if (d) break;
      buf += dec.decode(value, { stream: true });
      let sep;
      while ((sep = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, sep); buf = buf.slice(sep + 2);
        const line = chunk.split('\n').find(l => l.startsWith('data: ')); if (!line) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'trace') addTrace(tid, ev.traceType, ev.label, ev.text, ev.href || null);
          if (ev.type === 'draft_delta') { txt += ev.text; const el = document.getElementById('draft-stream-' + tid); if (el) el.textContent = txt; }
          if (ev.type === 'done' && ev.fullDraft) txt = ev.fullDraft;
        } catch (_) { }
      }
    }
    getWF(tid).draft = txt; setDraft(tid, txt); getWF(tid).draftStreaming = false;
    if (!txt.trim()) throw new Error('empty draft');
    setWFStep(tid, 3); scheduleSave();
  } catch (e) {
    console.warn('Orchestrator unavailable, using proxy stream', e);
    await bankStep3DraftDirect(tid, acctNum, context, today, taxCtx, formCtx);
  }
}

async function bankStep3DraftDirect(tid, acctNum, context, today, taxCtx, formCtx) {
  const info = findBankContact(getWF(tid).data.bankName);
  try {
    const r = await anthropicFetch({
      model: 'claude-sonnet-4-20250514', max_tokens: 800, stream: true,
      system: COMM_PII_RULE + 'You are a compassionate estate specialist with state-specific estate law knowledge. Draft a professional, warm bank estate notification letter. Reference the executor\'s state laws where relevant (e.g. Letters Testamentary or Certificate of Qualification requirements, state-specific executor authority). Use plain language. Formal but kind. Sign from executor perspective. Do not use em dashes. Do not mention artificial intelligence.',
      messages: [{ role: 'user', content: `Draft a bank estate notification letter.\nBank: ${info.name}\nDepartment: ${info.dept}\nAccount type: ${getWF(tid).data.acctType || 'not specified'}\nAccount last 4 digits: ${acctNum ? 'ending in ' + acctNum : 'not specified'}\nContext: ${context || 'none'}\nDeceased: ${A.name}\nState: ${A.state}\nExecutor: ${A.rel}\nDate: ${today}\nAdditional notes: ${taskNotes[tid] || 'none'}${taxCtx}${formCtx}` }],
    });
    const reader = r.body.getReader(), dec = new TextDecoder(); let txt = '';
    while (true) {
      const { done: d, value } = await reader.read(); if (d) break;
      for (const line of dec.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6); if (raw === '[DONE]') continue;
        try { const j = JSON.parse(raw); if (j.type === 'content_block_delta' && j.delta?.text) { txt += j.delta.text; const el = document.getElementById('draft-stream-' + tid); if (el) el.textContent = txt; } } catch (_) { }
      }
    }
    getWF(tid).draft = txt; setDraft(tid, txt); getWF(tid).draftStreaming = false;
    addTrace(tid, 'step', 'Letter drafted', 'Your letter is ready for review.');
    addTrace(tid, 'verify', 'Please review', 'Take a moment to read through your letter before sending.');
    setWFStep(tid, 3); scheduleSave();
  } catch (err) {
    console.error('bankStep3Draft error:', err);
    getWF(tid).draftStreaming = false;
    getWF(tid).draft = 'Error generating letter. Start the API server (see server/README) or check ANTHROPIC_API_KEY.';
    setWFStep(tid, 3);
  }
}

async function redraftBank(tid) { getWF(tid).draft = ''; setDraft(tid, ''); await bankStep3Draft(tid); }
