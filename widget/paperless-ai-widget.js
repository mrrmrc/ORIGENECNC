(function () {
  const REGOLO_API_KEY  = '';
  const REGOLO_BASE_URL = '/api/regolo';
  const REGOLO_MODEL    = 'Llama-3.3-70B-Instruct';
  const MAG_PROXY       = 'https://api.magisterium.com/v1/chat/completions';
  const MAG_KEY         = '';
  const MAG_MODEL       = 'magisterium-1';
  const BASE = window.location.origin;

  let aiMode = false;
  let overlayEl = null;
  // window.useOrigene
  // window.useMag

  const style = document.createElement('style');
  style.textContent = `
    .search-container, pngx-global-search { display: none !important; }
    .app-update-available { display: none !important; }
    .version-check { display: none !important; }
    [name="question-circle"] { display: none !important; }
    a[href*="docs.paperless-ngx.com"] { display: none !important; }
    body.pngx-overlay-open > *:not(#pngx-overlay) { display: none !important; }
    body.pngx-overlay-open { overflow: hidden; }
    body.pngx-ai-active app-root { display: none !important; }

    #pngx-toggle {
      position: fixed; top: 10px; left: 228px; z-index: 99999;
      width: 36px; height: 36px; border-radius: 8px;
      background: transparent; border: 1px solid #ffffff25;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all .2s; color: #ffffffaa;
    }
    #pngx-toggle:hover { background: #ffffff15; color: #fff; }
    #pngx-toggle.active { background: #1a73e8; border-color: #1a73e8; color: #fff; box-shadow: 0 0 14px rgba(26,115,232,.5); }
    #pngx-toggle svg { width: 17px; height: 17px; fill: currentColor; pointer-events: none; }

    #pngx-overlay {
      width: 100%; background: #fff; padding: 20px 24px;
      margin: 20px 0;
      border: 1px solid #e8eaed; border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: pngxfade .2s ease;
    }
    @keyframes pngxfade { from{opacity:0} to{opacity:1} }

    #pngx-topbar {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 0; margin-bottom: 16px;
      border-bottom: 1px solid #e8eaed;
    }
    .pngx-source-toggle {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 20px;
      border: 1px solid #dadce0; cursor: pointer;
      font-size: 12px; font-weight: 500; color: #5f6368;
      transition: all .15s; user-select: none;
    }
    .pngx-source-toggle.on-origene { background: #e8f0fe; color: #1a73e8; border-color: #1a73e8; }
    .pngx-source-toggle.on-mag { background: #fff3e0; color: #e65100; border-color: #e65100; }
    .pngx-source-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #dadce0; transition: background .15s;
    }
    .on-origene .pngx-source-dot { background: #1a73e8; }
    .on-mag .pngx-source-dot { background: #e65100; }
    #pngx-close-top {
      margin-left: auto; background: transparent; border: 1px solid #dadce0;
      border-radius: 6px; padding: 4px 12px; cursor: pointer;
      font-size: 12px; color: #5f6368;
    }
    #pngx-close-top:hover { border-color: #1a73e8; color: #1a73e8; }

    #pngx-hint-text {
      text-align: center; padding: 24px 20px;
      color: #5f6368; font-size: 13px; line-height: 1.8;
    }
    #pngx-hint-text strong { display: block; font-size: 14px; color: #202124; margin-bottom: 6px; }

    #pngx-results { }

    .pngx-section { margin-bottom: 24px; }
    .pngx-section-label {
      font-size: 10px; font-weight: 600; letter-spacing: .15em;
      text-transform: uppercase; margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .pngx-section-label span { flex: 1; height: 1px; background: #e8eaed; }
    .pngx-section-label.origene-label { color: #1a73e8; }
    .pngx-section-label.mag-label { color: #e65100; }

    .pngx-answer {
      background: #f8f9fa; border: 1px solid #e8eaed;
      border-left: 4px solid #1a73e8; border-radius: 8px;
      padding: 14px 16px; font-size: 14px; line-height: 1.75;
      color: #202124; margin-bottom: 14px;
    }
    .pngx-answer.mag-answer { border-left-color: #e65100; background: #fff8f6; }

    .pngx-doc-badge {
      display: inline-block; background: #e8f0fe; color: #1a73e8;
      border: 1px solid #c5d9f8; border-radius: 4px;
      padding: 1px 6px; font-size: 11px; font-family: monospace;
      font-weight: 600; vertical-align: middle; margin: 0 1px;
    }

    .pngx-doc-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;
    }
    .pngx-doc-card {
      border: 1px solid #e8eaed; border-radius: 8px; padding: 12px;
      text-decoration: none; color: inherit;
      display: flex; flex-direction: column; gap: 5px;
      transition: all .15s; background: #fff;
    }
    .pngx-doc-card:hover { border-color: #1a73e8; box-shadow: 0 2px 6px rgba(26,115,232,.12); }
    .pngx-doc-card.mag-card:hover { border-color: #e65100; box-shadow: 0 2px 6px rgba(230,81,0,.12); }
    .pngx-doc-icon { font-size: 18px; }
    .pngx-doc-title { font-size: 12px; font-weight: 500; color: #202124; line-height: 1.4; }
    .pngx-doc-meta { font-size: 11px; color: #5f6368; }
    .mag-doc-tag {
      display: inline-block; font-size: 10px; padding: 1px 6px;
      border-radius: 10px; margin-top: 2px;
    }
    .mag-doc-tag.mag { background: #fff3e0; color: #e65100; }
    .mag-doc-tag.acad { background: #e8f0fe; color: #1a73e8; }

    .pngx-typing {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #5f6368; padding: 8px 0;
    }
    .pngx-dot { width: 6px; height: 6px; border-radius: 50%; animation: pngxbounce .9s infinite; display: inline-block; }
    .pngx-dot.blue { background: #1a73e8; }
    .pngx-dot.orange { background: #e65100; }
    .pngx-dot:nth-child(2){animation-delay:.15s} .pngx-dot:nth-child(3){animation-delay:.3s}
    @keyframes pngxbounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
    #pngx-modal-overlay {
      position: fixed; inset: 0; z-index: 999999;
      background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
      animation: pngxfade .2s ease;
    }
    #pngx-modal-box {
      background: #fff; border-radius: 12px; width: 90vw; height: 88vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    #pngx-modal-bar {
      display: flex; align-items: center; padding: 10px 16px;
      border-bottom: 1px solid #e8eaed; gap: 10px; flex-shrink: 0;
    }
    #pngx-modal-title { font-size: 13px; font-weight: 600; color: #202124; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #pngx-modal-open { font-size: 12px; padding: 4px 12px; border: 1px solid #1a73e8; background: #fff; color: #1a73e8; border-radius: 6px; cursor: pointer; text-decoration: none; }
    #pngx-modal-open:hover { background: #1a73e8; color: #fff; }
    #pngx-modal-close { font-size: 12px; padding: 4px 12px; border: 1px solid #dadce0; background: #fff; color: #5f6368; border-radius: 6px; cursor: pointer; }
    #pngx-modal-close:hover { border-color: #d93025; color: #d93025; }
    #pngx-modal-iframe { flex: 1; border: none; width: 100%; }
  `;
  document.head.appendChild(style);

  function getDocGrid() {
    return document.querySelector('.row.row-cols-paperless-cards') ||
           document.querySelector('.row-cols-paperless-cards') ||
           document.querySelector('pngx-document-list .row') ||
           document.querySelector('.document-list');
  }

  window.pngxOpenModal = function(url, title) {
    const existing = document.getElementById('pngx-modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'pngx-modal-overlay';
    overlay.innerHTML = `<div id="pngx-modal-box">
      <div id="pngx-modal-bar">
        <span id="pngx-modal-title">${title}</span>
        <a id="pngx-modal-open" href="${url}" target="_blank">↗ Apri in tab</a>
        <button id="pngx-modal-close" onclick="document.getElementById('pngx-modal-overlay').remove()">✕ Chiudi</button>
      </div>
      <iframe id="pngx-modal-iframe" src="${url}"></iframe>
    </div>`;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  (function() {
    if (window.location.pathname.indexOf('/dashboard') !== -1) {
      fetch('/api/ui_settings/', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          const u = data.user;
          if (u && !u.is_superuser && !u.is_staff) {
            window.location.replace('/documents');
          }
        })
        .catch(() => {});
    }
  })();

  function init() {
    window.aiEnabled = false; window.useOrigene = true; window.useMag = false;
    
    const waitForSidebar = setInterval(() => {
      const sidebar = document.querySelector('app-sidebar nav, .sidebar, aside');
      if (sidebar) {
        clearInterval(waitForSidebar);
        const p = document.createElement('div');
        p.style.cssText = 'padding:12px 16px;border-bottom:1px solid #e8eaed;background:#f8f9fa';
        p.innerHTML = '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px"><input type="checkbox" id="pngx-ai-enabled" style="width:16px;height:16px"><span style="font-size:13px;font-weight:600">Cerca con AI</span></label>';
        const docLink = sidebar.querySelector('a[routerlink="/documents"], a[href*="documents"]');
        if (docLink && docLink.parentElement) {
          docLink.parentElement.insertAdjacentElement('afterend', p);
        } else {
          sidebar.insertBefore(p, sidebar.firstChild);
        }
        document.getElementById('pngx-ai-enabled').addEventListener('change', (e) => { window.aiEnabled = e.target.checked; window.useOrigene = true; window.useMag = false; });
      }
    }, 200);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && window.aiEnabled) {
        const el = document.activeElement;
        if (el && el.classList && el.classList.contains('form-control')) {
          e.preventDefault();
          e.stopPropagation();
          const q = el.value.trim();
          if (q.length > 1) doSearch(q);
        }
      }
    }, true);
  }

  function buildTopbar() {
    return `<div id="pngx-topbar">
      <button id="pngx-close-top" onclick="pngxClose()">✕ Chiudi</button>
    </div>`;
  }

  window.pngxToggleSource = function(src) {
    if (src === 'origene') {
      useOrigene = !useOrigene;
      document.getElementById('toggle-origene').className = 'pngx-source-toggle' + (useOrigene?' on-origene':'');
    } else {
      useMag = !useMag;
      document.getElementById('toggle-mag').className = 'pngx-source-toggle' + (useMag?' on-mag':'');
    }
  };

  window.pngxClose = function() {
    aiMode = false;
    document.getElementById('pngx-toggle').classList.remove('active');
    closeOverlay();
  };

  function showHint() {
    document.body.classList.add('pngx-overlay-open');
    const paperlessResults = document.querySelector('.document-results, app-document-list, [class*="document"]');
    if (paperlessResults) paperlessResults.style.display = 'none';
    const grid = getDocGrid();
    if (!grid) { setTimeout(showHint, 500); return; }
    closeOverlay();
    document.body.classList.add('pngx-ai-active');
    
    overlayEl = document.createElement('div');
    overlayEl.id = 'pngx-overlay';
    overlayEl.innerHTML = buildTopbar() + `
      <div id="pngx-hint-text">
        <strong>Modalità AI attiva</strong>
        Digita nella barra di ricerca in alto e premi <kbd>Invio</kbd>
      </div>
      <div id="pngx-results"></div>`;
    grid.parentNode.insertBefore(overlayEl, grid);
  }

  function closeOverlay() {
    document.body.classList.remove('pngx-overlay-open');
    const paperlessResults = document.querySelector('.document-results, app-document-list, [class*="document"]');
    if (paperlessResults) paperlessResults.style.display = '';
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
      document.body.classList.remove('pngx-ai-active');
    }
  }

  async function doSearch(query) {
    if (!window.aiEnabled) return;
    if (!overlayEl) showHint();
    await new Promise(resolve => {
      const check = () => document.getElementById('pngx-results') ? resolve() : setTimeout(check, 50);
      check();
    });
    document.getElementById('pngx-hint-text') && (document.getElementById('pngx-hint-text').style.display = 'none');
    const results = document.getElementById('pngx-results');
    results.innerHTML = '';

    if (!useOrigene && !useMag) {
      results.innerHTML = `<div style="padding:20px;text-align:center;color:#5f6368;font-size:13px">Seleziona almeno una fonte per cercare.</div>`;
      return;
    }

    const tasks = [];
    if (window.useOrigene) tasks.push(searchOrigene(query));
    if (window.useMag) tasks.push(searchMagisterium(query));

    if (window.useOrigene) {
      results.innerHTML += `<div class="pngx-section" id="section-origene">
        <div class="pngx-section-label origene-label">✦ Archivio ORIGENE <span></span></div>
        <div class="pngx-typing"><span class="pngx-dot blue"></span><span class="pngx-dot blue"></span><span class="pngx-dot blue"></span> Cerco nei documenti…</div>
      </div>`;
    }
    if (window.useMag) {
      results.innerHTML += `<div class="pngx-section" id="section-mag">
        <div class="pngx-section-label mag-label">✦ Magisterium <span></span></div>
        <div style="padding:40px;text-align:center">
          <svg width="200" height="120" viewBox="0 0 200 120" style="margin:0 auto;display:block">
            <style>
              @keyframes docFloat1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
              @keyframes docFloat2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
              @keyframes docFloat3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
              @keyframes searchMove { 0% { transform: translate(0, 0); } 33% { transform: translate(70px, 0); } 66% { transform: translate(140px, 0); } 100% { transform: translate(0, 0); } }
              @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
              .pngx-doc1 { animation: docFloat1 2.5s ease-in-out infinite; }
              .pngx-doc2 { animation: docFloat2 2.8s ease-in-out infinite 0.3s; }
              .pngx-doc3 { animation: docFloat3 2.3s ease-in-out infinite 0.6s; }
              .pngx-search { animation: searchMove 4s ease-in-out infinite; }
              .pngx-glow { animation: pulse 1.5s ease-in-out infinite; }
            </style>
            <g class="pngx-doc1"><rect x="10" y="40" width="40" height="50" rx="3" fill="#e8eaed"/><rect x="16" y="48" width="28" height="3" rx="1" fill="#5f6368"/><rect x="16" y="55" width="22" height="3" rx="1" fill="#5f6368"/><rect x="16" y="62" width="25" height="3" rx="1" fill="#5f6368"/></g>
            <g class="pngx-doc2"><rect x="80" y="30" width="40" height="50" rx="3" fill="#e8eaed"/><rect x="86" y="38" width="28" height="3" rx="1" fill="#5f6368"/><rect x="86" y="45" width="22" height="3" rx="1" fill="#5f6368"/><rect x="86" y="52" width="25" height="3" rx="1" fill="#5f6368"/></g>
            <g class="pngx-doc3"><rect x="150" y="35" width="40" height="50" rx="3" fill="#e8eaed"/><rect x="156" y="43" width="28" height="3" rx="1" fill="#5f6368"/><rect x="156" y="50" width="22" height="3" rx="1" fill="#5f6368"/><rect x="156" y="57" width="25" height="3" rx="1" fill="#5f6368"/></g>
            <g class="pngx-search">
              <circle cx="30" cy="25" r="12" fill="none" stroke="#e65100" stroke-width="3"/>
              <line x1="39" y1="34" x2="48" y2="43" stroke="#e65100" stroke-width="3" stroke-linecap="round"/>
              <circle class="pngx-glow" cx="30" cy="25" r="18" fill="#e65100" opacity="0.2"/>
            </g>
          </svg>
          <div style="color:#5f6368;font-size:14px;margin-top:16px;font-weight:500">Interrogo Magisterium AI...</div>
        </div>
      </div>`;
    }

    const [origeneResult, magResult] = await Promise.allSettled(tasks);

    let taskIdx = 0;
    if (window.useOrigene) {
      const r = origeneResult;
      const sec = document.getElementById('section-origene');
      if (r.status === 'fulfilled') {
        const {docs, answer} = r.value;
        const fmt = esc(answer).replace(/\[DOC (\d+)\]/g, '<span class="pngx-doc-badge">DOC $1</span>');
        let html = `<div class="pngx-section-label origene-label">✦ Archivio ORIGENE <span></span></div>`;
        html += `<div class="pngx-answer">${fmt}</div>`;
        if (docs && docs.length) {
          html += `<div class="pngx-sources-label" style="color:#1a73e8">Documenti trovati (${docs.length})</div>`;
          html += `<div id="pngx-org-cards"></div>`;
          html += `<div id="pngx-org-pager" class="pngx-pager"></div>`;
        }
        clearInterval(window.pngxMagLoadInterval); sec.innerHTML = html;
        if (docs && docs.length) { window._pngxOrgDocs = docs; renderOrgPage(1); }
      } else {
        sec.innerHTML = `<div class="pngx-section-label origene-label">✦ Archivio ORIGENE <span></span></div><div class="pngx-answer" style="border-left-color:#d93025;color:#d93025">⚠ ${esc(r.reason?.message||'Errore')}</div>`;
      }
      taskIdx++;
    }

    if (window.useMag) {
      const r = magResult || (origeneResult.status === 'rejected' ? origeneResult : tasks[taskIdx] ? await Promise.allSettled([tasks[taskIdx]])[0] : null);
      const magR = useOrigene ? magResult : origeneResult;
      const sec = document.getElementById('section-mag');
      if (magR && magR.status === 'fulfilled') {
        const {answer, citations} = magR.value;
        // Clean markdown formatting
        const cleanAnswer = answer
          .replace(/#{1,6}\s+/g, '')
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/\[(\d+)\]/g, '<span class="pngx-doc-badge">$1</span>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        let html = `<div class="pngx-section-label mag-label">✦ Magisterium <span></span></div>`;
        html += `<div class="pngx-answer mag-answer"><p>${cleanAnswer}</p></div>`;
        if (citations && citations.length) {
          html += `<div class="pngx-sources-label" style="color:#e65100">Fonti citate (${citations.length})</div>`;
          html += `<div id="pngx-mag-cits"></div>`;
          html += `<div id="pngx-mag-pager" class="pngx-pager"></div>`;
          window._pngxCits = citations;
          html += `<style>
            .pngx-cit { border:1px solid #f0d4c4; border-radius:8px; margin-bottom:8px; background:#fffaf7; overflow:hidden; }
            .pngx-cit-head { padding:10px 14px; cursor:pointer; display:flex; gap:8px; align-items:flex-start; }
            .pngx-cit-head:hover { background:#fff3ea; }
            .pngx-cit-title { font-size:13px; font-weight:600; color:#3c4043; }
            .pngx-cit-meta { font-size:11px; color:#80868b; margin-top:2px; }
            .pngx-cit-body { display:none; padding:0 14px 14px 14px; border-top:1px solid #f0d4c4; }
            .pngx-cit-body.open { display:block; }
            .pngx-cit-text { font-size:13px; line-height:1.7; color:#3c4043; white-space:pre-wrap; margin-top:10px; }
            .pngx-cit-btn { margin-top:10px; padding:5px 12px; font-size:12px; border:1px solid #e65100; background:#fff; color:#e65100; border-radius:6px; cursor:pointer; }
            .pngx-cit-btn:hover { background:#e65100; color:#fff; }
            .pngx-cit-btn:disabled { opacity:.5; cursor:default; }
            .pngx-pager { display:flex; align-items:center; gap:12px; justify-content:center; margin:12px 0; }
            .pngx-pg-btn { padding:5px 14px; font-size:12px; border:1px solid #1a73e8; background:#fff; color:#1a73e8; border-radius:6px; cursor:pointer; }
            .pngx-pg-btn:hover:not(:disabled) { background:#1a73e8; color:#fff; }
            .pngx-pg-btn:disabled { opacity:.4; cursor:default; }
            .pngx-pg-info { font-size:12px; color:#5f6368; }
          </style>`;
        }
        clearInterval(window.pngxMagLoadInterval); sec.innerHTML = html;
        if (citations && citations.length) renderMagCitations(citations);
      } else if (magR) {
        sec.innerHTML = `<div class="pngx-section-label mag-label">✦ Magisterium <span></span></div><div class="pngx-answer mag-answer" style="border-left-color:#d93025;color:#d93025">⚠ ${esc(magR.reason?.message||'Errore')}</div>`;
      }
    }
  }

  async function searchOrigene(query) {
    const kw = await extractKeywords(query);
    let res = await fetch(`${BASE}/api/documents/?search=${encodeURIComponent(kw)}&page_size=50`, {credentials:'include'});
    if (!res.ok) throw new Error('API error ' + res.status);
    let data = await res.json();
    let docs = (data.results||[]);
    if (!docs.length && kw !== query) {
      res = await fetch(`${BASE}/api/documents/?search=${encodeURIComponent(query)}&page_size=50`, {credentials:'include'});
      data = await res.json();
      docs = (data.results||[]);
    }
    const answer = await callRegolo(query, docs.slice(0,6));
    return {docs, answer};
  }

  async function searchMagisterium(query) {
    const __lang = (navigator.language || "it").split("-")[0];

    // 1. Cerca fonti cattoliche con Magisterium Search API
    const magRes = await fetch('/api/mag-search', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({query: query, numResults: 5})
    });
    if (!magRes.ok) throw new Error('Magisterium error ' + magRes.status);
    const magData = await magRes.json();
    const results = magData?.data?.results || [];
    if (results.length === 0) return {answer: 'Nessun documento trovato.', citations: []};

    // 2. Prepara contesto per Regolo.ai
    const context = results.map((r, i) =>
      `[FONTE ${i+1}] ${r.document_title || ''} (${r.author || ''})\n${r.text || ''}`
    ).join('\n\n---\n\n');

    // Traduci titoli con Regolo.ai in parallelo
    const rawCitations = results.map(r => ({
      document_title: r.document_title || '',
      cited_text: r.text || '',
      document_author: r.author || '',
      author: r.author || '',
      source_url: r.url || '',
      paperless_match: false
    }));

    const translateTitle = async (title) => {
      if (!title) return title;
      try {
        const tr = await fetch(REGOLO_BASE_URL + '/chat/completions', {
          method: 'POST',
          headers: {'Content-Type':'application/json', 'Authorization': 'Bearer ' + REGOLO_API_KEY},
          body: JSON.stringify({
            model: REGOLO_MODEL,
            messages: [
              {role:'system', content:`Traduci il titolo in ${__lang}. Rispondi SOLO con la traduzione, senza commenti, senza virgolette.`},
              {role:'user', content: title}
            ],
            max_tokens: 100,
            temperature: 0.1
          })
        });
        if (!tr.ok) return title;
        const td = await tr.json();
        return td.choices?.[0]?.message?.content?.trim() || title;
      } catch(e) { return title; }
    };

    const translatedTitles = await Promise.all(rawCitations.map(c => translateTitle(c.document_title)));
    const citations = rawCitations.map((c, i) => ({...c, document_title: translatedTitles[i]}));

    // 3. Regolo.ai sintetizza
    const regoloRes = await fetch(REGOLO_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Authorization': 'Bearer ' + REGOLO_API_KEY},
      body: JSON.stringify({
        model: REGOLO_MODEL,
        messages: [
          {role: 'system', content: `Sei un assistente teologico esperto. Rispondi sempre in ${__lang}, in modo chiaro e sintetico, basandoti esclusivamente sui documenti forniti. Cita le fonti usando [FONTE N].`},
          {role: 'user', content: `Domanda: ${query}\n\nDocumenti:\n${context}`}
        ],
        max_tokens: 800,
        temperature: 0.3
      })
    });
    if (!regoloRes.ok) throw new Error('Regolo error ' + regoloRes.status);
    const regoloData = await regoloRes.json();
    const answer = regoloData.choices?.[0]?.message?.content || 'Nessuna risposta.';

    return {answer, citations};
  }

  async function extractKeywords(query) {
    try {
      const res = await fetch(`${REGOLO_BASE_URL}/chat/completions`, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${REGOLO_API_KEY}`},
        body:JSON.stringify({model:REGOLO_MODEL,messages:[
          {role:'system',content:'Estrai 2-4 parole chiave dalla domanda. Rispondi SOLO con le parole chiave separate da spazio, senza punteggiatura.'},
          {role:'user',content:query}
        ],max_tokens:20,temperature:0})
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim()||query;
    } catch(e) { return query; }
  }

  async function callRegolo(query, docs) {
    const ctx = docs.map((d,i)=>`[DOC ${i+1}] "${d.title}"\n${(d.content||'').slice(0,800).replace(/\s+/g,' ').trim()}`).join('\n\n---\n\n');
    const res = await fetch(`${REGOLO_BASE_URL}/chat/completions`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${REGOLO_API_KEY}`},
      body:JSON.stringify({model:REGOLO_MODEL,messages:[
        {role:'system',content:`Sei un assistente documentale. Rispondi in italiano, chiaro e sintetico. Hai ${docs.length} documenti. Cita con [DOC N]. Non inventare.`},
        {role:'user',content:`Documenti:\n\n${ctx}\n\n---\nDomanda: ${query}`}
      ],max_tokens:600,temperature:0.3})
    });
    if (!res.ok) throw new Error('Errore AI ' + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content||'Nessuna risposta.';
  }


  function renderMagCitations(citations) {
    window._pngxCits = citations;
    renderMagPage(1);
  }

  function renderMagPage(page) {
    const wrap = document.getElementById('pngx-mag-cits');
    if (!wrap) return;
    const citations = window._pngxCits || [];
    const per = 10;
    const totPages = Math.ceil(citations.length / per) || 1;
    page = Math.max(1, Math.min(page, totPages));
    const start = (page - 1) * per;
    const slice = citations.slice(start, start + per);
    wrap.innerHTML = slice.map((c, si) => {
      const i = start + si;
      const title = esc(c.document_title || '');
      const meta = [c.document_author, c.document_year, c.document_reference].filter(Boolean).map(esc).join(' \u00b7 ');
      const heading = c.cited_text_heading ? esc(c.cited_text_heading) : '';
      const text = esc((c.cited_text || '').replace(/\s*---\s*$/, '').trim());
      return `<div class="pngx-cit">
        <div class="pngx-cit-head" onclick="pngxToggleCit(${i})">
          <span>\ud83d\udcdc</span>
          <div><div class="pngx-cit-title">${title}</div><div class="pngx-cit-meta">${meta}</div></div>
        </div>
        <div class="pngx-cit-body" id="pngx-cit-body-${i}">
          ${heading ? `<div class="pngx-cit-meta" style="margin-top:10px;font-weight:600">${heading}</div>` : ''}
          <div class="pngx-cit-text" id="pngx-cit-text-${i}">${text}</div>
          <button class="pngx-cit-btn" id="pngx-cit-btn-${i}" onclick="pngxTranslateCit(${i})">\ud83c\udf10 Traduci</button>
        </div>
      </div>`;
    }).join('');
    const pager = document.getElementById('pngx-mag-pager');
    if (pager) pager.innerHTML = buildPager(page, totPages, 'renderMagPage');
  }

  window.pngxToggleCit = function(i) {
    const b = document.getElementById('pngx-cit-body-' + i);
    if (b) b.classList.toggle('open');
  };

  window.pngxTranslateCit = async function(i) {
    const btn = document.getElementById('pngx-cit-btn-' + i);
    const txtEl = document.getElementById('pngx-cit-text-' + i);
    const cit = (window._pngxCits || [])[i];
    if (!btn || !txtEl || !cit) return;
    if (btn._done) { return; }
    btn.disabled = true; btn.textContent = '\u23f3 Traduco...';
    try {
      const translated = await translateText((cit.cited_text || '').replace(/\s*---\s*$/, '').trim());
      txtEl.textContent = translated;
      btn.textContent = '\u2713 Tradotto';
      btn._done = true;
    } catch(e) {
      btn.disabled = false; btn.textContent = '\u26a0 Riprova';
    }
  };

  async function translateText(text) {
    const lang = (navigator.language || 'it').split('-')[0];
    const res = await fetch(`${REGOLO_BASE_URL}/chat/completions`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${REGOLO_API_KEY}`},
      body:JSON.stringify({model:REGOLO_MODEL,messages:[
        {role:'system',content:`Traduci il testo dell'utente in lingua "${lang}". Rispondi SOLO con la traduzione, senza commenti.`},
        {role:'user',content:text}
      ],max_tokens:1500,temperature:0.2})
    });
    if (!res.ok) throw new Error('Errore traduzione ' + res.status);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || text;
  }

  function buildPager(page, totPages, fnName) {
    if (totPages <= 1) return '';
    return `<button class="pngx-pg-btn" ${page<=1?'disabled':''} onclick="${fnName}(${page-1})">\u2039 Prec</button>
      <span class="pngx-pg-info">Pagina ${page} di ${totPages}</span>
      <button class="pngx-pg-btn" ${page>=totPages?'disabled':''} onclick="${fnName}(${page+1})">Succ \u203a</button>`;
  }

  window.renderOrgPage = function(page) {
    const wrap = document.getElementById('pngx-org-cards');
    if (!wrap) return;
    const docs = window._pngxOrgDocs || [];
    const per = 16;
    const totPages = Math.ceil(docs.length / per) || 1;
    page = Math.max(1, Math.min(page, totPages));
    const start = (page - 1) * per;
    const slice = docs.slice(start, start + per);
    wrap.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:16px;padding:16px 0';
    wrap.innerHTML = slice.map(d => {
      const date = d.created_date ? new Date(d.created_date).toLocaleDateString('it-IT') : '';
      const desc = d.content ? d.content.substring(0, 120).trim() + '...' : '';
      return `<a style="display:flex;flex-direction:column;text-decoration:none;border:1px solid #e8eaed;border-radius:8px;overflow:hidden;transition:all .2s;background:#fff" href="#" onclick="event.preventDefault();pngxOpenModal('${BASE}/documents/${d.id}/details','${esc(d.title||'#'+d.id)}')" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='';this.style.boxShadow=''">
        <img src="${BASE}/api/documents/${d.id}/thumb/" style="width:100%;height:140px;object-fit:cover" onerror="this.style.background='#f8f9fa';this.style.display='flex';this.style.alignItems='center';this.style.justifyContent='center';this.textContent='📄'">
        <div style="padding:12px;flex:1;display:flex;flex-direction:column">
          <div style="font-size:13px;font-weight:600;color:#202124;margin-bottom:6px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(d.title||'#'+d.id)}</div>
          <div style="font-size:11px;color:#5f6368;margin-bottom:6px">${date}</div>
          <div style="font-size:10px;color:#80868b;line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;margin-top:auto">${esc(desc)}</div>
        </div>
      </a>`;
    }).join('');
    const pager = document.getElementById('pngx-org-pager');
    if (pager) pager.innerHTML = buildPager(page, totPages, 'renderOrgPage');
  };

  window.renderMagPage = function(page) { renderMagPage(page); };

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else setTimeout(init, 1000);
})();
