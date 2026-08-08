/* ═══════════════════════════════════════════════════════════════
   MODULE: tones — 韵母声调听读练习
   布局：选韵母 → 显示四声 → 点击播放
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  let currentAudio = null;
  let currentFinal = 'a';
  let shuffleActive = false;
  let shuffledFinals = [];

  const FINALS = ['a','o','e','i','u','v','ai','ei','ui','ao','ou','iu','ie','ve','er','an','en','in','un','vn','ang','eng','ing','ong'];

  const TONE_INFO = [
    {num:1, name:'一声', alt:'阴平', symbol:'—', desc:'一声平'},
    {num:2, name:'二声', alt:'阳平', symbol:'／', desc:'二声扬'},
    {num:3, name:'三声', alt:'上声', symbol:'∨', desc:'三声拐弯'},
    {num:4, name:'四声', alt:'去声', symbol:'\\', desc:'四声降'}
  ];

  function dn(py){ return py.replace('v','ü') }

  const TONE_MAP = {
    'a':['ā','á','ǎ','à'], 'o':['ō','ó','ǒ','ò'], 'e':['ē','é','ě','è'],
    'i':['ī','í','ǐ','ì'], 'u':['ū','ú','ǔ','ù'], 'v':['ǖ','ǘ','ǚ','ǜ']
  };

  function addToneMark(py, tone){
    const idx = tone - 1;
    let target = '';
    if(py.includes('a')) target = 'a';
    else if(py.includes('e')) target = 'e';
    else if(py.includes('o')) target = 'o';
    else if(py.includes('iu')) target = 'u';
    else if(py.includes('ui')) target = 'i';
    else if(py.includes('ou')) target = 'o';
    else if(py.includes('ie')) target = 'e';
    else if(py.includes('ve')) target = 'e';
    else if(py.includes('vn')) target = 'v';
    else if(py.includes('in')) target = 'i';
    else if(py.includes('un')) target = 'u';
    else if(py.includes('ing')) target = 'i';
    else if(py.includes('eng')) target = 'e';
    else if(py.includes('ang')) target = 'a';
    else if(py.includes('ong')) target = 'o';
    else if(py.includes('er')) target = 'e';
    else {
      const v = py.match(/[aeiouv]/g);
      if(v) target = v[v.length-1];
    }
    if(!target || !TONE_MAP[target]) return dn(py) + tone;
    return dn(py.replace(target, TONE_MAP[target][idx]));
  }

  function playTone(final, tone){
    if(currentAudio){ currentAudio.pause(); currentAudio=null }
    const a = new Audio(`audio/tones/${final}${tone}.mp3`);
    currentAudio = a;
    return new Promise(r=>{
      let done=false;
      function once(){if(!done){done=true;r()}}
      a.onended=once; a.onerror=once;
      a.play().catch(once);
      setTimeout(once,4000);
    });
  }

  function render(container){
    currentFinal = 'a';

    const STYLE_ID = 'tone-style';
    if(!document.getElementById(STYLE_ID)){
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = `
        .tn-section-title{font-size:clamp(14px,3.5vw,16px);font-weight:700;color:#6366f1;margin:0 0 4px;padding-left:4px}
        .tn-section-sub{font-size:clamp(11px,2.8vw,13px);color:#94a3b8;margin-bottom:10px;padding-left:4px}
        .tn-teach{
          background:#eef2ff;border-radius:12px;padding:10px 14px;
          margin-bottom:12px;border:1px solid #e0e7ff;font-size:13px;line-height:1.6;
          display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px
        }
        .tn-teach b{color:#4f46e5;font-weight:700}
        .tn-sym{display:inline-block;width:20px;text-align:center;font-size:16px;font-weight:700;color:#6366f1}
        .tn-tag{font-size:11px;color:#64748b;background:#fff;padding:1px 8px;border-radius:4px;white-space:nowrap}
        .tn-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:4px}
        .tn-shuffle-btn{
          padding:5px 12px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;
          font-size:12px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;
          display:inline-flex;align-items:center;gap:3px;white-space:nowrap;flex-shrink:0
        }
        .tn-shuffle-btn:hover{border-color:#a5b4fc;color:#6366f1}
        .tn-shuffle-btn.active{background:#eef2ff;color:#6366f1;border-color:#a5b4fc}
        .tn-final-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:5px;margin-bottom:14px}
        .tn-final-btn{
          padding:8px 4px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;
          cursor:pointer;text-align:center;font-size:16px;font-weight:700;color:#1e293b;
          transition:all .15s
        }
        .tn-final-btn:hover{border-color:#a5b4fc;color:#6366f1}
        .tn-final-btn.active{background:#6366f1;color:#fff;border-color:#6366f1}
        .tn-final-btn:active{transform:scale(.9)}
        .tn-tone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;animation:fadeSlide .25s ease}
        .tn-tone-card{
          background:#fff;border-radius:16px;padding:16px 8px 14px;
          box-shadow:0 2px 8px rgba(0,0,0,.05);text-align:center;
          cursor:pointer;transition:all .15s;border:2px solid transparent;
          display:flex;flex-direction:column;align-items:center;gap:6px
        }
        .tn-tone-card:hover{border-color:#c7d2fe;transform:translateY(-2px)}
        .tn-tone-card:active{transform:scale(.93)}
        .tn-tone-card.playing{background:#6366f1;color:#fff;border-color:#6366f1}
        .tn-tone-card .tn-char{font-size:clamp(32px,8vw,48px);font-weight:800;color:#6366f1;line-height:1}
        .tn-tone-card.playing .tn-char{color:#fff}
        .tn-tone-card .tn-name{font-size:13px;font-weight:700;color:#1e293b}
        .tn-tone-card.playing .tn-name{color:#fff}
        .tn-tone-card .tn-alt{font-size:11px;color:#94a3b8}
        .tn-tone-card.playing .tn-alt{color:rgba(255,255,255,.7)}
        .tn-empty{text-align:center;padding:40px 20px;color:#94a3b8;font-size:14px}
      `;
      document.head.appendChild(s);
    }

    renderMain(container);
  }

  function renderMain(container){
    // Get display order for finals
    let finalList = [...FINALS];
    if(shuffleActive && shuffledFinals.length > 0) finalList = shuffledFinals;

    // 四个声调字符
    const toneChars = [1,2,3,4].map(t => addToneMark(currentFinal, t));

    container.innerHTML = `
      <div class="tn-header">
        <div>
          <div class="tn-section-title">🎵 声调练习</div>
          <div class="tn-section-sub">选韵母 → 点声调 → 听发音</div>
        </div>
        <button class="tn-shuffle-btn" id="tnShuffleBtn">${shuffleActive ? '🔀 已打乱' : '🔀 打乱顺序'}</button>
      </div>

      <div class="tn-teach">
        <span><span class="tn-sym">—</span><b>一声平</b></span>
        <span><span class="tn-sym">／</span><b>二声扬</b></span>
        <span><span class="tn-sym">∨</span><b>三声拐弯</b></span>
        <span><span class="tn-sym">＼</span><b>四声降</b></span>
        <span class="tn-tag">一声平而高 · 二声往上爬 · 三声拐一拐 · 四声往下降</span>
      </div>

      <div class="tn-final-grid" id="tnFinalGrid">
        ${finalList.map(f=>`
          <button class="tn-final-btn${f===currentFinal?' active':''}" data-final="${f}">${dn(f)}</button>
        `).join('')}
      </div>

      <div class="tn-tone-grid" id="tnToneGrid">
        ${TONE_INFO.map((t,i)=>`
          <div class="tn-tone-card" data-final="${currentFinal}" data-tone="${t.num}">
            <div class="tn-char">${toneChars[i]}</div>
            <div class="tn-name">${t.name}</div>
            <div class="tn-alt">${t.alt} · ${t.desc}</div>
          </div>
        `).join('')}
      </div>
    `;

    // 打乱按钮
    container.querySelector('#tnShuffleBtn').addEventListener('click', function(){
      shuffleActive = !shuffleActive;
      if(shuffleActive){
        shuffledFinals = [...FINALS].sort(()=>Math.random()-0.5);
        this.classList.add('active');
        this.innerHTML = '🔀 已打乱';
      } else {
        shuffledFinals = [];
        this.classList.remove('active');
        this.innerHTML = '🔀 打乱顺序';
      }
      // 刷新韵母网格
      const grid = container.querySelector('#tnFinalGrid');
      const list = shuffleActive ? shuffledFinals : FINALS;
      grid.innerHTML = list.map(f=>
        `<button class="tn-final-btn${f===currentFinal?' active':''}" data-final="${f}">${dn(f)}</button>`
      ).join('');
      // 重新绑定韵母点击
      attachFinalClicks(container);
    });

    // 韵母点击
    attachFinalClicks(container);
    attachToneClicks(container);
  }

  function attachFinalClicks(container){
    container.querySelector('#tnFinalGrid').addEventListener('click', e=>{
      const btn = e.target.closest('.tn-final-btn');
      if(!btn || btn.classList.contains('active')) return;
      currentFinal = btn.dataset.final;
      container.querySelectorAll('.tn-final-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      // 重新渲染四声卡片
      const chars = [1,2,3,4].map(t => addToneMark(currentFinal, t));
      const grid = container.querySelector('#tnToneGrid');
      grid.innerHTML = TONE_INFO.map((t,i)=>`
        <div class="tn-tone-card" data-final="${currentFinal}" data-tone="${t.num}">
          <div class="tn-char">${chars[i]}</div>
          <div class="tn-name">${t.name}</div>
          <div class="tn-alt">${t.alt} · ${t.desc}</div>
        </div>
      `).join('');
      attachToneClicks(container);
    });
  }

  function attachToneClicks(container){
    container.querySelectorAll('.tn-tone-card').forEach(card=>{
      card.addEventListener('click', function(){
        const f = this.dataset.final;
        const t = parseInt(this.dataset.tone);
        container.querySelectorAll('.tn-tone-card').forEach(c=>c.classList.remove('playing'));
        this.classList.add('playing');
        playTone(f, t);
      });
    });
  }

  registerModule('tones', {
    render: render,
    cleanup: function(){
      if(currentAudio){ currentAudio.pause(); currentAudio=null }
      const s = document.getElementById('tone-style');
      if(s) s.remove();
    }
  });

})();
