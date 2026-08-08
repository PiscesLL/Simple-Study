/* ═══════════════════════════════════════════════════════════════
   MODULE: dictation — 听写练习（v1 逻辑对齐版）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentAudio = null;
  let remainingQueue = [];
  let practicedItems = [];
  let questionNum = 0;
  let infiniteMode = false;
  let dictFilter = 'all';
  let roundBusy = false;
  let autoNextTimer = null;
  let canvasCtx = null;
  let drawing = false;
  let hasWritten = false;
  let idleTimer = null;
  let currentStroke = [];
  let allStrokes = [];
  let lastX = 0, lastY = 0;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  function cleanup(){
    if(currentAudio){currentAudio.pause();currentAudio=null}
    clearInterval(autoNextTimer);
    clearTimeout(idleTimer);
    const ov = document.getElementById('dictOverlayV2');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  registerModule('dictation', {
    cleanup: cleanup,
    render: function(container){
      container.innerHTML = `
        <div class="section-title">✍️ 听写练习</div>
        <div class="section-subtitle">选择范围和模式，开始全屏听写</div>
        <div class="dict-start" id="dictStartV2">
          <div class="dict-start-icon">✍️</div>
          <div class="dict-start-title">选择要练习的内容</div>
          <div class="dict-start-sub">选择一个范围，开始听写后会全屏显示</div>
          <div class="dict-start-categories" id="startCatsV2">
            <button class="dict-start-category selected" data-filter="all"><span>全部</span> <span class="cat-count">63个</span></button>
            <button class="dict-start-category" data-filter="shengmu"><span>声母</span> <span class="cat-count">23个</span></button>
            <button class="dict-start-category" data-filter="yunmu"><span>韵母</span> <span class="cat-count">24个</span></button>
            <button class="dict-start-category" data-filter="zhengti"><span>整体认读</span> <span class="cat-count">16个</span></button>
          </div>
          <div class="dict-mode-row">
            <button class="dict-mode-btn active" data-mode="normal">📋 正常模式</button>
            <button class="dict-mode-btn" data-mode="infinite">♾️ 无限模式</button>
          </div>
          <button class="dict-start-btn ready" id="startBtnV2">开始练习 全部</button>
        </div>
      `;
      const sc = container.querySelector('#startCatsV2');
      sc.querySelectorAll('.dict-start-category').forEach(btn=>{
        btn.addEventListener('click',function(){
          sc.querySelectorAll('.dict-start-category').forEach(b=>b.classList.remove('selected'));
          this.classList.add('selected');
          dictFilter = this.dataset.filter;
          const label = this.querySelector('span:first-child').textContent;
          const sb = container.querySelector('#startBtnV2');
          sb.textContent = '开始练习 '+label;
          sb.className = 'dict-start-btn ready';
        });
      });
      container.querySelectorAll('.dict-mode-btn').forEach(btn=>{
        btn.addEventListener('click',function(){
          container.querySelectorAll('.dict-mode-btn').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          infiniteMode = this.dataset.mode === 'infinite';
        });
      });
      container.querySelector('#startBtnV2').addEventListener('click',startDictation);

      // Auto-start from practice module (听写实战)
      if(window.__dictRound && window.__dictRound.pool && window.__dictRound.pool.length > 0){
        dictFilter = window.__dictRound.filter || 'all';
        startDictation();
      }
    }
  });

  /* ═══ CORE ═══ */
  function startDictation(){
    // Use custom pool from practice module if available
    if(window.__dictRound && window.__dictRound.pool && window.__dictRound.pool.length > 0){
      let pool = window.__dictRound.pool;
      remainingQueue = pool.sort(()=>Math.random()-0.5);
    } else {
      const allPinyin = [];
      for(const c of['shengmu','yunmu','zhengti']) PINYIN_DATA[c].forEach(py=>allPinyin.push({pinyin:py,category:c}));
      let pool = dictFilter==='all' ? [...allPinyin] : allPinyin.filter(p=>p.category===dictFilter);
      remainingQueue = pool.sort(()=>Math.random()-0.5);
    }
    practicedItems = [];
    questionNum = 0;
    hasWritten = false;

    // Inject overlay CSS once
    if(!document.getElementById('dictOvStyleV2')){
      const s = document.createElement('style');
      s.id = 'dictOvStyleV2';
      s.textContent = `
        .do2{display:none;position:fixed;inset:0;z-index:1000;background:#f0f4ff;flex-direction:column;overscroll-behavior:none}
        .do2.active{display:flex}
        .dt2{display:flex;align-items:center;justify-content:space-between;background:#fff;padding:max(8px,env(safe-area-inset-top)) 16px 8px;box-shadow:0 1px 4px rgba(0,0,0,.06);flex-shrink:0}
        .dt2-l{display:flex;align-items:center;gap:10px}
        .db2{padding:4px 12px;border-radius:6px;background:#eef2ff;color:#6366f1;font-size:13px;font-weight:700}
        .dc2{font-size:13px;color:#94a3b8}
        .de2{padding:6px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b}
        .dp2{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:10px}
        .ds2{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px}
        .dr2{display:none;padding:4px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6366f1}
        .dr2.show{display:inline-block}
        .cw2{position:relative;width:min(600px,90vw);aspect-ratio:2/1;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;border:2px solid #e2e8f0;transition:border-color .2s;display:flex;align-items:center;justify-content:center}
        .cw2.writing{border-color:#a5b4fc}
        .cl2{position:absolute;top:8px;left:12px;font-size:12px;color:#94a3b8;z-index:2;pointer-events:none}
        .hc2{width:100%;height:100%;display:block;touch-action:none;cursor:crosshair;position:absolute;top:0;left:0;z-index:10}
        .ct2{position:absolute;bottom:10px;right:12px;font-size:14px;font-weight:800;color:#6366f1;z-index:8;display:none;pointer-events:none;background:rgba(255,255,255,.85);padding:2px 8px;border-radius:6px}
        .ct2.show{display:block}
        .ro2{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:5;pointer-events:none}
        .ro2.show{display:flex}
        .at2{font-size:clamp(40px,12vw,70px);font-weight:800;line-height:1}
        .as2{font-size:14px;color:#94a3b8;margin-top:4px}
        .nn2{display:none;padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .nn2.show{display:inline-block}
        .rv2{display:none;flex-direction:column;align-items:center;flex:1;overflow:hidden;padding:16px 16px 12px}
        .rv2.active{display:flex}
        .rv2-hdr{flex-shrink:0;text-align:center;width:100%;max-width:480px}
        .rv2-t{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:2px}
        .rv2-s{font-size:13px;color:#94a3b8;margin-bottom:12px}
        .rv2-body{flex:1;overflow-y:auto;width:100%;max-width:480px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}
        .rv2-body::-webkit-scrollbar{width:4px}
        .rv2-body::-webkit-scrollbar-track{background:transparent}
        .rv2-body::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        .rv2-ftr{flex-shrink:0;width:100%;max-width:480px;padding-top:8px;text-align:center}
        .rv2-g{width:100%;max-width:480px;display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
        .rc2{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.04);border:1px solid #f1f5f9}
        .rc2 .py{font-size:18px;font-weight:700;color:#1e293b;width:50px;text-align:center;flex-shrink:0}
        .rc2 .pi{width:48px;height:48px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;background:#fafafa}
        .rc2 .pe{width:48px;height:48px;border-radius:8px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:11px;color:#cbd5e1}
        .rc2 .pg{display:flex;gap:6px;margin-left:auto}
        .rc2 .pg button{width:44px;height:44px;border-radius:50%;border:2px solid #e2e8f0;font-size:20px;cursor:pointer;transition:all .15s;background:#fff;display:flex;align-items:center;justify-content:center}
        .rc2 .pg button:active{transform:scale(.85)}
        .rc2 .pg .gy.active{background:#dcfce7;color:#16a34a;border-color:#86efac}
        .rc2 .pg .gn.active{background:#fee2e2;color:#dc2626;border-color:#fca5a5}
        .rv2-g.locked .pg button{pointer-events:none;opacity:.5}
        .rs2{font-size:clamp(16px,4vw,20px);font-weight:700;color:#1e293b;margin:8px 0}
        .ra2{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px}
        .rb2,.ra2-btn{padding:12px 36px;border-radius:12px;border:none;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s}
        .rb2{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .ra2-btn{background:#f1f5f9;color:#64748b}
        .rb2:active,.ra2-btn:active{transform:scale(.95)}
        .co2{display:none;position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:16px}
        .co2.show{display:flex}
        .cm2{background:#fff;border-radius:20px;padding:32px 24px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:cp2 .35s ease}
        @keyframes cp2{0%{opacity:0;transform:scale(.8) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        .cm2-t{font-size:24px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .cm2-s{font-size:48px;font-weight:800;color:#6366f1;margin:8px 0}
        .cm2-s span{font-size:20px;font-weight:600;color:#94a3b8}
        .cm2-st{font-size:28px;margin:4px 0 8px}
        .cm2-m{font-size:15px;color:#64748b;margin-bottom:4px}
        .cm2-d{font-size:12px;color:#94a3b8;margin-bottom:12px}
        .cm2-b{padding:12px 36px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .cm2-b:active{transform:scale(.95)}
        .cf2{display:none;position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px}
        .cf2.show{display:flex}
        .cf2-box{background:#fff;border-radius:20px;padding:28px 24px 20px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.12);animation:cp2 .25s ease}
        .cf2-icon{font-size:36px;margin-bottom:8px}
        .cf2-t{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:2px}
        .cf2-sub{font-size:13px;color:#94a3b8;margin-bottom:18px}
        .cf2-btns{display:flex;gap:10px;justify-content:center}
        .cf2-cancel,.cf2-ok{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;min-width:80px}
        .cf2-cancel{background:#f1f5f9;color:#64748b}
        .cf2-ok{background:#ef4444;color:#fff}
        .cf2-cancel:active,.cf2-ok:active{transform:scale(.95)}
      `;
      document.head.appendChild(s);
    }

    // Build overlay
    const ov = document.createElement('div');
    ov.id = 'dictOverlayV2';
    ov.className = 'do2 active';
    ov.innerHTML = `
      <div class="dt2">
        <div class="dt2-l">
          <span class="db2">${window.__dictRound && window.__dictRound.label ? window.__dictRound.label : catName(dictFilter)}</span>
          <span class="dc2" id="cdV2"></span>
        </div>
        <button class="de2" id="endV2">结束练习</button>
      </div>
      <div class="dp2" id="practiceV2" style="display:flex">
        <div class="ds2" id="statusV2">
          <span style="font-size:18px" id="iconV2">🔊</span>
          <span style="font-size:clamp(14px,3.5vw,18px);font-weight:700" id="textV2">准备开始...</span>
          <button class="dr2" id="replayV2">🔁 重播</button>
        </div>
        <div class="cw2" id="wrapV2">
          <span class="cl2">✏️ 手写区</span>
          <div class="ct2" id="timerV2"></div>
          <canvas class="hc2" id="canV2"></canvas>
        </div>
        <button class="nn2" id="nextV2">继续下一题 ▶</button>
      </div>
      <div class="rv2" id="reviewV2">
        <div class="rv2-hdr">
          <div class="rv2-t">📝 练习报告</div>
          <div class="rv2-s" id="rSubV2"></div>
        </div>
        <div class="rv2-body" id="rBodyV2">
          <div class="rv2-g" id="rGridV2"></div>
        </div>
        <div class="rv2-ftr">
          <div class="rs2" id="rSumV2"></div>
          <div class="ra2" id="ra2V2" style="display:none">
            <button class="rb2" id="rbV2">返回首页</button>
            <button class="ra2-btn" id="rtV2">🔄 再来一次</button>
          </div>
        </div>
      </div>
      <div class="co2" id="certV2">
        <div class="cm2">
          <div class="cm2-t">🎉 学习证书</div>
          <div class="cm2-s" id="cScoreV2">100 <span>/ 100</span></div>
          <div class="cm2-st" id="cStarsV2"></div>
          <div class="cm2-m" id="cMsgV2"></div>
          <div class="cm2-d" id="cDetV2"></div>
          <button class="cm2-b" id="cCloseV2">完成</button>
        </div>
      </div>
      <!-- ═══ CONFIRM MODAL ═══ -->
      <div class="cf2" id="confirmV2">
        <div class="cf2-box">
          <div class="cf2-icon">🤔</div>
          <div class="cf2-t">确定结束练习吗？</div>
          <div class="cf2-sub">未完成的题目将不计入成绩</div>
          <div class="cf2-btns">
            <button class="cf2-cancel" id="cfCancelV2">取消</button>
            <button class="cf2-ok" id="cfOkV2">确定结束</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    try{document.documentElement.requestFullscreen()}catch(e){}
    try{document.documentElement.webkitRequestFullscreen()}catch(e){}

    // ─── CANVAS ───
    const can = document.getElementById('canV2');
    const wrap = document.getElementById('wrapV2');

    function resizeCan(){
      const r = wrap.getBoundingClientRect();
      can.width = Math.min(r.width - 6, 800);
      can.height = Math.max(160, can.width * 0.5);
      canvasCtx = can.getContext('2d');
      canvasCtx.lineCap = 'round';
      canvasCtx.lineJoin = 'round';
      canvasCtx.lineWidth = 4;
      canvasCtx.strokeStyle = '#6366f1';
    }
    resizeCan();
    window.addEventListener('resize', resizeCan);

    function gp(e){
      const r = can.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return {
        x: (t.clientX - r.left) * (can.width / r.width),
        y: (t.clientY - r.top) * (can.height / r.height)
      };
    }

    function sd(e){
      if(roundBusy) return;
      e.preventDefault();
      drawing = true;
      if(!hasWritten) hasWritten = true;
      const p = gp(e);
      lastX = p.x; lastY = p.y;
      currentStroke = [{x:p.x, y:p.y}];
      wrap.className = 'cw2 writing';
      clearTimeout(idleTimer);
      document.getElementById('timerV2').classList.remove('show');
    }

    function mv(e){
      e.preventDefault();
      if(!drawing) return;
      const p = gp(e);
      canvasCtx.beginPath();
      canvasCtx.moveTo(lastX, lastY);
      canvasCtx.lineTo(p.x, p.y);
      canvasCtx.stroke();
      lastX = p.x; lastY = p.y;
      if(currentStroke) currentStroke.push({x:p.x, y:p.y});
    }

    function ed(e){
      e.preventDefault();
      if(!drawing) return;
      drawing = false;
      if(currentStroke && currentStroke.length > 0) allStrokes.push(currentStroke);
      currentStroke = [];
      if(hasWritten && allStrokes.length > 0) startIdleTimer();
    }

    can.addEventListener('mousedown', sd);
    can.addEventListener('mousemove', mv);
    can.addEventListener('mouseup', ed);
    can.addEventListener('mouseleave', ed);
    can.addEventListener('touchstart', sd, {passive:false});
    can.addEventListener('touchmove', mv, {passive:false});
    can.addEventListener('touchend', ed, {passive:false});

    function startIdleTimer(){
      clearTimeout(idleTimer);
      const tEl = document.getElementById('timerV2');
      let sec = 2;
      tEl.textContent = sec+'s';
      tEl.classList.add('show');
      const iv = setInterval(()=>{
        sec--;
        if(sec > 0) tEl.textContent = sec+'s';
        else clearInterval(iv);
      }, 1000);
      idleTimer = setTimeout(()=>{
        clearInterval(iv);
        tEl.classList.remove('show');
        if(!roundBusy) finishCurrent();
      }, 2000);
    }

    function captureCurrent(){
      if(currentPy && hasWritten){
        const last = practicedItems[practicedItems.length-1];
        if(!last || last.pinyin !== currentPy){
          const img = getImg();
          if(img && img.length > 100){
            practicedItems.push({pinyin:currentPy, category:currentCat, image:img});
          }
        }
      }
    }

    function clearCan(){
      if(canvasCtx) canvasCtx.clearRect(0, 0, can.width, can.height);
      allStrokes = [];
      currentStroke = [];
      hasWritten = false;
      wrap.className = 'cw2';
      clearTimeout(idleTimer);
      document.getElementById('timerV2').classList.remove('show');
    }

    function getImg(){ return can.toDataURL('image/png'); }

    function setSt(icon, text, cls){
      document.getElementById('iconV2').textContent = icon;
      document.getElementById('textV2').textContent = text;
      document.getElementById('statusV2').className = 'ds2'+(cls ? ' '+cls : '');
    }

    // ─── DICTATION FLOW ───
    let currentPy = '', currentCat = '';

    function finishCurrent(){
      if(!currentPy || roundBusy) return;
      roundBusy = true;
      clearTimeout(idleTimer);
      document.getElementById('replayV2').classList.remove('show');
      const img = getImg();
      practicedItems.push({pinyin:currentPy, category:currentCat, image:img});
      clearCan();

      if(isIOS){
        setSt('👆','点继续继续下一题','reveal');
        document.getElementById('nextV2').textContent = '继续下一题 ▶';
        document.getElementById('nextV2').classList.add('show');
      } else {
        setSt('⏩','下一题...','reveal');
        setTimeout(nextRound, 600);
      }
    }

    function nextRound(){
      clearInterval(autoNextTimer);
      document.getElementById('nextV2').classList.remove('show');
      if(infiniteMode || remainingQueue.length > 0){
        newQuestion();
        setTimeout(listenThenWrite, 400);
      } else {
        showReview();
      }
    }

    function newQuestion(){
      let item = null;
      if(infiniteMode){
        const allP = [];
        for(const c of['shengmu','yunmu','zhengti']) PINYIN_DATA[c].forEach(py=>allP.push({pinyin:py,category:c}));
        const pool = dictFilter==='all' ? [...allP] : allP.filter(p=>p.category===dictFilter);
        item = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
      } else {
        if(remainingQueue.length === 0) return;
        item = remainingQueue.shift();
      }
      if(!item){ showReview(); return; }
      currentPy = item.pinyin;
      currentCat = item.category;
      roundBusy = false;
      questionNum++;
      clearCan();
      document.getElementById('nextV2').classList.remove('show');
      document.getElementById('replayV2').classList.remove('show');
      const cd = document.getElementById('cdV2');
      cd.innerHTML = infiniteMode
        ? '第 <span style="font-weight:700;color:#6366f1">'+questionNum+'</span> 题'
        : '剩余 <span style="font-weight:700;color:#6366f1">'+remainingQueue.length+'</span> / '+(questionNum+remainingQueue.length)+' 题';
      setSt('🔊','播放中...','listening');
    }

    function listenThenWrite(){
      if(!currentPy) return;
      setSt('🔊','播放中...','listening');
      if(currentAudio){currentAudio.pause();currentAudio=null}
      const a = new Audio('../audio/'+currentPy+'.mp3');
      currentAudio = a;
      a.play().catch(()=>{});
      a.onended = function(){
        if(roundBusy) return;
        setSt('✏️','写下来','writing');
        wrap.className = 'cw2 writing';
        document.getElementById('replayV2').classList.add('show');
      };
    }

    document.getElementById('nextV2').addEventListener('click', nextRound);

    document.getElementById('replayV2').addEventListener('click', function(){
      if(currentPy){
        if(currentAudio) currentAudio.pause();
        const a = new Audio('../audio/'+currentPy+'.mp3');
        currentAudio = a;
        a.play().catch(()=>{});
      }
    });

    /* ═══ END: confirm modal → show review, not close ═══ */
    document.getElementById('endV2').addEventListener('click', function(){
      document.getElementById('confirmV2').classList.add('show');
    });
    document.getElementById('cfOkV2').addEventListener('click', function(){
      document.getElementById('confirmV2').classList.remove('show');
      // Save current unfinished item before showing review (matching v1's endDictation)
      captureCurrent();
      showReview();
    });
    document.getElementById('cfCancelV2').addEventListener('click', function(){
      document.getElementById('confirmV2').classList.remove('show');
    });

    // ─── REVIEW ───
    function showReview(){
      // Exit fullscreen (v1 does this before showing review)
      try{document.exitFullscreen()}catch(e){}
      try{document.webkitExitFullscreen()}catch(e){}

      document.getElementById('practiceV2').style.display = 'none';
      document.getElementById('reviewV2').classList.add('active');
      // Hide the top bar with "结束练习" button during review
      document.getElementById('dictOverlayV2').querySelector('.dt2').style.display = 'none';
      document.getElementById('rSubV2').textContent = '共练习了 '+practicedItems.length+' 个拼音，请批改：';
      document.getElementById('rGridV2').innerHTML = practicedItems.map((item,i)=>{
        const hasImg = item.image && item.image.length > 100;
        return '<div class="rc2" data-idx="'+i+'"><div class="py">'+dn(item.pinyin)+'</div>'+
          (hasImg ? '<img class="pi" src="'+item.image+'\" alt="'+item.pinyin+'">' : '<div class="pe">未书写</div>')+
          '<div class="pg"><button class="gy" data-idx="'+i+'" data-grade="correct">✔</button><button class="gn" data-idx="'+i+'" data-grade="wrong">✘</button></div></div>';
      }).join('');
      document.getElementById('rGridV2').querySelectorAll('.pg button').forEach(btn=>{
        btn.addEventListener('click', function(){
          const grid = document.getElementById('rGridV2');
          if(grid.classList.contains('locked')) return;
          const idx = parseInt(this.dataset.idx);
          const grade = this.dataset.grade;
          this.closest('.rc2').querySelectorAll('button').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          practicedItems[idx].correct = (grade === 'correct');
          updateSum();
        });
      });
      updateSum();
    }

    function updateSum(){
      const graded = practicedItems.filter(i => i.correct != null);
      const correct = graded.filter(i => i.correct).length;
      const total = practicedItems.length;
      if(graded.length === total && total > 0){
        const pct = total > 0 ? Math.round(correct/total*100) : 0;
        document.getElementById('rSumV2').innerHTML = '批改完成！正确 <span style="color:#6366f1">'+correct+'</span> / '+total+'（<span style="color:#6366f1">'+pct+'%</span>）';
        if(window.__dictRound && window.__dictRound.noCert){
          // Practice mode: skip certificate, lock grading, show buttons
          document.getElementById('rGridV2').classList.add('locked');
          document.getElementById('ra2V2').style.display = 'flex';
        } else {
          showCert(correct, total);
        }
      } else if(graded.length === total && total === 0){
        // No items practiced — show message and buttons, no cert
        document.getElementById('rSumV2').innerHTML = '还没有练习记录';
        document.getElementById('ra2V2').style.display = 'flex';
      } else {
        document.getElementById('rSumV2').innerHTML = '已批改 <span style="color:#6366f1">'+graded.length+'</span> / '+total;
      }
    }

    function showCert(correct, total){
      const pct = total > 0 ? Math.round(correct/total*100) : 0;
      document.getElementById('cScoreV2').innerHTML = correct+' <span>/ '+total+'</span>';
      document.getElementById('cStarsV2').textContent = pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : '⭐';
      document.getElementById('cMsgV2').textContent = pct >= 90 ? '太棒了！掌握得很扎实！' : pct >= 70 ? '不错！再练练就更好了！' : '继续加油！多练几次就记住了！';
      document.getElementById('cDetV2').textContent = '正确率 '+pct+'%';
      document.getElementById('certV2').classList.add('show');
      // Lock grading — can't modify after certificate appears
      document.getElementById('rGridV2').classList.add('locked');
      // Show action buttons after cert pops up
      document.getElementById('ra2V2').style.display = 'flex';

      // ─── Save session results to backend API ───
      if(window.api && typeof window.api.isLoggedIn === 'function' && window.api.isLoggedIn()){
        try {
          // Determine mode and category
          let mode, category;
          if(window.__dictRound){
            mode = window.__dictRound.label || 'practice';
            category = window.__dictRound.filter || 'all';
          } else {
            mode = infiniteMode ? 'infinite' : 'normal';
            category = dictFilter;
          }
          const correct_count = practicedItems.filter(i => i.correct === true).length;
          const wrong_count = practicedItems.filter(i => i.correct === false).length;
          window.api.saveDictation({
            mode: mode,
            category: category,
            total_questions: total,
            correct_count: correct_count,
            wrong_count: wrong_count
          });
        } catch(e){
          console.warn('[dictation] Failed to save session:', e);
        }
      }
    }

    document.getElementById('cCloseV2').addEventListener('click', ()=>document.getElementById('certV2').classList.remove('show'));
    document.getElementById('rbV2').addEventListener('click', closeDictation);
    document.getElementById('rtV2').addEventListener('click', function(){
      document.getElementById('certV2').classList.remove('show');
      document.getElementById('reviewV2').classList.remove('active');
      document.getElementById('practiceV2').style.display = 'flex';
      // Clean up old overlay first, then restart fresh
      const oldOv = document.getElementById('dictOverlayV2');
      if(oldOv && oldOv.parentNode) oldOv.parentNode.removeChild(oldOv);
      startDictation();
    });

    // Launch
    newQuestion();
    listenThenWrite();
  }

  function closeDictation(){
    const ov = document.getElementById('dictOverlayV2');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
    if(currentAudio){currentAudio.pause();currentAudio=null}
    clearInterval(autoNextTimer);
    clearTimeout(idleTimer);
    try{document.exitFullscreen()}catch(e){}
    try{document.webkitExitFullscreen()}catch(e){}
    // If came from practice module, navigate back
    if(window.__dictRound && window.__dictRound.label){
      window.__dictRound = null;
      switchPage('practice');
    }
  }
})();
