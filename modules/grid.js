/* ═══════════════════════════════════════════════════════════════
   MODULE: grid — 声母/韵母/整体认读 卡片点读
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentGrid = 'shengmu';
  let currentAudio = null;
  let shuffledOrder = {}; // {category: [shuffled items]}
  let shuffleEnabled = false;

  /* ─── TABS ──────────────────────────────────────────────── */
  const TABS = [
    {id:'shengmu',label:'🔤 声母',count:23},
    {id:'yunmu',  label:'🎵 韵母',count:24},
    {id:'zhengti',label:'📖 整体认读',count:16}
  ];

  /* ─── PLAY AUDIO ────────────────────────────────────────── */
  function playPinyin(py){
    if(window.api && typeof window.api.track === 'function') window.api.track(currentGrid || 'grid', py);
    if(currentAudio){ currentAudio.pause(); currentAudio=null }
    const a = new Audio();
    a.src = `../audio/${py}.mp3`;
    currentAudio = a;
    return new Promise(r=>{
      let done = false;
      function resolveOnce(){ if(!done){ done=true; r() }}
      a.onended = resolveOnce;
      a.onerror = resolveOnce;
      a.play().catch(resolveOnce);
      setTimeout(resolveOnce, 6000);
    });
  }

  /* ─── SHUFFLE ───────────────────────────────────────────── */
  function shuffleArray(arr){
    const a = [...arr];
    for(let i=a.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function getDisplayOrder(category){
    const items = PINYIN_DATA[category];
    if(shuffleEnabled && shuffledOrder[category]){
      return shuffledOrder[category].map(i => ({item:i, idx:items.indexOf(i)}));
    }
    return items.map((i,idx) => ({item:i, idx}));
  }

  function toggleShuffle(container){
    shuffleEnabled = !shuffleEnabled;
    if(shuffleEnabled){
      const items = PINYIN_DATA[currentGrid];
      shuffledOrder[currentGrid] = shuffleArray(items);
    } else {
      delete shuffledOrder[currentGrid];
    }
    renderGridCards(container);
    updateShuffleBtn(container);
  }

  function updateShuffleBtn(container){
    const btn = container.querySelector('#shuffleBtn');
    if(!btn) return;
    if(shuffleEnabled){
      btn.classList.add('active');
      btn.innerHTML = '🔀 已打乱';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '🔀 打乱顺序';
    }
  }

  /* ─── RENDER GRID ───────────────────────────────────────── */
  function renderGrid(container, category){
    currentGrid = category;
    const items = PINYIN_DATA[category];
    const tabHtml = TABS.map(t=>
      `<button class="grid-tab${t.id===category?' active':''}" data-tab="${t.id}">${t.label} <span class="tab-count">${t.count}</span></button>`
    ).join('');

    container.innerHTML = `
      <style>
        .grid-tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
        .grid-tabs::-webkit-scrollbar{display:none}
        .grid-tab{
          flex-shrink:0;padding:8px 18px;border:none;border-radius:8px 8px 0 0;
          font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;
          transition:all .2s;position:relative;white-space:nowrap
        }
        .grid-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
        .grid-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
        .grid-tab.active::after{content:'';position:absolute;bottom:0;left:15%;right:15%;height:3px;background:#6366f1;border-radius:3px 3px 0 0}
        .grid-tab .tab-count{font-size:11px;color:#94a3b8;margin-left:4px}
        .grid-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;flex-wrap:wrap}
        .section-title{margin-bottom:0}
        .shuffle-btn{
          padding:6px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;
          font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;
          display:inline-flex;align-items:center;gap:4px;white-space:nowrap
        }
        .shuffle-btn:hover{border-color:#a5b4fc;color:#6366f1}
        .shuffle-btn.active{background:#eef2ff;color:#6366f1;border-color:#a5b4fc}
      </style>
      <div class="grid-actions">
        <div>
          <div class="section-title">🔤 拼音卡片</div>
          <div class="section-subtitle" style="margin-top:2px">点击卡片听发音，切换分类卡片</div>
        </div>
        <button class="shuffle-btn" id="shuffleBtn">${shuffleEnabled ? '🔀 已打乱' : '🔀 打乱顺序'}</button>
      </div>
      <div class="grid-tabs">${tabHtml}</div>
      <div class="pinyin-grid" id="pinyinGrid"></div>
    `;

    renderGridCards(container);

    // Shuffle button
    container.querySelector('#shuffleBtn').addEventListener('click',function(){
      toggleShuffle(container);
    });

    // Tab clicks
    container.querySelectorAll('.grid-tab').forEach(tab=>{
      tab.addEventListener('click',function(){
        // Switch tab — reset shuffle state for new tab
        shuffleEnabled = false;
        delete shuffledOrder[currentGrid];
        renderGrid(container, this.dataset.tab);
      });
    });

    // Card clicks
    attachCardClicks(container);
  }

  function renderGridCards(container){
    const order = getDisplayOrder(currentGrid);
    const cardHtml = order.map(({item}) =>
      `<button class="pinyin-card ${currentGrid}" data-py="${item}">
        <span class="pinyin-text">${dn(item)}</span>
        <span class="play-icon">▶</span>
      </button>`
    ).join('');
    const grid = container.querySelector('#pinyinGrid');
    if(grid) grid.innerHTML = cardHtml;
    attachCardClicks(container);
  }

  function attachCardClicks(container){
    container.querySelectorAll('.pinyin-card').forEach(el=>{
      el.addEventListener('click',function(){
        const g = container.querySelector('#pinyinGrid');
        g.querySelectorAll('.pinyin-card').forEach(c=>c.classList.remove('playing'));
        this.classList.add('playing');
        playPinyin(this.dataset.py).then(()=>this.classList.remove('playing'));
      });
    });
  }

  /* ─── MODULE API ────────────────────────────────────────── */
  registerModule('shengmu', {
    render: function(container){ renderGrid(container,'shengmu'); },
    cleanup: function(){ if(currentAudio){ currentAudio.pause(); currentAudio=null }}
  });
  registerModule('yunmu', {
    render: function(container){ renderGrid(container,'yunmu'); },
    cleanup: function(){ if(currentAudio){ currentAudio.pause(); currentAudio=null }}
  });
  registerModule('zhengti', {
    render: function(container){ renderGrid(container,'zhengti'); },
    cleanup: function(){ if(currentAudio){ currentAudio.pause(); currentAudio=null }}
  });
})();
