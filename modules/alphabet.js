/* ═══════════════════════════════════════════════════════════════
   MODULE: alphabet — 字母认读（与拼音听读同款风格）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentAudio = null;
  let shuffledOrder = {};
  let shuffleEnabled = false;

  const TABS = [
    {id:'all',       label:'🔤 全部', count:26},
    {id:'vowel',     label:'🎵 元音', count:5},
    {id:'consonant', label:'📖 辅音', count:21}
  ];

  function getFilteredData(filter){
    if(filter === 'all') return ALPHABET_DATA;
    if(filter === 'vowel') return ALPHABET_DATA.filter(d=>d.vowel);
    return ALPHABET_DATA.filter(d=>!d.vowel);
  }

  function playLetter(letter){
    if(window.api && typeof window.api.track === 'function') window.api.track('alphabet', letter.toLowerCase());
    if(currentAudio){currentAudio.pause();currentAudio=null}
    const a = new Audio('audio/en/'+letter.toLowerCase()+'.mp3');
    currentAudio = a;
    return new Promise(r=>{
      let done=false;
      function once(){if(!done){done=true;r()}}
      a.onended=once; a.onerror=once;
      a.play().catch(once);
      setTimeout(once,6000);
    });
  }

  function shuffleArray(arr){
    const a = [...arr];
    for(let i=a.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function getDisplayItems(filter){
    const items = getFilteredData(filter);
    if(shuffleEnabled && shuffledOrder[filter]) return shuffledOrder[filter];
    return items;
  }

  function renderGrid(container, filter){
    const items = getDisplayItems(filter);
    const grid = container.querySelector('#alphaGrid');
    if(!grid) return;

    grid.innerHTML = items.map(d=>{
      const isVowel = d.vowel;
      const borderColor = isVowel ? '#ef4444' : '#3b82f6';
      const badge = isVowel ? '元音' : '辅音';
      const badgeColor = isVowel ? '#ef4444' : '#3b82f6';
      return `<button class="pinyin-card alpha-card" data-letter="${d.letter}"
        style="border-left:4px solid ${borderColor}">
        <span class="alpha-badge" style="background:${badgeColor}12;color:${badgeColor};border:1px solid ${badgeColor}25">${badge}</span>
        <span class="alpha-letters">${d.letter}${d.letter.toLowerCase()}</span>
        <span class="alpha-emoji">${d.emoji}</span>
        <span class="alpha-word">${d.word}</span>
      </button>`;
    }).join('');

    grid.querySelectorAll('.alpha-card').forEach(el=>{
      el.addEventListener('click', function(){
        grid.querySelectorAll('.alpha-card').forEach(c=>c.classList.remove('playing'));
        this.classList.add('playing');
        playLetter(this.dataset.letter).then(()=>this.classList.remove('playing'));
      });
    });
  }

  function renderCategory(container, filter){
    const tabs = container.querySelectorAll('.alpha-tab');
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.filter===filter));
    renderGrid(container, filter);
  }

  registerModule('alphabet', {
    render: function(container){
      container.innerHTML = `
        <style>
          .alpha-tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
          .alpha-tabs::-webkit-scrollbar{display:none}
          .alpha-tab{
            flex-shrink:0;padding:8px 18px;border:none;border-radius:8px 8px 0 0;
            font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;
            transition:all .2s;position:relative;white-space:nowrap
          }
          .alpha-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
          .alpha-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
          .alpha-tab.active::after{content:'';position:absolute;bottom:0;left:15%;right:15%;height:3px;background:#6366f1;border-radius:3px 3px 0 0}
          .alpha-tab .tab-count{font-size:11px;color:#94a3b8;margin-left:4px}
          .alpha-card{position:relative;padding-top:14px;padding-bottom:14px;min-height:clamp(80px,20vw,110px);gap:2px}
          .alpha-card.playing{background:#6366f1;color:#fff;transform:scale(1.05);box-shadow:0 4px 16px rgba(99,102,241,.35)}
          .alpha-card.playing .alpha-letters{color:inherit}
          .alpha-card.playing .alpha-word{color:rgba(255,255,255,.7)}
          .alpha-card.playing .alpha-badge{background:rgba(255,255,255,.2)!important;color:rgba(255,255,255,.8)!important;border-color:rgba(255,255,255,.3)!important}
          .alpha-badge{position:absolute;top:4px;right:4px;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;line-height:1.4}
          .alpha-letters{font-size:clamp(22px,5.5vw,30px);font-weight:800;line-height:1.1}
          .alpha-emoji{font-size:clamp(18px,4.5vw,24px);line-height:1.2}
          .alpha-word{font-size:clamp(10px,2.5vw,12px);color:#94a3b8;font-weight:600;text-transform:lowercase}
          .alpha-card:active{transform:scale(.92)}
          .alpha-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px}
          .shuffle-btn{
            padding:6px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;
            font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;
            display:inline-flex;align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;margin-top:2px
          }
          .shuffle-btn:hover{border-color:#a5b4fc;color:#6366f1}
          .shuffle-btn.active{background:#eef2ff;color:#6366f1;border-color:#a5b4fc}
        </style>
        <div class="alpha-head">
          <div>
            <div class="section-title">🃏 字母认读</div>
            <div class="section-subtitle" style="margin-top:2px">点击卡片听发音，切换分类</div>
          </div>
          <button class="shuffle-btn" id="alphaShuffleBtn">🔀 打乱顺序</button>
        </div>
        <div class="alpha-tabs" id="alphaTabs"></div>
        <div class="pinyin-grid" id="alphaGrid"></div>
      `;

      // Tabs
      const tabsEl = container.querySelector('#alphaTabs');
      tabsEl.innerHTML = TABS.map(t=>
        `<button class="alpha-tab${t.id==='all'?' active':''}" data-filter="${t.id}">${t.label} <span class="tab-count">${t.count}</span></button>`
      ).join('');
      tabsEl.querySelectorAll('.alpha-tab').forEach(tab=>{
        tab.addEventListener('click', function(){
          const filter = this.dataset.filter;
          tabsEl.querySelectorAll('.alpha-tab').forEach(t=>t.classList.remove('active'));
          this.classList.add('active');
          shuffleEnabled = false;
          const sb = container.querySelector('#alphaShuffleBtn');
          if(sb){ sb.classList.remove('active'); sb.innerHTML = '🔀 打乱顺序'; }
          renderGrid(container, filter);
        });
      });

      // Shuffle button
      const sb = container.querySelector('#alphaShuffleBtn');
      sb.addEventListener('click', function(){
        shuffleEnabled = !shuffleEnabled;
        const currentFilter = container.querySelector('.alpha-tab.active').dataset.filter;
        if(shuffleEnabled){
          shuffledOrder[currentFilter] = shuffleArray(getFilteredData(currentFilter));
          sb.classList.add('active');
          sb.innerHTML = '🔀 已打乱';
        } else {
          shuffledOrder = {};
          sb.classList.remove('active');
          sb.innerHTML = '🔀 打乱顺序';
        }
        renderGrid(container, currentFilter);
      });

      // Render default
      renderGrid(container, 'all');
    },
    cleanup: function(){
      if(currentAudio){currentAudio.pause();currentAudio=null}
    }
  });
})();
