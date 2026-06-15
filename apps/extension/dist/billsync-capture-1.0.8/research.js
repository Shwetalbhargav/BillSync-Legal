(function installResearchCapture() {
  if (window.__legalBillablesResearchCaptureInstalled) return;
  window.__legalBillablesResearchCaptureInstalled = true;

  const POPUP_ID = 'lb-research-popup';

  function getSelectedText() {
    return String(window.getSelection?.() || '').trim();
  }

  function hashString(value) {
    let hash = 2166136261;
    const input = String(value || '');
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  function getDomain(url = window.location.href) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  function backendRequest(path, { method = 'GET', body, queueOnFailure = false, idempotencyKey } = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'LB_BACKEND_REQUEST', request: { path, method, body, queueOnFailure, idempotencyKey } },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          if (!response?.ok) {
            reject(new Error(response?.error || `HTTP ${response?.status || 0}`));
            return;
          }
          resolve(response.data);
        }
      );
    });
  }

  async function getFeatureFlags() {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'LB_FEATURE_FLAGS' }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result);
      });
    });
    return response?.data || { researchCapture: true, autoConvert: true };
  }

  function unwrapList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  function idOf(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || value.id || '';
  }

  function labelOf(row, fallback) {
    if (!row) return fallback;
    if (typeof row === 'string') return row;
    return row.displayName || row.name || row.title || row.email || idOf(row) || fallback;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function optionHtml(row, fallback) {
    const id = idOf(row);
    if (!id) return '';
    return `<option value="${escapeHtml(id)}">${escapeHtml(labelOf(row, fallback))}</option>`;
  }

  async function loadMappingOptions() {
    const [clientPayload, casePayload] = await Promise.all([
      backendRequest('/api/clients'),
      backendRequest('/api/cases'),
    ]);
    return {
      clients: unwrapList(clientPayload),
      cases: unwrapList(casePayload),
    };
  }

  function renderCaseOptions(cases, clientId) {
    return cases
      .filter((row) => !clientId || idOf(row.clientId || row.client) === clientId)
      .map((row) => optionHtml(row, 'Matter'))
      .join('');
  }

  async function showResearchPopup() {
    const flags = await getFeatureFlags();
    if (!flags.researchCapture) return;
    document.querySelector(`#${POPUP_ID}`)?.remove();

    const selectedText = getSelectedText();
    const popup = document.createElement('div');
    popup.id = POPUP_ID;
    Object.assign(popup.style, {
      position: 'fixed',
      top: '80px',
      right: '32px',
      width: '380px',
      maxWidth: 'calc(100vw - 32px)',
      background: '#fff',
      border: '1px solid #d7d7d7',
      borderRadius: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      zIndex: '2147483647',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      color: '#172033',
      overflow: 'hidden',
    });

    popup.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #edf0f5;background:#f7f9fc;">
        <strong style="font-size:14px;">Capture Research</strong>
        <button id="lb-research-close" style="border:0;background:transparent;font-size:18px;line-height:1;cursor:pointer;">x</button>
      </div>
      <div style="padding:14px;">
        <div style="font-size:12px;color:#5d6780;margin-bottom:10px;">${escapeHtml(getDomain())}</div>
        <label style="display:block;font-size:12px;margin-bottom:4px;">Title</label>
        <input id="lb-research-title" style="width:100%;padding:8px;border:1px solid #d9dfeb;border-radius:6px;margin-bottom:10px;" value="${escapeHtml(document.title || 'Research capture')}" />
        <label style="display:block;font-size:12px;margin-bottom:4px;">Time minutes</label>
        <input id="lb-research-minutes" type="number" min="0.1" step="0.1" style="width:100%;padding:8px;border:1px solid #d9dfeb;border-radius:6px;margin-bottom:10px;" value="6" />
        <label style="display:block;font-size:12px;margin-bottom:4px;">Client</label>
        <select id="lb-research-client" style="width:100%;padding:8px;border:1px solid #d9dfeb;border-radius:6px;margin-bottom:10px;">
          <option value="">Loading clients...</option>
        </select>
        <label style="display:block;font-size:12px;margin-bottom:4px;">Matter</label>
        <select id="lb-research-case" style="width:100%;padding:8px;border:1px solid #d9dfeb;border-radius:6px;margin-bottom:10px;">
          <option value="">Loading matters...</option>
        </select>
        <label style="display:block;font-size:12px;margin-bottom:4px;">Selected text / note</label>
        <textarea id="lb-research-body" style="width:100%;min-height:86px;resize:vertical;padding:8px;border:1px solid #d9dfeb;border-radius:6px;margin-bottom:10px;">${escapeHtml(selectedText)}</textarea>
        <div style="display:flex;gap:8px;align-items:center;justify-content:flex-end;">
          <span id="lb-research-status" style="font-size:12px;color:#5d6780;margin-right:auto;"></span>
          <button id="lb-research-save" style="background:#1677ff;color:#fff;border:0;padding:8px 12px;border-radius:6px;cursor:pointer;">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);
    const status = popup.querySelector('#lb-research-status');
    const clientSelect = popup.querySelector('#lb-research-client');
    const caseSelect = popup.querySelector('#lb-research-case');
    let cases = [];

    popup.querySelector('#lb-research-close').onclick = () => popup.remove();

    try {
      const options = await loadMappingOptions();
      cases = options.cases;
      clientSelect.innerHTML = `<option value="">Select client</option>${options.clients.map((row) => optionHtml(row, 'Client')).join('')}`;
      caseSelect.innerHTML = `<option value="">Select matter</option>${renderCaseOptions(cases, '')}`;
      status.textContent = '';
    } catch (err) {
      clientSelect.innerHTML = '<option value="">Could not load clients</option>';
      caseSelect.innerHTML = '<option value="">Could not load matters</option>';
      status.textContent = err.message || 'Mapping options unavailable.';
    }

    clientSelect.onchange = () => {
      caseSelect.innerHTML = `<option value="">Select matter</option>${renderCaseOptions(cases, clientSelect.value)}`;
    };
    caseSelect.onchange = () => {
      const selectedCase = cases.find((row) => idOf(row) === caseSelect.value);
      const clientId = idOf(selectedCase?.clientId || selectedCase?.client);
      if (clientId) clientSelect.value = clientId;
    };

    popup.querySelector('#lb-research-save').onclick = async () => {
      const title = popup.querySelector('#lb-research-title').value.trim() || 'Research capture';
      const minutes = Number(popup.querySelector('#lb-research-minutes').value);
      const body = popup.querySelector('#lb-research-body').value.trim();
      const clientId = clientSelect.value;
      const caseId = caseSelect.value;
      if (!Number.isFinite(minutes) || minutes <= 0) {
        status.textContent = 'Enter time spent.';
        return;
      }
      if (!clientId || !caseId) {
        status.textContent = 'Select client and matter.';
        return;
      }

      const url = window.location.href;
      const domain = getDomain(url);
      const sourceRef = `research:${domain}:${hashString(`${url}|${title}|${body.slice(0, 500)}`)}`;
      status.textContent = 'Saving...';
      try {
      const payload = {
          source: 'research',
          sourceRef,
          subject: title,
          recipient: domain,
          body,
          typingTimeMinutes: minutes,
          clientId,
          caseId,
          url,
          domain,
          autoConvert: flags.autoConvert !== false,
          meta: {
            selectedTextLength: body.length,
            capturedFrom: 'chrome_extension',
            extensionVersion: chrome.runtime?.getManifest?.().version || '',
            schemaVersion: 1,
          },
        };
        const response = await backendRequest('/api/email-entries', {
          method: 'POST',
          body: payload,
          queueOnFailure: true,
          idempotencyKey: sourceRef,
        });
        if (response?.queued) {
          status.textContent = 'Queued locally. BillSync will retry automatically.';
          return;
        }
        const entry = response?.data || response?.entry || response;
        status.textContent = entry?.status === 'converted' ? 'Captured and converted.' : 'Captured.';
        setTimeout(() => popup.remove(), 1200);
      } catch (err) {
        status.textContent = `Error: ${err.message}`;
      }
    };
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'LB_SHOW_RESEARCH_CAPTURE') {
      showResearchPopup();
    }
  });
})();
