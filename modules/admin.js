/* ═══════════════════════════════════════════════════════════════
   ADMIN — Learning records viewer (password-protected)
   后台入口：侧边栏底部 🔧 管理（管理员密码登录 → 用户列表 → 详情）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  const ADMIN_TOKEN_KEY = 'study_admin_token';
  let adminToken = localStorage.getItem(ADMIN_TOKEN_KEY) || '';

  const STYLE_ID = 'admin-styles';
  function injectStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .adm-wrap{width:100%;max-width:760px;margin:0 auto;padding:8px 4px 32px}
      .adm-title{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:14px;display:flex;align-items:center;gap:8px}
      .adm-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.04)}
      .adm-input{width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:10px}
      .adm-input:focus{border-color:#6366f1}
      .adm-btn{display:inline-block;padding:10px 22px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;transition:all .2s}
      .adm-btn:active{transform:scale(.97)}
      .adm-btn.ghost{background:#fff;color:#6366f1;border:2px solid #6366f1}
      .adm-btn.danger{background:#fff;color:#ef4444;border:2px solid #ef4444}
      .adm-err{color:#ef4444;font-size:13px;margin-bottom:8px;display:none}
      .adm-user-row{display:flex;justify-content:space-between;align-items:center;padding:12px 4px;border-bottom:1px solid #f1f5f9;cursor:pointer}
      .adm-user-row:last-child{border-bottom:none}
      .adm-user-row:hover{background:#f8fafc}
      .adm-uname{font-size:15px;font-weight:700;color:#1e293b}
      .adm-uinfo{font-size:12px;color:#94a3b8;margin-top:2px}
      .adm-stat{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:#6366f1;background:#eef2ff;border-radius:6px;padding:2px 8px;margin:2px}
      .adm-sec{font-size:13px;font-weight:700;color:#64748b;margin:14px 0 8px;display:flex;align-items:center;gap:6px}
      .adm-sec .bar{flex:1;height:1px;background:#e2e8f0}
      .adm-chip{display:inline-block;font-size:12px;border-radius:6px;padding:2px 8px;margin:2px;background:#f1f5f9;color:#475569}
      .adm-chip.good{background:#dcfce7;color:#16a34a}
      .adm-chip.bad{background:#fee2e2;color:#dc2626}
      .adm-chip.warn{background:#fef9c3;color:#ca8a04}
      .adm-back{background:none;border:1.5px solid #cbd5e1;border-radius:8px;color:#475569;font-size:13px;font-weight:600;padding:6px 14px;cursor:pointer;margin-bottom:10px}
      .adm-daily{display:flex;align-items:flex-end;gap:3px;height:60px;padding:8px 4px 0;overflow-x:auto}
      .adm-daily .d{display:flex;flex-direction:column;align-items:center;flex:1;min-width:22px}
      .adm-daily .dv{width:100%;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:3px 3px 0 0;min-height:2px}
      .adm-daily .dl{font-size:9px;color:#94a3b8;margin-top:3px;transform:rotate(-45deg);white-space:nowrap}
      .act-wrap{width:100%}
      .act-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:8px}
      .act-nav-btn{background:#fff;border:1.5px solid #cbd5e1;border-radius:8px;color:#475569;font-size:16px;font-weight:700;width:30px;height:30px;line-height:1;cursor:pointer;padding:0}
      .act-nav-btn:disabled{opacity:.35;cursor:default}
      .act-nav-btn:active:not(:disabled){transform:scale(.94)}
      .act-month{font-size:14px;font-weight:700;color:#334155;min-width:90px;text-align:center}
      .act-stats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
      .act-stat{display:inline-flex;flex-direction:column;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 14px;font-size:11px;color:#64748b}
      .act-stat b{font-size:18px;color:#4338ca}
      .act-daily{display:flex;align-items:flex-end;gap:2px;height:72px;padding:18px 2px 0;width:100%}
      .act-daily .d{display:flex;flex-direction:column;align-items:center;flex:1 1 0;min-width:0;height:100%;justify-content:flex-end}
      .act-daily .dv{width:70%;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:3px 3px 0 0;position:relative;min-height:4px;transition:height .3s}
      .act-daily .dv-empty{background:#f1f5f9;height:4px!important;min-height:4px;width:70%}
      .act-daily .dv-n{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font-size:9px;color:#6366f1;font-weight:700;white-space:nowrap}
      .act-scale{display:flex;gap:2px;margin-top:4px;width:100%}
      .act-scale .act-scl{flex:1 1 0;min-width:0;font-size:8px;color:transparent;text-align:center}
      .act-scale .act-scl.show{color:#94a3b8}
      .act-daily .d.active{cursor:pointer}
      .act-daily .d.active:hover .dv{filter:brightness(1.15)}
      .act-daily .d.today .dv{box-shadow:0 0 0 1.5px #6366f1}
      .adm-empty{text-align:center;color:#94a3b8;font-size:13px;padding:18px 0}
      .adm-detail-item{display:flex;justify-content:space-between;padding:6px 2px;border-bottom:1px dashed #f1f5f9;font-size:14px}
      .adm-detail-item:last-child{border-bottom:none}
      .adm-session{border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:8px;background:#fafafa}
      .adm-session-head{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;color:#334155}
      .adm-session .adm-chip{font-size:11px}
      .adm-logout{float:right;font-size:12px;color:#94a3b8;background:none;border:none;cursor:pointer;text-decoration:underline}
      .adm-day-detail{margin-top:10px;border-top:1px dashed #e2e8f0;padding-top:10px;display:none}
      .adm-day-detail.open{display:block}
      .adm-day-head{font-size:13px;font-weight:700;color:#334155;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
      .adm-day-close{background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;text-decoration:underline}
      .adm-day-sub{font-size:12px;font-weight:700;color:#64748b;margin:10px 0 4px}
      .adm-day-list{max-height:160px;overflow-y:auto;border:1px solid #f1f5f9;border-radius:8px;padding:6px 8px;background:#fafafa}
      .adm-day-item{display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:13px;color:#475569;border-bottom:1px dashed #f1f5f9}
      .adm-day-item:last-child{border-bottom:none}
      .adm-day-time{font-size:11px;color:#94a3b8}
    `;
    document.head.appendChild(s);
  }

  /* ═══ API ═══ */
  function adminFetch(path, opts){
    opts = opts || {};
    opts.headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
    if(adminToken) opts.headers['X-Admin-Token'] = adminToken;
    return fetch('/api/admin'+path, opts).then(async res=>{
      const data = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.error || '请求失败');
      return data;
    });
  }

  function logout(){
    adminToken = '';
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    renderLogin();
  }

  /* ═══ VIEWS ═══ */
  let currentUid = null;

  function renderLogin(){
    currentUid = null;
    const c = $('app');
    c.innerHTML = `
      <style>${''}</style>
      <div class="adm-wrap">
        <div class="adm-title">🔧 学习记录管理</div>
        <div class="adm-card">
          <div class="adm-err" id="admErr"></div>
          <input class="adm-input" id="admPw" type="password" placeholder="输入管理密码" autocomplete="current-password">
          <button class="adm-btn" id="admLogin" style="width:100%">进入后台</button>
        </div>
      </div>
    `;
    document.getElementById('admLogin').addEventListener('click', doLogin);
    document.getElementById('admPw').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin() });
    document.getElementById('admPw').focus();

    async function doLogin(){
      const pw = document.getElementById('admPw').value;
      if(!pw){ showErr('请输入管理密码'); return; }
      const btn = document.getElementById('admLogin');
      btn.disabled = true; btn.textContent = '验证中...';
      try {
        const data = await adminFetch('/login', {method:'POST', body: JSON.stringify({password: pw})});
        adminToken = data.token;
        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
        loadUsers();
      } catch(e){
        showErr(e.message);
        btn.disabled = false; btn.textContent = '进入后台';
      }
    }
    function showErr(msg){
      const el = document.getElementById('admErr');
      el.textContent = msg; el.style.display = 'block';
    }
  }

  function loadUsers(){
    adminFetch('/users').then(data=>{
      renderUsers(data.users || []);
    }).catch(e=>{
      if(e.message.includes('过期') || e.message.includes('验证')){
        logout();
      } else {
        renderUsers([]);
      }
    });
  }

  function renderUsers(users){
    currentUid = null;
    const c = $('app');
    c.innerHTML = `
      <div class="adm-wrap">
        <div class="adm-title">👥 用户列表 <span style="font-size:13px;font-weight:400;color:#94a3b8">${users.length} 人</span>
          <button class="adm-logout" id="admLogout">退出后台</button>
        </div>
        ${users.length === 0 ? '<div class="adm-card"><div class="adm-empty">还没有注册用户</div></div>' :
        `<div class="adm-card">
          ${users.map(u=>`
            <div class="adm-user-row" data-uid="${u.id}">
              <div>
                <div class="adm-uname">${esc(u.display_name || u.username)}</div>
                <div class="adm-uinfo">注册 ${u.created_at} · 最近活动 ${u.last_active || '-'}</div>
              </div>
              <div style="text-align:right">
                <span class="adm-stat">🔊 ${u.listen_count||0}</span>
                <span class="adm-stat">✍️ ${u.dict_count||0}</span>
                <span class="adm-stat">🧪 ${u.diag_count||0}</span>
              </div>
            </div>`).join('')}
        </div>`}
      </div>
    `;
    document.getElementById('admLogout').addEventListener('click', logout);
    c.querySelectorAll('.adm-user-row').forEach(el=>{
      el.addEventListener('click', ()=> loadUserDetail(el.dataset.uid));
    });
  }

  function loadUserDetail(uid){
    adminFetch('/users/'+uid).then(data=>{
      renderUserDetail(data);
    }).catch(e=>{
      if(e.message.includes('过期') || e.message.includes('验证')) logout();
      else showToast(e.message);
    });
  }

  function showToast(msg){
    let t = document.getElementById('admToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'admToast';
      t.style.cssText = 'position:fixed;left:50%;top:60px;transform:translateX(-50%);z-index:10000;background:#1e293b;color:#fff;border-radius:10px;padding:10px 20px;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>{ t.style.opacity = '0' }, 2500);
  }

  /* ═══ MONTH ACTIVITY BARS (shared by admin + my-records) ═══
     renderMonthBars(month, monthData, opts)
       month: 'YYYY-MM'
       monthData: {days:[{d:'YYYY-MM-DD', c:N}], active_days, total_count, best_streak}
       opts: { onPrev(month), onNext(month), onDayClick(date), canPrev, canNext }
     月份导航 + 该月每日柱子 + 底部日期刻度（独立行，不占柱子高度） */
  function fmtLocal(dt){
    const p = n => String(n).padStart(2, '0');
    return dt.getFullYear() + '-' + p(dt.getMonth()+1) + '-' + p(dt.getDate());
  }

  window.renderMonthBars = function(month, md, opts){
    opts = opts || {};
    const dailyMap = {};
    (md.days||[]).forEach(x=>{ dailyMap[x.d] = x.c });

    // 该月全部日期
    const y = parseInt(month.slice(0,4), 10), m = parseInt(month.slice(5,7), 10);
    const ndays = new Date(y, m, 0).getDate();
    const days = [];
    for(let day=1; day<=ndays; day++){
      const key = month + '-' + String(day).padStart(2,'0');
      days.push({key, count: dailyMap[key] || 0});
    }
    const maxC = Math.max(1, ...days.map(x=>x.count));
    const todayStr = fmtLocal(new Date());
    const isThisMonth = month === todayStr.slice(0,7);

    const bars = days.map(x=>{
      const isActive = x.count > 0;
      const isToday = isThisMonth && x.key === todayStr;
      return `
        <div class="d${isActive?' active':''}${isToday?' today':''}" data-date="${x.key}" title="${x.key} · ${x.count}次${isActive?'':'（未学习）'}">
          ${isActive ? `<div class="dv" style="height:${Math.max(4, Math.round(x.count/maxC*100))}%"><span class="dv-n">${x.count}</span></div>` : '<div class="dv dv-empty"></div>'}
        </div>`;
    }).join('');

    // 底部日期刻度：只标 1 / 5 / 10 / 15 / 20 / 25 / 末日（稀疏，不挤）
    const scale = days.map(x=>{
      const day = parseInt(x.key.slice(8,10), 10);
      const show = (day===1 || day%5===0 || day===ndays);
      return `<span class="act-scl${show?' show':''}">${show ? day : ''}</span>`;
    }).join('');

    const stats = `
      <div class="act-stats">
        <span class="act-stat"><b>${md.active_days||0}</b>活跃天数</span>
        <span class="act-stat"><b>${md.total_count||0}</b>学习次数</span>
        <span class="act-stat"><b>${md.best_streak||0}</b>最长连续(天)</span>
      </div>`;

    const nav = `
      <div class="act-nav">
        <button class="act-nav-btn" id="actPrev" ${opts.canPrev===false?'disabled':''}>‹</button>
        <span class="act-month">${y}年${m}月${isThisMonth?' <em style="font-style:normal;color:#94a3b8;font-size:11px">本月</em>':''}</span>
        <button class="act-nav-btn" id="actNext" ${opts.canNext===false?'disabled':''}>›</button>
      </div>`;

    return `<div class="act-wrap">${nav}${stats}<div class="act-daily">${bars}</div><div class="act-scale">${scale}</div></div>`;
  };

  // 兼容旧引用：renderActivityBars 仍可用（默认渲染近30天，无导航）
  window.renderActivityBars = function(daily){
    const dailyMap = {};
    (daily||[]).forEach(x=>{ dailyMap[x.d] = x.c });
    const days = [];
    for(let i=29; i>=0; i--){
      const dt = new Date(Date.now() - i*86400000);
      days.push({key: fmtLocal(dt), count: dailyMap[fmtLocal(dt)] || 0});
    }
    const maxC = Math.max(1, ...days.map(x=>x.count));
    const bars = days.map(x=>{
      const isActive = x.count > 0;
      return `
        <div class="d${isActive?' active':''}" data-date="${x.key}" title="${x.key} · ${x.count}次${isActive?'':'（未学习）'}">
          ${isActive ? `<div class="dv" style="height:${Math.max(4, Math.round(x.count/maxC*100))}%"><span class="dv-n">${x.count}</span></div>` : '<div class="dv dv-empty"></div>'}
        </div>`;
    }).join('');
    return `<div class="act-wrap"><div class="act-daily">${bars}</div></div>`;
  };

  function renderUserDetail(d){
    currentUid = d.user.id;
    const c = $('app');
    const u = d.user;
    const dc = d.diag_counts || {};
    const knownPct = d.listen_by_cat && d.listen_by_cat.length ? '' : '';

    // Daily activity — 按月视图（默认当月）
    const now = new Date();
    const curMonth = fmtLocal(now).slice(0,7);

    function renderMonthCard(month){
      const box = c.querySelector('#admMonthBox');
      if(!box) return;
      box.innerHTML = '<div class="adm-empty">加载中...</div>';
      adminFetch('/users/' + currentUid + '/month?month=' + encodeURIComponent(month)).then(md=>{
        if(!md) return;
        const todayStr = fmtLocal(new Date());
        const monthStr = fmtLocal(new Date()).slice(0,7);
        const html = window.renderMonthBars(md.month, md, {
          canPrev: true,
          canNext: monthStr !== md.month,
          onPrev: (m)=>{ renderMonthCard(prevMonth(m)); },
          onNext: (m)=>{ renderMonthCard(nextMonth(m)); }
        });
        box.innerHTML = html;
        // 绑定导航
        const prevBtn = box.querySelector('#actPrev');
        const nextBtn = box.querySelector('#actNext');
        if(prevBtn) prevBtn.addEventListener('click', ()=>renderMonthCard(prevMonth(month)));
        if(nextBtn) nextBtn.addEventListener('click', ()=>renderMonthCard(nextMonth(month)));
        // 绑定柱子点击
        const dailyEl = box.querySelector('.act-daily');
        if(dailyEl){
          dailyEl.addEventListener('click', e=>{
            const bar = e.target.closest('.d.active');
            if(!bar) return;
            const date = bar.getAttribute('data-date');
            if(date) loadAdminDayDetail(c, currentUid, date);
          });
        }
      }).catch(e=>{
        box.innerHTML = '<div class="adm-empty">加载失败</div>';
      });
    }

    function prevMonth(m){
      const y = parseInt(m.slice(0,4), 10), mo = parseInt(m.slice(5,7), 10);
      if(mo === 1) return (y-1) + '-12';
      return y + '-' + String(mo-1).padStart(2,'0');
    }
    function nextMonth(m){
      const y = parseInt(m.slice(0,4), 10), mo = parseInt(m.slice(5,7), 10);
      if(mo === 12) return (y+1) + '-01';
      return y + '-' + String(mo+1).padStart(2,'0');
    }

    // Recent listening
    const recent = (d.listen_recent||[]).slice(0,15).map(r=>
      `<div class="adm-detail-item"><span><span class="adm-chip">${esc(r.category)}</span> ${esc(r.item)}</span><span style="color:#94a3b8;font-size:12px">${esc(r.listened_at)}</span></div>`
    ).join('') || '<div class="adm-empty">暂无听读记录</div>';

    // Dictation sessions with details
    const sessions = (d.sessions||[]).map(s=>{
      const details = (s.details||[]).map(dt=>{
        const cls = dt.correct ? 'good' : 'bad';
        const mark = dt.correct ? '✔' : '✘';
        return `<span class="adm-chip ${cls}">${esc(dt.item||dt.category||'?')} ${mark}</span>`;
      }).join('') || '<span style="color:#94a3b8">无明细</span>';
      return `
        <div class="adm-session">
          <div class="adm-session-head">
            <span>${esc(s.mode)} · ${esc(s.category)}</span>
            <span>${s.correct_count}/${s.total_questions} <span style="color:#94a3b8;font-weight:400">${s.completed_at}</span></span>
          </div>
          <div style="margin-top:6px">${details}</div>
        </div>`;
    }).join('') || '<div class="adm-empty">暂无听写记录</div>';

    // Diagnosis
    const diagItems = (d.diag||[]).map(g=>{
      const cls = g.status==='known'?'good':g.status==='unsure'?'warn':'bad';
      return `<span class="adm-chip ${cls}">${esc(g.pinyin)}·${g.status==='known'?'认识':g.status==='unsure'?'模糊':'不会'}</span>`;
    }).join('') || '<div class="adm-empty">暂无诊断记录</div>';

    c.innerHTML = `
      <div class="adm-wrap">
        <button class="adm-back" id="admBack">← 返回用户列表</button>
        <div class="adm-title">👤 ${esc(u.display_name || u.username)} <span style="font-size:13px;font-weight:400;color:#94a3b8">注册于 ${esc(u.created_at)}</span></div>

        <div class="adm-card">
          <div class="adm-sec">📊 总览 <span class="bar"></span></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span class="adm-stat">🔊 听读 ${d.listen_total||0} 次</span>
            <span class="adm-stat">✍️ 听写 ${(d.sessions||[]).length} 次</span>
            <span class="adm-stat">🧪 诊断 ${(d.diag||[]).length} 项</span>
            <span class="adm-stat">✅ 认识 ${dc.known||0}</span>
            <span class="adm-stat">⚠️ 模糊 ${dc.unsure||0}</span>
            <span class="adm-stat">❌ 不会 ${dc.unknown||0}</span>
          </div>
          <div class="adm-sec">📅 学习活跃 <span class="bar"></span></div>
          <div id="admMonthBox"></div>
          <div class="adm-day-detail" id="admDayDetail"></div>
        </div>

        <div class="adm-card">
          <div class="adm-sec">🔊 最近听读 <span class="bar"></span></div>
          ${recent}
        </div>

        <div class="adm-card">
          <div class="adm-sec">✍️ 听写记录 <span class="bar"></span></div>
          ${sessions}
        </div>

        <div class="adm-card">
          <div class="adm-sec">🧪 诊断结果 <span class="bar"></span></div>
          <div>${diagItems}</div>
        </div>
      </div>
    `;
    document.getElementById('admBack').addEventListener('click', loadUsers);

    // 加载当月活跃图
    renderMonthCard(curMonth);
  }

  function loadAdminDayDetail(c, uid, date){
    const box = c.querySelector('#admDayDetail');
    if(!box) return;
    if(box.dataset.date === date && box.classList.contains('open')){
      box.classList.remove('open');
      return;
    }
    box.classList.add('open');
    box.dataset.date = date;
    box.innerHTML = '<div class="adm-day-head"><span>📅 ' + esc(date) + '</span><span class="adm-empty" style="padding:6px 0">加载中...</span></div>';
    adminFetch('/users/' + uid + '/daily?date=' + encodeURIComponent(date)).then(d=>{
      if(!d || d.date !== box.dataset.date) return;
      // 听读明细：按 item 聚合
      const itemCount = {};
      (d.listens||[]).forEach(l=>{
        const k = (l.category||'') + '|' + (l.item||'');
        itemCount[k] = (itemCount[k]||0) + 1;
      });
      const listensHtml = Object.keys(itemCount).map(k=>{
        const [cat, item] = k.split('|');
        return `<div class="adm-day-item"><span><span class="adm-chip">${esc(cat)}</span> ${esc(item)}</span><span class="adm-chip">${itemCount[k]}次</span></div>`;
      }).join('') || '<div class="adm-day-item">无听读记录</div>';

      const sessionsHtml = (d.sessions||[]).map(s=>{
        const det = (s.details||[]).slice(0,10).map(x=>{
          const cls = x.correct ? 'good' : 'bad';
          const mk = x.correct ? '✔' : '✘';
          return `<span class="adm-chip ${cls}">${esc(x.item||x.category||'?')} ${mk}</span>`;
        }).join('');
        const more = (s.details||[]).length > 10 ? `<span class="adm-chip">+${(s.details||[]).length-10}</span>` : '';
        return `<div class="adm-day-item"><span>${esc(s.mode)} · ${esc(s.category)} ${det}${more}</span><span style="font-size:12px;color:#6366f1;font-weight:700">${s.correct_count}/${s.total_questions}</span></div>`;
      }).join('') || '';

      const diagHtml = (d.diag||[]).map(g=>{
        const cls = g.status==='unknown' ? 'bad' : (g.status==='unsure' ? 'warn' : 'good');
        return `<span class="adm-chip ${cls}">${esc(g.pinyin)} ${g.status==='known'?'✓':(g.status==='unsure'?'~':'✗')}</span>`;
      }).join('') || '';

      box.innerHTML = `
        <div class="adm-day-head"><span>📅 ${esc(date)} · ${d.listens_count||0}次听读${(d.sessions||[]).length?' · '+(d.sessions||[]).length+'次听写':''}</span><button class="adm-day-close">收起</button></div>
        <div class="adm-day-sub">🔊 听读（${d.listens_count||0}次）</div>
        <div class="adm-day-list">${listensHtml}</div>
        ${sessionsHtml ? `<div class="adm-day-sub">✍️ 听写</div><div class="adm-day-list">${sessionsHtml}</div>` : ''}
        ${diagHtml ? `<div class="adm-day-sub">🧪 诊断</div><div>${diagHtml}</div>` : ''}
      `;
      box.querySelector('.adm-day-close').addEventListener('click', ()=>{
        box.classList.remove('open');
        box.innerHTML = '';
        delete box.dataset.date;
      });
    }).catch(e=>{
      box.innerHTML = '<div class="adm-day-head"><span>📅 ' + esc(date) + '</span><span class="adm-day-close" style="color:#ef4444">' + esc(e.message || '加载失败') + '</span></div>';
    });
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  /* ═══ MODULE ═══ */
  registerModule('admin', {
    render: function(container){
      injectStyles();
      if(adminToken){
        loadUsers();
      } else {
        renderLogin();
      }
    },
    cleanup: function(){}
  });

  // Expose for auth.js (login state changes re-render)
  window.adminLogout = logout;
})();
