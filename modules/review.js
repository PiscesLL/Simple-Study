/* ═══════════════════════════════════════════════════════════════
   MODULE: review — 查漏补缺（自动汇总薄弱项，针对性补练）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentTab = 'weak';
  let currentAudio = null;

  /* ─── INJECT STYLES ───────────────────────────────────────── */
  function injectStyles(){
    if(document.getElementById('reviewStyle')) return;
    const s = document.createElement('style');
    s.id = 'reviewStyle';
    s.textContent = `
      .rev-wrap{max-width:560px;margin:0 auto}
      .rev-empty{text-align:center;padding:60px 20px}
      .rev-empty .icon{font-size:64px;margin-bottom:16px}
      .rev-empty h3{font-size:18px;font-weight:700;color:#1e293b;margin-bottom:6px}
      .rev-empty p{font-size:14px;color:#94a3b8;margin-bottom:20px}
      .rev-empty .rev-go-btn{padding:14px 36px;border:none;border-radius:12px;
        font-size:16px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3);transition:all .2s}
      .rev-empty .rev-go-btn:active{transform:scale(.95)}
      .rev-summary{display:flex;gap:12px;justify-content:center;margin-bottom:16px;flex-wrap:wrap}
      .rev-sum-item{padding:10px 18px;border-radius:12px;text-align:center;min-width:90px;flex:1;max-width:140px}
      .rev-sum-item .num{font-size:clamp(20px,5vw,28px);font-weight:800;line-height:1.2}
      .rev-sum-item .lbl{font-size:12px;font-weight:600;margin-top:2px}
      .rev-sum-item.weak{background:#fee2e2;color:#dc2626}
      .rev-sum-item.unsure{background:#fef3c7;color:#d97706}
      .rev-sum-item.known{background:#dcfce7;color:#16a34a}
      .rev-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
      .rev-tab{padding:6px 16px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;
        font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:#64748b}
      .rev-tab:hover{border-color:#6366f1}
      .rev-tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
      .rev-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
      .rev-item{display:flex;align-items:center;gap:12px;padding:12px 16px;
        background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.04);
        border:1px solid #f1f5f9;transition:all .2s}
      .rev-item .py{font-size:clamp(20px,5vw,28px);font-weight:800;color:#1e293b;
        width:70px;text-align:center;flex-shrink:0;line-height:1.2}
      .rev-item .badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;
        border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap}
      .rev-item .badge.unknown{background:#fee2e2;color:#dc2626}
      .rev-item .badge.unsure{background:#fef3c7;color:#d97706}
      .rev-item .badge.known{background:#dcfce7;color:#16a34a}
      .rev-item .cat-tag{display:inline-block;padding:2px 8px;border-radius:4px;
        font-size:11px;font-weight:600}
      .rev-item .cat-tag.shengmu{background:#eef2ff;color:#6366f1}
      .rev-item .cat-tag.yunmu{background:#dcfce7;color:#16a34a}
      .rev-item .cat-tag.zhengti{background:#fef3c7;color:#d97706}
      .rev-item .play-btn{margin-left:auto;width:44px;height:44px;border-radius:50%;
        border:2px solid #e2e8f0;font-size:20px;cursor:pointer;transition:all .15s;
        background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .rev-item .play-btn:active{transform:scale(.85);background:#f1f5f9}
      .rev-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:4px}
      .rev-actions button{padding:12px 28px;border:none;border-radius:12px;
        font-size:15px;font-weight:700;cursor:pointer;transition:all .2s}
      .rev-actions button:active{transform:scale(.95)}
      .rev-actions .rev-dict-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);
        color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
      .rev-actions .rev-clear-btn{background:#f1f5f9;color:#64748b}
      .rev-actions .rev-clear-btn:active{background:#e2e8f0}
    `;
    document.head.appendChild(s);
  }

  /* ─── HELPERS ─────────────────────────────────────────────── */
  function loadResults(){
    try{
      const raw = localStorage.getItem('diagResults');
      if(!raw) return null;
      const data = JSON.parse(raw);
      const items = [];
      for(const cat of ['shengmu','yunmu','zhengti']){
        if(!data[cat]) continue;
        for(const [py, status] of Object.entries(data[cat])){
          items.push({pinyin: py, category: cat, status: status});
        }
      }
      return items.length > 0 ? items : null;
    }catch(e){ return null }
  }

  function playAudio(pinyin){
    if(window.api && typeof window.api.track === 'function') window.api.track('review', pinyin);
    if(currentAudio){currentAudio.pause();currentAudio=null}
    const a = new Audio('audio/'+pinyin+'.mp3');
    currentAudio = a;
    a.play().catch(function(){});
    return a;
  }

  function catName(c){
    return {shengmu:'声母',yunmu:'韵母',zhengti:'整体认读'}[c]||'全部';
  }

  function statusLabel(s){
    return s === 'unknown' ? '❌不认识' : s === 'unsure' ? '⚠️模糊' : '✅认识';
  }

  function statusBadgeClass(s){
    return s === 'unknown' ? 'unknown' : s === 'unsure' ? 'unsure' : 'known';
  }

  /* ─── CLEANUP ─────────────────────────────────────────────── */
  function cleanup(){
    if(currentAudio){currentAudio.pause();currentAudio=null}
  }

  /* ─── RENDER ──────────────────────────────────────────────── */
  function render(container){
    injectStyles();
    cleanup();

    const items = loadResults();

    container.innerHTML = `
      <div class="section-title">✅ 查漏补缺</div>
      <div class="section-subtitle">自动汇总薄弱项，针对性补练</div>
      <div class="rev-wrap" id="revWrap">
      </div>
    `;

    const wrap = container.querySelector('#revWrap');

    if(!items){
      showEmpty(wrap);
    }else{
      showReview(wrap, items);
    }
  }

  /* ─── EMPTY STATE ─────────────────────────────────────────── */
  function showEmpty(container){
    container.innerHTML = `
      <div class="rev-empty">
        <div class="icon">📋</div>
        <h3>还没有诊断数据</h3>
        <p>先去快速诊断吧</p>
        <button class="rev-go-btn" id="revGoDiag">🔍 去诊断</button>
      </div>
    `;
    container.querySelector('#revGoDiag').addEventListener('click', function(){
      switchPage('diagnosis');
    });
  }

  /* ─── REVIEW CONTENT ──────────────────────────────────────── */
  function showReview(container, items){
    const known = items.filter(i=>i.status==='known').length;
    const unsure = items.filter(i=>i.status==='unsure').length;
    const unknown = items.filter(i=>i.status==='unknown').length;
    currentTab = 'weak';

    container.innerHTML = `
      <div class="rev-summary">
        <div class="rev-sum-item weak"><div class="num">${unknown}</div><div class="lbl">❌ 薄弱项</div></div>
        <div class="rev-sum-item unsure"><div class="num">${unsure}</div><div class="lbl">⚠️ 模糊项</div></div>
        <div class="rev-sum-item known"><div class="num">${known}</div><div class="lbl">✅ 已掌握</div></div>
      </div>
      <div class="rev-tabs" id="revTabs">
        <button class="rev-tab active" data-tab="weak">全部薄弱项</button>
        <button class="rev-tab" data-tab="unknown">❌ 不认识</button>
        <button class="rev-tab" data-tab="unsure">⚠️ 模糊</button>
        <button class="rev-tab" data-tab="known">✅ 已掌握</button>
      </div>
      <div class="rev-list" id="revList"></div>
      <div class="rev-actions" id="revActions"></div>
    `;

    // Tab clicks
    container.querySelectorAll('.rev-tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        container.querySelectorAll('.rev-tab').forEach(function(t){
          t.classList.remove('active');
        });
        this.classList.add('active');
        currentTab = this.dataset.tab;
        renderList(container, items);
      });
    });

    // Action buttons
    const actionsEl = container.querySelector('#revActions');
    const hasWeak = unknown + unsure > 0;
    if(hasWeak){
      actionsEl.innerHTML = `
        <button class="rev-dict-btn" id="revDictBtn">✍️ 听写薄弱项</button>
        <button class="rev-clear-btn" id="revClearBtn">🔄 清除诊断数据</button>
      `;
    }else{
      actionsEl.innerHTML = `
        <button class="rev-clear-btn" id="revClearBtn">🔄 清除诊断数据</button>
      `;
    }

    actionsEl.querySelector('#revClearBtn').addEventListener('click', function(){
      localStorage.removeItem('diagResults');
      // Also clear on backend if logged in
      if(window.api && window.api.isLoggedIn()){
        try{ window.api.clearDiagnosis(); }catch(e){}
      }
      // Re-render the review module to show empty state
      const wrap = container.querySelector('#revWrap');
      showEmpty(wrap);
    });

    const dictBtn = actionsEl.querySelector('#revDictBtn');
    if(dictBtn){
      dictBtn.addEventListener('click', function(){
        const weakItems = items.filter(function(i){
          return i.status === 'unknown' || i.status === 'unsure';
        });
        window.__dictRound = {
          pool: weakItems.map(function(i){ return {pinyin: i.pinyin, category: i.category}; }),
          label: '薄弱项听写',
          count: weakItems.length,
          noCert: true
        };
        window.switchPage('dictation');
      });
    }

    // Initial render
    renderList(container, items);
  }

  /* ─── RENDER FILTERED LIST ────────────────────────────────── */
  function renderList(container, items){
    const listEl = container.querySelector('#revList');
    const filtered = currentTab === 'weak'
      ? items.filter(function(i){ return i.status === 'unknown' || i.status === 'unsure'; })
      : items.filter(function(i){ return i.status === currentTab; });

    if(filtered.length === 0){
      listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#94a3b8;font-size:14px">暂无此项内容</div>';
      return;
    }

    listEl.innerHTML = filtered.map(function(item){
      const badgeClass = statusBadgeClass(item.status);
      const label = statusLabel(item.status);
      const catClass = item.category;
      const catNameStr = catName(item.category);
      return '<div class="rev-item" data-pinyin="'+item.pinyin+'">'+
        '<div class="py">'+dn(item.pinyin)+'</div>'+
        '<span class="badge '+badgeClass+'">'+label+'</span>'+
        '<span class="cat-tag '+catClass+'">'+catNameStr+'</span>'+
        '<button class="play-btn" data-pinyin="'+item.pinyin+'">🔁</button>'+
      '</div>';
    }).join('');

    // Play button clicks
    listEl.querySelectorAll('.play-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        playAudio(this.dataset.pinyin);
      });
    });
  }

  /* ─── REGISTER ────────────────────────────────────────────── */
  registerModule('review', {
    render: render,
    cleanup: cleanup
  });
})();
