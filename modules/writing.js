/* ═══════════════════════════════════════════════════════════════
   MODULE: writing — 字母书写（听写模式，与拼音听写对齐）
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  let currentAudio = null;
  let remainingQueue = [];
  let practicedItems = [];
  let questionNum = 0;
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
  let currentLetter = '';
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);

  function dn(py){ return py.replace('v','ü') }

  function getLetters(filter){
    if(filter==='all') return ALPHABET_DATA.map(d=>d.letter);
    if(filter==='vowel') return ALPHABET_DATA.filter(d=>d.vowel).map(d=>d.letter);
    return ALPHABET_DATA.filter(d=>!d.vowel).map(d=>d.letter);
  }

  function filterLabel(f){
    return f==='all'?'全部':f==='vowel'?'元音':'辅音';
  }
  function filterCount(f){
    return getLetters(f).length;
  }

  function cleanup(){
    if(currentAudio){currentAudio.pause();currentAudio=null}
    clearInterval(autoNextTimer);
    clearTimeout(idleTimer);
    const ov = document.getElementById('wrOverlay');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }

  registerModule('writing', {
    cleanup: cleanup,
    render: function(container){
      container.innerHTML = `
        <div class="section-title">✏️ 字母书写</div>
        <div class="section-subtitle">选择范围，开始全屏听写练习</div>
        <div class="dict-start" id="wrStart">
          <div class="dict-start-icon">✏️</div>
          <div class="dict-start-title">选择要练习的字母</div>
          <div class="dict-start-sub">播发音 → 手写字母 → 自评对错</div>
          <div class="dict-start-categories" id="wrCats">
            <button class="dict-start-category selected" data-filter="all"><span>全部</span> <span class="cat-count">26个</span></button>
            <button class="dict-start-category" data-filter="vowel"><span>元音</span> <span class="cat-count">5个</span></button>
            <button class="dict-start-category" data-filter="consonant"><span>辅音</span> <span class="cat-count">21个</span></button>
          </div>
          <button class="dict-start-btn ready" id="wrStartBtn">开始练习 全部</button>
        </div>
      `;
      const sc = container.querySelector('#wrCats');
      sc.querySelectorAll('.dict-start-category').forEach(btn=>{
        btn.addEventListener('click',function(){
          sc.querySelectorAll('.dict-start-category').forEach(b=>b.classList.remove('selected'));
          this.classList.add('selected');
          dictFilter = this.dataset.filter;
          const label = this.querySelector('span:first-child').textContent;
          const sb = container.querySelector('#wrStartBtn');
          sb.textContent = '开始练习 '+label;
        });
      });
      container.querySelector('#wrStartBtn').addEventListener('click', startDictation);
    }
  });

  /* ═══ CORE ═══ */
  function startDictation(){
    const letters = getLetters(dictFilter);
    remainingQueue = letters.sort(()=>Math.random()-0.5);
    practicedItems = [];
    questionNum = 0;
    hasWritten = false;

    // Inject overlay CSS once
    if(!document.getElementById('wrOvStyle')){
      const s = document.createElement('style');
      s.id = 'wrOvStyle';
      s.textContent = `
        .wo2{display:none;position:fixed;inset:0;z-index:1000;background:#f0f4ff;flex-direction:column;overscroll-behavior:none}
        .wo2.active{display:flex}
        .wt2{display:flex;align-items:center;justify-content:space-between;background:#fff;padding:max(8px,env(safe-area-inset-top)) 16px 8px;box-shadow:0 1px 4px rgba(0,0,0,.06);flex-shrink:0}
        .wt2-l{display:flex;align-items:center;gap:10px}
        .wb2{padding:4px 12px;border-radius:6px;background:#eef2ff;color:#6366f1;font-size:13px;font-weight:700}
        .wc2{font-size:13px;color:#94a3b8}
        .we2{padding:6px 16px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:13px;font-weight:600;cursor:pointer;color:#64748b}
        .we2:active{background:#f1f5f9}
        .wp2{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:10px}
        .ws2{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px}
        .wr2{display:none;padding:4px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#6366f1}
        .wr2.show{display:inline-block}
        .ww2{position:relative;width:min(600px,90vw);aspect-ratio:2/1;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden;border:2px solid #e2e8f0;transition:border-color .2s;display:flex;align-items:center;justify-content:center}
        .ww2.writing{border-color:#a5b4fc}
        .wl2{position:absolute;top:8px;left:12px;font-size:12px;color:#94a3b8;z-index:2;pointer-events:none}
        .wh2{width:100%;height:100%;display:block;touch-action:none;cursor:crosshair;position:absolute;top:0;left:0;z-index:10}
        .wtm2{position:absolute;bottom:10px;right:12px;font-size:14px;font-weight:800;color:#6366f1;z-index:8;display:none;pointer-events:none;background:rgba(255,255,255,.85);padding:2px 8px;border-radius:6px}
        .wtm2.show{display:block}
        .wro2{position:absolute;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:5;pointer-events:none}
        .wro2.show{display:flex}
        .wat2{font-size:clamp(40px,12vw,70px);font-weight:800;line-height:1;display:flex;gap:10px}
        .wat2 span{background:rgba(255,255,255,.85);padding:0 8px;border-radius:8px}
        .was2{font-size:14px;color:#94a3b8;margin-top:4px}
        .wnn2{display:none;padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .wnn2.show{display:inline-block}
        .wnn2:active{transform:scale(.95)}
        .wrv2{display:none;flex-direction:column;align-items:center;flex:1;overflow:hidden;padding:16px 16px 12px}
        .wrv2.active{display:flex}
        .wrv2-hdr{flex-shrink:0;text-align:center;width:100%;max-width:480px}
        .wrv2-t{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:2px}
        .wrv2-s{font-size:13px;color:#94a3b8;margin-bottom:12px}
        .wrv2-body{flex:1;overflow-y:auto;width:100%;max-width:480px;-webkit-overflow-scrolling:touch;scroll-behavior:smooth}
        .wrv2-body::-webkit-scrollbar{width:4px}
        .wrv2-body::-webkit-scrollbar-track{background:transparent}
        .wrv2-body::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:2px}
        .wrv2-ftr{flex-shrink:0;width:100%;max-width:480px;padding-top:8px;text-align:center}
        .wrv2-g{width:100%;max-width:480px;display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
        .wrc2{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.04);border:1px solid #f1f5f9}
        .wrc2 .letter{font-size:20px;font-weight:800;color:#1e293b;width:60px;text-align:center;flex-shrink:0}
        .wrc2 .li{width:48px;height:48px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;background:#fafafa}
        .wrc2 .le{width:48px;height:48px;border-radius:8px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:11px;color:#cbd5e1}
        .wrc2 .pg{display:flex;gap:6px;margin-left:auto}
        .wrc2 .pg button{width:44px;height:44px;border-radius:50%;border:2px solid #e2e8f0;font-size:20px;cursor:pointer;transition:all .15s;background:#fff;display:flex;align-items:center;justify-content:center}
        .wrc2 .pg button:active{transform:scale(.85)}
        .wrc2 .pg .gy.active{background:#dcfce7;color:#16a34a;border-color:#86efac}
        .wrc2 .pg .gn.active{background:#fee2e2;color:#dc2626;border-color:#fca5a5}
        .wrv2-g.locked .pg button{pointer-events:none;opacity:.5}
        .wrs2{font-size:clamp(16px,4vw,20px);font-weight:700;color:#1e293b;margin:8px 0}
        .wra2{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px}
        .wrb2,.wra2-btn{padding:12px 36px;border-radius:12px;border:none;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s}
        .wrb2{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .wra2-btn{background:#f1f5f9;color:#64748b}
        .wrb2:active,.wra2-btn:active{transform:scale(.95)}
        .wco2{display:none;position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.4);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:16px}
        .wco2.show{display:flex}
        .wcm2{background:#fff;border-radius:20px;padding:32px 24px 24px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15);animation:wcp2 .35s ease}
        @keyframes wcp2{0%{opacity:0;transform:scale(.8) translateY(20px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        .wcm2-t{font-size:24px;font-weight:800;color:#1e293b;margin-bottom:4px}
        .wcm2-s{font-size:48px;font-weight:800;color:#6366f1;margin:8px 0}
        .wcm2-s span{font-size:20px;font-weight:600;color:#94a3b8}
        .wcm2-st{font-size:28px;margin:4px 0 8px}
        .wcm2-m{font-size:15px;color:#64748b;margin-bottom:4px}
        .wcm2-d{font-size:12px;color:#94a3b8;margin-bottom:12px}
        .wcm2-b{padding:12px 36px;border-radius:12px;border:none;font-size:16px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
        .wcm2-b:active{transform:scale(.95)}
        /* Confirm modal */
        .wcf2{display:none;position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:16px}
        .wcf2.show{display:flex}
        .wcf2-box{background:#fff;border-radius:20px;padding:28px 24px 20px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.12);animation:wcp2 .25s ease}
        .wcf2-icon{font-size:36px;margin-bottom:8px}
        .wcf2-t{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:2px}
        .wcf2-sub{font-size:13px;color:#94a3b8;margin-bottom:18px}
        .wcf2-btns{display:flex;gap:10px;justify-content:center}
        .wcf2-cancel,.wcf2-ok{padding:10px 24px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;min-width:80px}
        .wcf2-cancel{background:#f1f5f9;color:#64748b}
        .wcf2-ok{background:#ef4444;color:#fff}
        .wcf2-cancel:active,.wcf2-ok:active{transform:scale(.95)}
      `;
      document.head.appendChild(s);
    }

    // Build overlay
    const ov = document.createElement('div');
    ov.id = 'wrOverlay';
    ov.className = 'wo2 active';
    ov.innerHTML = `
      <div class="wt2">
        <div class="wt2-l">
          <span class="wb2">${filterLabel(dictFilter)}</span>
          <span class="wc2" id="wrCountdown"></span>
        </div>
        <button class="we2" id="wrEndBtn">结束练习</button>
      </div>
      <div class="wp2" id="wrPractice" style="display:flex">
        <div class="ws2" id="wrStatus">
          <span style="font-size:18px" id="wrIcon">🔊</span>
          <span style="font-size:clamp(14px,3.5vw,18px);font-weight:700" id="wrText">准备开始...</span>
          <button class="wr2" id="wrReplay">🔁 重播</button>
        </div>
        <div class="ww2" id="wrWrap">
          <span class="wl2">✏️ 手写区（写大写或小写，自己决定）</span>
          <div class="wtm2" id="wrTimer"></div>
          <canvas class="wh2" id="wrCanvas"></canvas>
        </div>
        <button class="wnn2" id="wrNextBtn">继续下一题 ▶</button>
      </div>
      <div class="wrv2" id="wrReview">
        <div class="wrv2-hdr">
          <div class="wrv2-t">📝 练习报告</div>
          <div class="wrv2-s" id="wrRSub"></div>
        </div>
        <div class="wrv2-body" id="wrRBody">
          <div class="wrv2-g" id="wrRGrid"></div>
        </div>
        <div class="wrv2-ftr">
          <div class="wrs2" id="wrRSum"></div>
          <div class="wra2" id="wrRA2" style="display:none">
            <button class="wrb2" id="wrRBack">返回首页</button>
            <button class="wra2-btn" id="wrRRetry">🔄 再来一次</button>
          </div>
        </div>
      </div>
      <div class="wco2" id="wrCert">
        <div class="wcm2">
          <div class="wcm2-t">🎉 学习证书</div>
          <div class="wcm2-s" id="wrCScore">100 <span>/ 100</span></div>
          <div class="wcm2-st" id="wrCStars"></div>
          <div class="wcm2-m" id="wrCMsg"></div>
          <div class="wcm2-d" id="wrCDet"></div>
          <button class="wcm2-b" id="wrCClose">完成</button>
        </div>
      </div>
      <div class="wcf2" id="wrConfirm">
        <div class="wcf2-box">
          <div class="wcf2-icon">🤔</div>
          <div class="wcf2-t">确定结束练习吗？</div>
          <div class="wcf2-sub">未完成的题目将不计入成绩</div>
          <div class="wcf2-btns">
            <button class="wcf2-cancel" id="wrCfCancel">取消</button>
            <button class="wcf2-ok" id="wrCfOk">确定结束</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    try{document.documentElement.requestFullscreen()}catch(e){}
    try{document.documentElement.webkitRequestFullscreen()}catch(e){}

    // ─── CANVAS ───
    const can = document.getElementById('wrCanvas');
    const wrap = document.getElementById('wrWrap');

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
      wrap.className = 'ww2 writing';
      clearTimeout(idleTimer);
      document.getElementById('wrTimer').classList.remove('show');
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
      const tEl = document.getElementById('wrTimer');
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

    function clearCan(){
      if(canvasCtx) canvasCtx.clearRect(0, 0, can.width, can.height);
      allStrokes = [];
      currentStroke = [];
      hasWritten = false;
      wrap.className = 'ww2';
      clearTimeout(idleTimer);
      document.getElementById('wrTimer').classList.remove('show');
    }

    function getImg(){ return can.toDataURL('image/png'); }

    function setSt(icon, text){
      document.getElementById('wrIcon').textContent = icon;
      document.getElementById('wrText').textContent = text;
    }

    // ─── DICTATION FLOW ───
    function finishCurrent(){
      if(!currentLetter || roundBusy) return;
      roundBusy = true;
      clearTimeout(idleTimer);
      document.getElementById('wrReplay').classList.remove('show');
      const img = getImg();
      practicedItems.push({letter:currentLetter, image:img});
      clearCan();

      if(isIOS){
        setSt('👆','点继续继续下一题');
        document.getElementById('wrNextBtn').textContent = '继续下一题 ▶';
        document.getElementById('wrNextBtn').classList.add('show');
      } else {
        setSt('⏩','下一题...');
        setTimeout(nextRound, 600);
      }
    }

    function nextRound(){
      clearInterval(autoNextTimer);
      document.getElementById('wrNextBtn').classList.remove('show');
      if(remainingQueue.length > 0){
        newQuestion();
        setTimeout(listenThenWrite, 400);
      } else {
        showReview();
      }
    }

    function newQuestion(){
      if(remainingQueue.length === 0){ showReview(); return; }
      currentLetter = remainingQueue.shift();
      roundBusy = false;
      questionNum++;
      clearCan();
      document.getElementById('wrNextBtn').classList.remove('show');
      document.getElementById('wrReplay').classList.remove('show');
      const cd = document.getElementById('wrCountdown');
      cd.innerHTML = '剩余 <span style="font-weight:700;color:#6366f1">'+remainingQueue.length+'</span> / '+(questionNum+remainingQueue.length)+' 题';
      setSt('🔊','播放中...');
    }

    function listenThenWrite(){
      if(!currentLetter) return;
      setSt('🔊','播放中...');
      if(currentAudio){currentAudio.pause();currentAudio=null}
      const a = new Audio('audio/en/'+currentLetter.toLowerCase()+'.mp3');
      currentAudio = a;
      a.play().catch(()=>{});
      a.onended = function(){
        if(roundBusy) return;
        setSt('✏️','写下来（大写或小写均可）');
        wrap.className = 'ww2 writing';
        document.getElementById('wrReplay').classList.add('show');
      };
    }

    document.getElementById('wrNextBtn').addEventListener('click', nextRound);

    document.getElementById('wrReplay').addEventListener('click', function(){
      if(currentLetter){
        if(currentAudio) currentAudio.pause();
        const a = new Audio('audio/en/'+currentLetter.toLowerCase()+'.mp3');
        currentAudio = a;
        a.play().catch(()=>{});
      }
    });

    // End button → confirm modal
    document.getElementById('wrEndBtn').addEventListener('click', function(){
      document.getElementById('wrConfirm').classList.add('show');
    });
    document.getElementById('wrCfOk').addEventListener('click', function(){
      document.getElementById('wrConfirm').classList.remove('show');
      // Capture current unfinished item
      if(currentLetter && hasWritten){
        const last = practicedItems[practicedItems.length-1];
        if(!last || last.letter !== currentLetter){
          const img = getImg();
          if(img && img.length > 100) practicedItems.push({letter:currentLetter, image:img});
        }
      }
      showReview();
    });
    document.getElementById('wrCfCancel').addEventListener('click', function(){
      document.getElementById('wrConfirm').classList.remove('show');
    });

    // Start first question
    newQuestion();
    setTimeout(listenThenWrite, 400);

    // ─── REVIEW ───
    function showReview(){
      try{document.exitFullscreen()}catch(e){}
      try{document.webkitExitFullscreen()}catch(e){}

      document.getElementById('wrPractice').style.display = 'none';
      document.getElementById('wrReview').classList.add('active');
      document.getElementById('wrOverlay').querySelector('.wt2').style.display = 'none';
      document.getElementById('wrRSub').textContent = '共练习了 '+practicedItems.length+' 个字母，请批改：';
      document.getElementById('wrRGrid').innerHTML = practicedItems.map((item,i)=>{
        const hasImg = item.image && item.image.length > 100;
        const upper = item.letter.toUpperCase();
        const lower = item.letter.toLowerCase();
        return '<div class="wrc2" data-idx="'+i+'"><div class="letter">'+upper+' '+lower+'</div>'+
          (hasImg ? '<img class="li" src="'+item.image+'" alt="'+item.letter+'">' : '<div class="le">未书写</div>')+
          '<div class="pg"><button class="gy" data-idx="'+i+'" data-grade="correct">✔</button><button class="gn" data-idx="'+i+'" data-grade="wrong">✘</button></div></div>';
      }).join('');
      document.getElementById('wrRGrid').querySelectorAll('.pg button').forEach(btn=>{
        btn.addEventListener('click', function(){
          const grid = document.getElementById('wrRGrid');
          if(grid.classList.contains('locked')) return;
          const idx = parseInt(this.dataset.idx);
          const grade = this.dataset.grade;
          this.closest('.wrc2').querySelectorAll('button').forEach(b=>b.classList.remove('active'));
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

      document.getElementById('wrRSum').textContent = '批改 '+graded.length+'/'+total+' 题 · 正确 '+correct+'/'+(graded.length||1);

      if(graded.length === total && total > 0){
        const pct = Math.round(correct/total*100);
        const stars = pct>=90?'⭐⭐⭐':pct>=70?'⭐⭐':'⭐';
        const msg = pct>=90?'太棒了！':'继续加油！';
        document.getElementById('wrRA2').style.display = 'flex';
        document.getElementById('wrCert').classList.add('show');
        document.getElementById('wrCScore').innerHTML = correct+' <span>/ '+total+'</span>';
        document.getElementById('wrCStars').textContent = stars;
        document.getElementById('wrCMsg').textContent = msg;
        document.getElementById('wrCDet').textContent = '共 '+total+' 题 · 正确 '+correct+' 题 · 正确率 '+pct+'%';

        // ─── Save writing session to backend API ───
        if(window.api && typeof window.api.isLoggedIn === 'function' && window.api.isLoggedIn()){
          try {
            const details = practicedItems.map(item => ({
              item: item.letter,
              correct: item.correct === true
            }));
            window.api.saveDictation({
              mode: 'writing',
              category: 'alphabet',
              total_questions: total,
              correct_count: correct,
              wrong_count: total - correct,
              details: details
            }).catch(()=>{});
          } catch(e){
            console.warn('[writing] Failed to save session:', e);
          }
        }
      }
    }

    document.getElementById('wrRBack').addEventListener('click', function(){
      cleanup();
      switchPage('writing');
    });
    document.getElementById('wrRRetry').addEventListener('click', function(){
      cleanup();
      setTimeout(startDictation, 100);
    });
    document.getElementById('wrCClose').addEventListener('click', function(){
      document.getElementById('wrCert').classList.remove('show');
    });
  }

})();
