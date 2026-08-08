/* ═══════════════════════════════════════════════════════════════
   MODULE: practice — 听写实战（分级难度，逐轮提升）
   ═══════════════════════════════════════════════════════════════ */
(function(){

  /* ─── POOL HELPERS ──────────────────────────────────────── */
  function buildPool(filter, count, customItems){
    if(customItems){
      const shuffled = [...customItems].sort(()=>Math.random()-0.5);
      return shuffled.slice(0, count).map(py => {
        for(const c of ['shengmu','yunmu','zhengti']){
          if(PINYIN_DATA[c].includes(py)) return {pinyin: py, category: c};
        }
        return {pinyin: py, category: 'yunmu'};
      });
    }
    const all = [];
    for(const c of ['shengmu','yunmu','zhengti'])
      PINYIN_DATA[c].forEach(py => all.push({pinyin: py, category: c}));
    const pool = filter === 'all' ? [...all] : all.filter(p => p.category === filter);
    return pool.sort(()=>Math.random()-0.5).slice(0, count);
  }

  function getUnknownPool(){
    try{
      const data = JSON.parse(localStorage.getItem('diagResults') || 'null');
      if(!data) return null;
      const unknown = [];
      for(const cat of ['shengmu','yunmu','zhengti']){
        if(data[cat]){
          for(const [py, status] of Object.entries(data[cat])){
            if(status === 'unknown') unknown.push(py);
          }
        }
      }
      return unknown.length > 0 ? unknown : null;
    }catch(e){ return null; }
  }

  /* ─── ROUND DEFINITIONS ────────────────────────────────── */
  const ROUNDS = [
    {
      id: 1, name: '声母入门', icon: '🔤',
      desc: '单个声母听写，掌握基础发音',
      color: '#6366f1',
      build: () => buildPool('shengmu', 5)
    },
    {
      id: 2, name: '韵母基础', icon: '🎵',
      desc: '单个韵母听写，巩固韵母识别',
      color: '#22c55e',
      build: () => buildPool('yunmu', 5)
    },
    {
      id: 3, name: '简单音节', icon: '📖',
      desc: '随机拼音综合听写，提升反应速度',
      color: '#f59e0b',
      build: () => buildPool('all', 5)
    },
    {
      id: 4, name: '复韵母进阶', icon: '🌊',
      desc: '复韵母专项练习，突破难点',
      color: '#ef4444',
      build: () => buildPool('yunmu', 5, ['ai','ei','ui','ao','ou','iu','ie','ve','er'])
    },
    {
      id: 5, name: '薄弱点专项', icon: '🎯',
      desc: '针对薄弱点强化训练，精准提升',
      color: '#8b5cf6',
      build: () => {
        const unknown = getUnknownPool();
        if(unknown) return buildPool('all', 5, unknown);
        return buildPool('all', 5);
      }
    }
  ];

  /* ─── REGISTER MODULE ──────────────────────────────────── */
  registerModule('practice', {
    render: function(container){
      const cardsHtml = ROUNDS.map(r => `
        <button class="pr-card" data-round="${r.id}" style="--pr-color:${r.color}">
          <div class="pr-num">${r.id}</div>
          <div class="pr-icon">${r.icon}</div>
          <div class="pr-name">${r.name}</div>
          <div class="pr-desc">${r.desc}</div>
          <div class="pr-count">✅ 5题</div>
        </button>
      `).join('');

      container.innerHTML = `
        <style>
          .pr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-top:4px}
          .pr-card{
            display:flex;flex-direction:column;align-items:center;gap:6px;
            padding:clamp(16px,3vw,24px);border-radius:16px;border:2px solid #e2e8f0;
            background:#fff;cursor:pointer;transition:all .25s;position:relative;
            -webkit-tap-highlight-color:transparent
          }
          .pr-card:active{transform:scale(.95)}
          .pr-card:hover{border-color:var(--pr-color);box-shadow:0 4px 16px rgba(0,0,0,.06);transform:translateY(-2px)}
          .pr-num{
            position:absolute;top:-8px;left:-8px;width:28px;height:28px;border-radius:50%;
            background:var(--pr-color);color:#fff;font-size:14px;font-weight:800;
            display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15)
          }
          .pr-icon{font-size:clamp(28px,6vw,36px)}
          .pr-name{font-size:15px;font-weight:700;color:#1e293b}
          .pr-desc{font-size:12px;color:#94a3b8;text-align:center;line-height:1.4}
          .pr-count{font-size:11px;color:var(--pr-color);font-weight:700}
        </style>
        <div class="section-title">📝 听写实战</div>
        <div class="section-subtitle">分级难度，逐轮提升</div>
        <div class="pr-grid">${cardsHtml}</div>
      `;

      container.querySelectorAll('.pr-card').forEach(card => {
        card.addEventListener('click', function(){
          const roundId = parseInt(this.dataset.round);
          const round = ROUNDS.find(r => r.id === roundId);
          if(!round) return;

          const pool = round.build();

          window.__dictRound = {
            filter: roundId <= 2 ? (roundId === 1 ? 'shengmu' : 'yunmu') : 'all',
            label: round.name,
            pool: pool,
            count: pool.length,
            noCert: true
          };

          if(window.switchPage) window.switchPage('dictation');
        });
      });
    },
    cleanup: function(){}
  });
})();
