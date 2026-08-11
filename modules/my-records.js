/* ═══════════════════════════════════════════════════════════════
   MY-RECORDS — 学习者自己的学习记录页面
   登录后可见，展示自己的听读/听写/诊断记录 + 活跃度
   ═══════════════════════════════════════════════════════════════ */
(function(){
  const STYLE_ID = 'myrec-styles';
  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .mr-wrap{width:100%;max-width:760px;margin:0 auto;padding:8px 4px 32px}
      .mr-title{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
      .mr-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
      .mr-sec{font-size:13px;font-weight:700;color:#64748b;margin:0 0 10px;display:flex;align-items:center;gap:6px}
      .mr-sec .bar{flex:1;height:1px;background:#e2e8f0}
      .mr-stat{display:inline-flex;flex-direction:column;align-items:center;gap:2px;font-size:12px;font-weight:600;color:#6366f1;background:#eef2ff;border-radius:10px;padding:8px 14px;margin:3px}
      .mr-stat b{font-size:20px;color:#4338ca}
      .mr-chip{display:inline-block;font-size:12px;border-radius:6px;padding:2px 8px;margin:2px;background:#f1f5f9;color:#475569}
      .mr-chip.good{background:#dcfce7;color:#16a34a}
      .mr-chip.bad{background:#fee2e2;color:#dc2626}
      .mr-chip.warn{background:#fef9c3;color:#ca8a04}
      .mr-empty{text-align:center;color:#94a3b8;font-size:13px;padding:18px 0}
      .mr-session{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#fafafa}
      .mr-session-head{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:#334155}
      .mr-detail-item{display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px dashed #f1f5f9;font-size:14px}
      .mr-detail-item:last-child{border-bottom:none}
      .mr-weak{display:inline-block;font-size:12px;border-radius:6px;padding:3px 10px;margin:3px;background:#fee2e2;color:#dc2626;font-weight:600}
      .mr-hint{text-align:center;color:#94a3b8;font-size:13px;padding:30px 16px}
      .mr-hint .big{font-size:42px;margin-bottom:10px}
      .mr-login-btn{display:inline-block;margin-top:14px;padding:10px 28px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
    `;
    document.head.appendChild(s);
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderNotLoggedIn(c){
    c.innerHTML = `
      <div class="mr-wrap">
        <div class="mr-card">
          <div class="mr-hint">
            <div class="big">🔑</div>
            <div>登录后可以查看自己的学习记录</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:6px">听读了哪些、听写对错、薄弱项一目了然</div>
            <button class="mr-login-btn" id="mrGoLogin">去登录</button>
          </div>
        </div>
      </div>
    `;
    c.querySelector('#mrGoLogin').addEventListener('click', ()=>{ if(window.showAuth) window.showAuth() });
  }

  function renderStats(c, data){
    const u = window.api.getUser ? window.api.getUser() : null;
    const uname = u ? (u.display_name || u.username) : '';
    const dc = {};
    (data.diag||[]).forEach(g=>{ dc[g.status] = (dc[g.status]||0)+1 });

    // Daily bars (shared renderer from admin.js)
    const activityHtml = window.renderActivityBars ? window.renderActivityBars(data.daily||[]) : '';

    // Recent listening (top 12)
    const recentHtml = (data.recent_listen || []).slice(0,12).map(r=>
      `<div class="mr-detail-item"><span><span class="mr-chip">${esc(r.category)}</span> ${esc(r.item)}</span><span style="color:#94a3b8;font-size:12px">${esc(r.listened_at)}</span></div>`
    ).join('') || '<div class="mr-empty">还没有听读记录，去音节表点一点吧</div>';

    // Dictation sessions
    const sessionsHtml = (data.sessions||[]).map(s=>{
      const details = (s.details||[]).slice(0,8).map(dt=>{
        const cls = dt.correct ? 'good' : 'bad';
        const mark = dt.correct ? '✔' : '✘';
        return `<span class="mr-chip ${cls}">${esc(dt.item||dt.category||'?')} ${mark}</span>`;
      }).join('');
      const more = (s.details||[]).length > 8 ? `<span class="mr-chip">+${(s.details||[]).length-8}</span>` : '';
      return `
        <div class="mr-session">
          <div class="mr-session-head">
            <span>${esc(s.mode)} · ${esc(s.category)}</span>
            <span>${s.correct_count}/${s.total_questions} <span style="color:#94a3b8;font-weight:400">${esc(s.completed_at)}</span></span>
          </div>
          <div style="margin-top:6px">${details}${more}</div>
        </div>`;
    }).join('') || '<div class="mr-empty">还没有听写记录，去字母听写试试吧</div>';

    // Weak points (unknown diagnosis)
    const weak = (data.diag||[]).filter(g=>g.status==='unknown').map(g=>`<span class="mr-weak">${esc(g.pinyin)}</span>`).join('') || '<div class="mr-empty" style="color:#16a34a">没有薄弱项，全部掌握！🎉</div>';
    const unsure = (data.diag||[]).filter(g=>g.status==='unsure').map(g=>`<span class="mr-chip warn">${esc(g.pinyin)}</span>`).join('');

    c.innerHTML = `
      <div class="mr-wrap">
        <div class="mr-title">📊 我的学习记录 <span style="font-size:13px;font-weight:400;color:#94a3b8">${esc(uname)}</span></div>

        <div class="mr-card">
          <div style="display:flex;flex-wrap:wrap;justify-content:space-around;gap:6px">
            <span class="mr-stat"><b>${data.total_listens||0}</b>🔊 听读次数</span>
            <span class="mr-stat"><b>${data.dictation_sessions||0}</b>✍️ 听写次数</span>
            <span class="mr-stat"><b>${data.accuracy||0}%</b>🎯 正确率</span>
            <span class="mr-stat"><b>${data.diagnosis_count||0}</b>🧪 诊断项</span>
          </div>
        </div>

        <div class="mr-card">
          <div class="mr-sec">📅 近30天活跃 <span class="bar"></span></div>
          ${activityHtml}
        </div>

        <div class="mr-card">
          <div class="mr-sec">🔊 最近听读 <span class="bar"></span></div>
          ${recentHtml}
        </div>

        <div class="mr-card">
          <div class="mr-sec">✍️ 最近听写 <span class="bar"></span></div>
          ${sessionsHtml}
        </div>

        <div class="mr-card">
          <div class="mr-sec">🎯 需要加强 <span class="bar"></span></div>
          <div>${weak}</div>
          ${unsure ? `<div style="margin-top:8px"><span style="font-size:12px;color:#94a3b8">模糊项：</span>${unsure}</div>` : ''}
        </div>
      </div>
    `;
  }

  registerModule('my-records', {
    render: function(container){
      injectStyles();
      if(!window.api || !window.api.isLoggedIn()){
        renderNotLoggedIn(container);
        return;
      }
      container.innerHTML = '<div class="mr-wrap"><div class="mr-title">📊 我的学习记录</div><div class="mr-empty">加载中...</div></div>';
      Promise.all([
        window.api.request('GET', '/stats').catch(()=>null),
        window.api.request('GET', '/listening/stats').catch(()=>null)
      ]).then(([stats, listenStats])=>{
        if(!stats){
          container.innerHTML = '<div class="mr-wrap"><div class="mr-title">📊 我的学习记录</div><div class="mr-empty">加载失败，请稍后再试</div></div>';
          return;
        }
        if(listenStats) stats.recent_listen = listenStats.recent;
        renderStats(container, stats);
      });
    },
    cleanup: function(){}
  });
})();
