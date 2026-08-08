/* ═══════════════════════════════════════════════════════════════
   MODULE: listening — 听读（声母/韵母/整体认读 统一页面）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentAudio = null;
  let shuffledOrder = {};
  let shuffleEnabled = false;

  const TABS = [
    {id:'shengmu',label:'🔤 声母',count:23},
    {id:'yunmu',  label:'🎵 韵母',count:24},
    {id:'zhengti',label:'📖 整体认读',count:16}
  ];

  function playPinyin(py){
    if(currentAudio){ currentAudio.pause(); currentAudio=null }
    const a = new Audio(`../audio/${py}.mp3`);
    currentAudio = a;
    return new Promise(r=>{
      let done=false;
      function once(){if(!done){done=true;r()}}
      a.onended=once; a.onerror=once;
      a.play().catch(once);
      setTimeout(once,6000);
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

  function getDisplayItems(cat){
    const items = PINYIN_DATA[cat];
    if(shuffleEnabled && shuffledOrder[cat]) return shuffledOrder[cat];
    return items;
  }

  function renderGrid(container, cat){
    const items = getDisplayItems(cat);
    const gridId = 'listenGrid';
    const grid = container.querySelector('#'+gridId);
    if(!grid) return;
    grid.innerHTML = items.map(py=>
      `<button class="pinyin-card ${cat}" data-py="${py}">
        <span class="pinyin-text">${dn(py)}</span>
        <span class="play-icon">▶</span>
      </button>`
    ).join('');
    grid.querySelectorAll('.pinyin-card').forEach(el=>{
      el.addEventListener('click',function(){
        grid.querySelectorAll('.pinyin-card').forEach(c=>c.classList.remove('playing'));
        this.classList.add('playing');
        playPinyin(this.dataset.py).then(()=>this.classList.remove('playing'));
        if(window.api && window.api.isLoggedIn()){
          window.api.logListening(cat, this.dataset.py).catch(()=>{});
        }
      });
    });
  }

  function renderCategory(container, cat){
    const tabs = container.querySelectorAll('.listen-tab');
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.cat===cat));
    renderGrid(container, cat);
  }

  registerModule('listening', {
    render: function(container){
      const tabHtml = TABS.map(t=>
        `<button class="listen-tab${t.id==='shengmu'?' active':''}" data-cat="${t.id}">${t.label} <span class="tab-count">${t.count}</span></button>`
      ).join('');
      container.innerHTML = `
        <style>
          .listen-tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
          .listen-tabs::-webkit-scrollbar{display:none}
          .listen-tab{
            flex-shrink:0;padding:8px 18px;border:none;border-radius:8px 8px 0 0;
            font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;
            transition:all .2s;position:relative;white-space:nowrap
          }
          .listen-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
          .listen-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
          .listen-tab.active::after{content:'';position:absolute;bottom:0;left:15%;right:15%;height:3px;background:#6366f1;border-radius:3px 3px 0 0}
          .listen-tab .tab-count{font-size:11px;color:#94a3b8;margin-left:4px}
          .listen-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px}
          .shuffle-btn{
            padding:6px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;
            font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;
            display:inline-flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;margin-top:2px
          }
          .shuffle-btn:hover{border-color:#a5b4fc;color:#6366f1}
          .shuffle-btn.active{background:#eef2ff;color:#6366f1;border-color:#a5b4fc}
        </style>
        <div class="listen-head">
          <div>
            <div class="section-title">👂 听读</div>
            <div class="section-subtitle" style="margin-top:2px">点击卡片听发音，切换分类</div>
          </div>
          <button class="shuffle-btn" id="shuffleBtn">🔀 打乱顺序</button>
        </div>
        <div class="listen-tabs">${tabHtml}</div>
        <div class="pinyin-grid" id="listenGrid"></div>
      `;

      // Shuffle button
      const sb = container.querySelector('#shuffleBtn');
      sb.addEventListener('click', function(){
        shuffleEnabled = !shuffleEnabled;
        if(shuffleEnabled){
          const currentCat = container.querySelector('.listen-tab.active').dataset.cat;
          shuffledOrder[currentCat] = shuffleArray(PINYIN_DATA[currentCat]);
          sb.classList.add('active');
          sb.innerHTML = '🔀 已打乱';
        } else {
          shuffledOrder = {};
          sb.classList.remove('active');
          sb.innerHTML = '🔀 打乱顺序';
        }
        const currentCat = container.querySelector('.listen-tab.active').dataset.cat;
        renderGrid(container, currentCat);
      });

      // Tab clicks
      container.querySelectorAll('.listen-tab').forEach(tab=>{
        tab.addEventListener('click',function(){
          const cat = this.dataset.cat;
          // Reset shuffle when switching tabs
          shuffleEnabled = false;
          const sb = container.querySelector('#shuffleBtn');
          sb.classList.remove('active');
          sb.innerHTML = '🔀 打乱顺序';
          renderCategory(container, cat);
        });
      });

      // Render default category
      renderCategory(container, 'shengmu');
    },
    cleanup: function(){
      if(currentAudio){ currentAudio.pause(); currentAudio=null }
    }
  });
})();
