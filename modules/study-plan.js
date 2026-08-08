/* ═══════════════════════════════════════════════════════════════
   MODULE: study-plan — 学习计划首页（4阶段总览）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  const STAGES = [
    {id:'diagnosis', icon:'🔍', name:'快速诊断', desc:'扫盲定位薄弱点', time:'约2分钟', color:'#f59e0b'},
    {id:'contrast', icon:'⚡', name:'对比精学', desc:'攻克易混拼音对', time:'约5分钟', color:'#22c55e'},
    {id:'practice', icon:'📝', name:'听写实战', desc:'分级难度逐轮提升', time:'3-10分钟', color:'#6366f1'},
    {id:'review', icon:'✅', name:'查漏补缺', desc:'薄弱项针对性补练', time:'约2分钟', color:'#ef4444'}
  ];

  registerModule('study-plan', {
    render: function(container){
      const cardsHtml = STAGES.map((s,i)=>`
        <button class="sp-card" data-page="${s.id}" style="--card-color:${s.color}">
          <div class="sp-step">${i+1}</div>
          <div class="sp-icon">${s.icon}</div>
          <div class="sp-name">${s.name}</div>
          <div class="sp-desc">${s.desc}</div>
          <div class="sp-time">⏱ ${s.time}</div>
        </button>
      `).join('');

      container.innerHTML = `
        <style>
          .sp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-top:4px}
          .sp-card{
            display:flex;flex-direction:column;align-items:center;gap:6px;
            padding:clamp(16px,3vw,24px);border-radius:16px;border:2px solid #e2e8f0;
            background:#fff;cursor:pointer;transition:all .25s;position:relative;
            -webkit-tap-highlight-color:transparent
          }
          .sp-card:active{transform:scale(.95)}
          .sp-card:hover{border-color:var(--card-color);box-shadow:0 4px 16px rgba(0,0,0,.06);transform:translateY(-2px)}
          .sp-step{
            position:absolute;top:-8px;left:-8px;width:28px;height:28px;border-radius:50%;
            background:var(--card-color);color:#fff;font-size:14px;font-weight:800;
            display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15)
          }
          .sp-icon{font-size:clamp(28px,6vw,36px)}
          .sp-name{font-size:15px;font-weight:700;color:#1e293b}
          .sp-desc{font-size:12px;color:#94a3b8;text-align:center;line-height:1.4}
          .sp-time{font-size:11px;color:var(--card-color);font-weight:700}
          .sp-total{
            margin-top:16px;padding:12px 16px;background:#fff;border-radius:12px;
            border:1px solid #e2e8f0;display:flex;align-items:center;gap:10px;font-size:13px;color:#64748b
          }
          .sp-total .bar{flex:1;height:6px;border-radius:3px;background:#e2e8f0;overflow:hidden}
          .sp-total .bar-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#6366f1,#22c55e);transition:width .4s;width:0%}
        </style>
        <div class="section-title">⚡ 快速复习</div>
        <div class="section-subtitle">四步循环，从诊断到巩固</div>
        <div class="sp-grid">${cardsHtml}</div>
        <div class="sp-total">
          <span>🏁 完成进度</span>
          <div class="bar"><div class="bar-fill"></div></div>
          <span>0 / 4</span>
        </div>
      `;

      // Card clicks → navigate
      container.querySelectorAll('.sp-card').forEach(card=>{
        card.addEventListener('click',function(){
          const page = this.dataset.page;
          if(page && window.switchPage) window.switchPage(page);
        });
      });
    },
    cleanup: function(){}
  });
})();
