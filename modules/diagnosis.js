/* ═══════════════════════════════════════════════════════════════
   MODULE: diagnosis — 快速诊断（快速摸底，标记掌握程度）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let state = {
    filter: 'all',
    currentIdx: 0,
    items: [],
    results: [],   // {pinyin, category, status}  status: 'known'|'unsure'|'unknown'
    busy: false,
    currentAudio: null,
    timer: null
  };

  /* ─── HELPERS ─────────────────────────────────────────────── */
  function getPool(filter){
    const all = [];
    for(const c of ['shengmu','yunmu','zhengti'])
      PINYIN_DATA[c].forEach(py => all.push({pinyin:py, category:c}));
    return filter === 'all' ? all : all.filter(p=>p.category===filter);
  }

  /* ─── INJECT STYLES ───────────────────────────────────────── */
  function injectStyles(){
    if(document.getElementById('diagStyle')) return;
    const s = document.createElement('style');
    s.id = 'diagStyle';
    s.textContent = `
      .diag-wrap{max-width:520px;margin:0 auto}
      .diag-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
      .diag-tab{padding:6px 14px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;
        font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:#64748b}
      .diag-tab:hover{border-color:#6366f1}
      .diag-tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
      .diag-progress{display:flex;align-items:center;gap:10px;margin-bottom:16px}
      .diag-progress .bar{flex:1;height:8px;border-radius:4px;background:#e2e8f0;overflow:hidden}
      .diag-progress .bar .fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6);
        transition:width .4s ease;width:0%}
      .diag-progress .label{font-size:13px;font-weight:600;color:#6366f1;white-space:nowrap}
      .diag-card{background:#fff;border-radius:20px;padding:32px 24px 24px;
        box-shadow:0 4px 20px rgba(0,0,0,.06);text-align:center;margin-bottom:16px;
        animation:diagFade .3s ease}
      @keyframes diagFade{0%{opacity:0;transform:translateY(12px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}
      .diag-card .big-py{font-size:clamp(60px,15vw,100px);font-weight:800;color:#1e293b;line-height:1.2;margin-bottom:4px}
      .diag-card .cat-tag{display:inline-block;padding:2px 12px;border-radius:4px;
        font-size:12px;font-weight:600;margin-bottom:12px}
      .diag-card .cat-tag.shengmu{background:#eef2ff;color:#6366f1}
      .diag-card .cat-tag.yunmu{background:#dcfce7;color:#16a34a}
      .diag-card .cat-tag.zhengti{background:#fef3c7;color:#d97706}
      .diag-card .replay-btn{display:none;padding:6px 16px;border:none;border-radius:8px;
        background:#f1f5f9;color:#6366f1;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:16px}
      .diag-card .replay-btn.show{display:inline-block}
      .diag-card .replay-btn:active{background:#e2e8f0}
      .diag-marks{display:flex;gap:10px;justify-content:center}
      .diag-marks button{padding:12px 20px;border:2px solid #e2e8f0;border-radius:12px;
        font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;background:#fff;flex:1;max-width:140px}
      .diag-marks button:active{transform:scale(.92)}
      .diag-marks .mk-known{border-color:#86efac;color:#16a34a}
      .diag-marks .mk-known:active{background:#dcfce7}
      .diag-marks .mk-known.tapped{background:#dcfce7;border-color:#22c55e}
      .diag-marks .mk-unsure{border-color:#fde68a;color:#d97706}
      .diag-marks .mk-unsure:active{background:#fef3c7}
      .diag-marks .mk-unsure.tapped{background:#fef3c7;border-color:#f59e0b}
      .diag-marks .mk-unknown{border-color:#fca5a5;color:#dc2626}
      .diag-marks .mk-unknown:active{background:#fee2e2}
      .diag-marks .mk-unknown.tapped{background:#fee2e2;border-color:#ef4444}
      .diag-summary{animation:diagFade .3s ease}
      .diag-summary .sum-hdr{text-align:center;margin-bottom:20px}
      .diag-summary .sum-hdr .sum-icon{font-size:40px;margin-bottom:8px}
      .diag-summary .sum-hdr .sum-title{font-size:22px;font-weight:800;color:#1e293b}
      .diag-summary .sum-hdr .sum-sub{font-size:14px;color:#94a3b8;margin-top:4px}
      .diag-summary .sum-stats{display:flex;gap:12px;justify-content:center;margin-bottom:20px}
      .diag-summary .sum-stat{padding:10px 16px;border-radius:12px;text-align:center;min-width:80px}
      .diag-summary .sum-stat .num{font-size:24px;font-weight:800;line-height:1.2}
      .diag-summary .sum-stat .lbl{font-size:12px;font-weight:600;margin-top:2px}
      .diag-summary .sum-stat.k{background:#dcfce7;color:#16a34a}
      .diag-summary .sum-stat.u{background:#fef3c7;color:#d97706}
      .diag-summary .sum-stat.n{background:#fee2e2;color:#dc2626}
      .diag-summary .sum-cat{margin-bottom:16px}
      .diag-summary .sum-cat-title{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;padding-left:4px}
      .diag-summary .sum-cat-items{display:flex;flex-wrap:wrap;gap:6px}
      .diag-summary .sum-item{padding:4px 10px;border-radius:6px;font-size:13px;font-weight:600}
      .diag-summary .sum-item.known{background:#dcfce7;color:#16a34a}
      .diag-summary .sum-item.unsure{background:#fef3c7;color:#d97706}
      .diag-summary .sum-item.unknown{background:#fee2e2;color:#dc2626}
      .diag-summary .sum-btn-row{text-align:center;margin-top:20px}
      .diag-summary .sum-btn-row button{padding:12px 32px;border:none;border-radius:12px;
        font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
      .diag-summary .sum-btn-row button:active{transform:scale(.95)}
      .diag-summary .sum-btn-row .btn-re{background:#f1f5f9;color:#64748b;margin-right:10px}
      .diag-summary .sum-btn-row .btn-ct{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
        box-shadow:0 4px 16px rgba(99,102,241,.3)}
    `;
    document.head.appendChild(s);
  }

  /* ─── CLEANUP ─────────────────────────────────────────────── */
  function cleanup(){
    if(state.currentAudio){state.currentAudio.pause();state.currentAudio=null}
    clearTimeout(state.timer);
    state.busy = false;
  }

  /* ─── RENDER ──────────────────────────────────────────────── */
  function render(container){
    injectStyles();
    cleanup();

    // Reset state
    state.filter = 'all';
    state.currentIdx = 0;
    state.items = getPool('all').sort(()=>Math.random()-0.5);
    state.results = [];
    state.busy = false;

    renderUI(container);
  }

  function renderUI(container){
    container.innerHTML = `
      <div class="section-title">🔍 快速诊断</div>
      <div class="section-subtitle">快速过一遍拼音，标记掌握程度</div>
      <div class="diag-wrap">
        <div class="diag-tabs" id="diagTabs">
          <button class="diag-tab active" data-filter="all">全部(63)</button>
          <button class="diag-tab" data-filter="shengmu">声母(23)</button>
          <button class="diag-tab" data-filter="yunmu">韵母(24)</button>
          <button class="diag-tab" data-filter="zhengti">整体认读(16)</button>
        </div>
        <div id="diagBody"></div>
      </div>
    `;

    // Tab clicks
    container.querySelectorAll('.diag-tab').forEach(tab=>{
      tab.addEventListener('click', function(){
        if(state.busy) return;
        container.querySelectorAll('.diag-tab').forEach(t=>t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        state.filter = filter;
        state.currentIdx = 0;
        state.items = getPool(filter).sort(()=>Math.random()-0.5);
        state.results = [];
        showCard(container);
      });
    });

    // Show first card
    showCard(container);
  }

  function showCard(container){
    const body = container.querySelector('#diagBody');
    if(state.currentIdx >= state.items.length){
      showSummary(body, container);
      return;
    }

    const item = state.items[state.currentIdx];
    const total = state.items.length;
    const done = state.results.length;
    const tagClass = item.category;
    const tagName = catName(item.category);

    body.innerHTML = `
      <div class="diag-progress">
        <div class="bar"><div class="fill" style="width:${total>0?(done/total*100):0}%"></div></div>
        <div class="label">已完成 ${done}/${total}</div>
      </div>
      <div class="diag-card" id="diagCard">
        <div class="big-py">${dn(item.pinyin)}</div>
        <span class="cat-tag ${tagClass}">${tagName}</span>
        <div><button class="replay-btn" id="diagReplay">🔁 重播</button></div>
        <div class="diag-marks">
          <button class="mk-known" data-status="known">✅ 认识</button>
          <button class="mk-unsure" data-status="unsure">⚠️ 模糊</button>
          <button class="mk-unknown" data-status="unknown">❌ 不认识</button>
        </div>
      </div>
    `;

    // Auto-play audio — attach ended handler to show replay btn
    const audio = playAudio(item.pinyin);
    if(audio){
      audio.addEventListener('ended', ()=>{
        const rp = body.querySelector('#diagReplay');
        if(rp) rp.classList.add('show');
      });
    }

    // Replay
    body.querySelector('#diagReplay').addEventListener('click', ()=>{
      playAudio(item.pinyin);
    });
    // Fallback: show replay btn after 1.5s even if audio fails or is silent
    setTimeout(()=>{
      const rp = body.querySelector('#diagReplay');
      if(rp && !rp.classList.contains('show')) rp.classList.add('show');
    }, 1500);

    // Mark buttons
    body.querySelectorAll('.diag-marks button').forEach(btn=>{
      btn.addEventListener('click', function(){
        if(state.busy) return;
        state.busy = true;
        const status = this.dataset.status;
        // Add tapped visual feedback
        this.classList.add('tapped');
        state.results.push({
          pinyin: item.pinyin,
          category: item.category,
          status: status
        });
        state.currentIdx++;
        // Save to localStorage
        saveResults();
        // Auto-advance after 600ms
        state.timer = setTimeout(()=>{
          state.busy = false;
          showCard(container);
        }, 600);
      });
    });
  }

  function playAudio(pinyin){
    if(state.currentAudio){state.currentAudio.pause();state.currentAudio=null}
    const a = new Audio('audio/'+pinyin+'.mp3');
    state.currentAudio = a;
    a.play().catch(()=>{});
    return a;
  }

  function saveResults(){
    try{
      const existing = JSON.parse(localStorage.getItem('diagResults') || '{}');
      const result = state.results[state.results.length-1];
      if(result){
        if(!existing[result.category]) existing[result.category] = {};
        existing[result.category][result.pinyin] = result.status;
      }
      localStorage.setItem('diagResults', JSON.stringify(existing));
    }catch(e){}
  }

  /* ─── SYNC TO BACKEND ─────────────────────────────────────── */
  function syncToBackend(){
    if(!window.api || !window.api.isLoggedIn()) return;
    try{
      const data = JSON.parse(localStorage.getItem('diagResults') || '{}');
      const results = [];
      for(const [cat, items] of Object.entries(data)){
        for(const [pinyin, status] of Object.entries(items)){
          results.push({category: cat, pinyin, status});
        }
      }
      if(results.length > 0){
        window.api.saveDiagnosis(results);
      }
    }catch(e){
      // Network errors must never block the UI
    }
  }

  /* ─── SUMMARY SCREEN ─────────────────────────────────────── */
  function showSummary(body, container){
    const results = state.results;
    const known = results.filter(r=>r.status==='known').length;
    const unsure = results.filter(r=>r.status==='unsure').length;
    const unknown = results.filter(r=>r.status==='unknown').length;
    const total = results.length;

    // Group by category
    const cats = ['shengmu','yunmu','zhengti'];
    const catData = {};
    cats.forEach(c=>{
      catData[c] = {known:[], unsure:[], unknown:[]};
    });
    results.forEach(r=>{
      if(catData[r.category]) catData[r.category][r.status].push(r.pinyin);
    });

    body.innerHTML = `
      <div class="diag-summary">
        <div class="sum-hdr">
          <div class="sum-icon">📊</div>
          <div class="sum-title">诊断完成</div>
          <div class="sum-sub">共诊断 ${total} 个拼音</div>
        </div>
        <div class="sum-stats">
          <div class="sum-stat k"><div class="num">${known}</div><div class="lbl">✅ 认识</div></div>
          <div class="sum-stat u"><div class="num">${unsure}</div><div class="lbl">⚠️ 模糊</div></div>
          <div class="sum-stat n"><div class="num">${unknown}</div><div class="lbl">❌ 不认识</div></div>
        </div>
        <div id="diagSumCats">
          ${cats.map(c=>{
            const d = catData[c];
            const all = [...d.known,...d.unsure,...d.unknown];
            if(all.length === 0) return '';
            return `<div class="sum-cat">
              <div class="sum-cat-title">${catName(c)}（${all.length}个）</div>
              <div class="sum-cat-items">
                ${all.map(py=>{
                  const st = d.known.includes(py) ? 'known' : d.unsure.includes(py) ? 'unsure' : 'unknown';
                  return `<span class="sum-item ${st}">${dn(py)}</span>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div class="sum-btn-row">
          <button class="btn-re" id="diagRestart">🔄 再来一次</button>
          <button class="btn-ct" id="diagContrast">⚡ 去对比精学</button>
        </div>
      </div>
    `;

    body.querySelector('#diagRestart').addEventListener('click', ()=>{
      state.filter = container.querySelector('.diag-tab.active')?.dataset?.filter || 'all';
      state.currentIdx = 0;
      state.items = getPool(state.filter).sort(()=>Math.random()-0.5);
      state.results = [];
      showCard(container);
    });

    body.querySelector('#diagContrast').addEventListener('click', ()=>{
      switchPage('contrast');
    });

    // Sync completed diagnosis results to backend API
    syncToBackend();
  }

  /* ─── REGISTER ────────────────────────────────────────────── */
  registerModule('diagnosis', {
    render: render,
    cleanup: cleanup
  });
})();
