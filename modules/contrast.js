/* ═══════════════════════════════════════════════════════════════
   MODULE: contrast — 对比精学
   ═══════════════════════════════════════════════════════════════ */
(function(){
  let currentAudio = null;
  let activeFilter = 'all';
  let mastered = {};
  let needsPractice = {};

  const PAIRS = [
    {a:'zh', b:'z', label:'平翘舌'},
    {a:'ch', b:'c', label:'平翘舌'},
    {a:'sh', b:'s', label:'平翘舌'},
    {a:'b', b:'p', label:'送气音'},
    {a:'d', b:'t', label:'送气音'},
    {a:'g', b:'k', label:'送气音'},
    {a:'an', b:'ang', label:'前后鼻音'},
    {a:'en', b:'eng', label:'前后鼻音'},
    {a:'in', b:'ing', label:'前后鼻音'},
    {a:'ui', b:'ei', label:'易混韵母'},
    {a:'iu', b:'ou', label:'易混韵母'},
    {a:'ie', b:'ve', label:'易混韵母'},
    {a:'ai', b:'ei', label:'易混韵母'},
    {a:'ao', b:'ou', label:'易混韵母'}
  ];

  const GROUPS = [
    {key:'all', label:'全部'},
    {key:'平翘舌', label:'平翘舌'},
    {key:'送气音', label:'送气音'},
    {key:'前后鼻音', label:'前后鼻音'},
    {key:'易混韵母', label:'易混韵母'}
  ];

  function getGroupCount(key){
    if(key === 'all') return PAIRS.length;
    return PAIRS.filter(p => p.label === key).length;
  }

  function getFilteredPairs(){
    if(activeFilter === 'all') return PAIRS;
    return PAIRS.filter(p => p.label === activeFilter);
  }

  function playPinyin(py){
    if(currentAudio){ currentAudio.pause(); currentAudio = null; }
    const a = new Audio('audio/'+py+'.mp3');
    currentAudio = a;
    a.play().catch(function(){});
  }

  function getPairKey(pair, idx){
    return pair.a + '-' + pair.b + '-' + idx;
  }

  function cleanup(){
    if(currentAudio){ currentAudio.pause(); currentAudio = null; }
  }

  registerModule('contrast', {
    cleanup: cleanup,
    render: function(container){
      // Inject contrast styles once
      if(!document.getElementById('contrastStyle')){
        var s = document.createElement('style');
        s.id = 'contrastStyle';
        s.textContent = `
          .contrast-filters{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px 4px}
          .contrast-filter{padding:5px 14px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s}
          .contrast-filter:active{transform:scale(.94)}
          .contrast-filter.active{background:#6366f1;color:#fff;border-color:#6366f1}
          .contrast-filter .count{color:#94a3b8;font-size:11px;margin-left:2px}
          .contrast-filter.active .count{color:rgba(255,255,255,.7)}
          .contrast-progress{display:flex;align-items:center;gap:10px;margin:0 0 16px 4px}
          .contrast-progress-bar{flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden}
          .contrast-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:4px;transition:width .4s ease;width:0%}
          .contrast-progress-text{font-size:13px;font-weight:700;color:#6366f1;white-space:nowrap}
          .contrast-list{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
          .contrast-pair{background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9;transition:all .3s}
          .contrast-pair.mastered{opacity:.5;background:#f8fafc;border-color:#e2e8f0}
          .contrast-pair .pair-cards{display:flex;gap:10px;margin-bottom:10px}
          .contrast-pair .pair-card{flex:1;display:flex;flex-direction:column;align-items:center;padding:12px 8px 8px;border-radius:10px;background:#f8fafc;border:1.5px solid #e2e8f0;transition:all .2s;cursor:pointer;position:relative}
          .contrast-pair .pair-card:active{transform:scale(.95)}
          .contrast-pair .pair-card.playing{background:#6366f1;color:#fff;border-color:#6366f1;box-shadow:0 3px 12px rgba(99,102,241,.25)}
          .contrast-pair .pair-pinyin{font-size:clamp(22px,5.5vw,30px);font-weight:800;line-height:1.2}
          .contrast-pair .pair-play{font-size:12px;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:3px}
          .contrast-pair .pair-card.playing .pair-play{color:rgba(255,255,255,.7)}
          .contrast-pair .pair-label{text-align:center;font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px;letter-spacing:1px}
          .contrast-pair .pair-actions{display:flex;gap:8px;justify-content:center}
          .contrast-pair .pair-btn{padding:7px 20px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
          .contrast-pair .pair-btn:active{transform:scale(.94)}
          .contrast-pair .pair-btn.master{background:#dcfce7;color:#16a34a;border:1.5px solid #86efac}
          .contrast-pair .pair-btn.practice{background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0}
          .contrast-pair .pair-btn.master:active,.contrast-pair .pair-btn.practice:active{opacity:.7}
          .contrast-pair.mastered .pair-btn.master{background:#16a34a;color:#fff;border-color:#16a34a}
          .contrast-pair.mastered .pair-btn.practice{display:none}
          .contrast-complete{display:none;flex-direction:column;align-items:center;padding:32px 16px;text-align:center;animation:fadeSlide .4s ease}
          .contrast-complete.show{display:flex}
          .contrast-complete-icon{font-size:48px;margin-bottom:8px}
          .contrast-complete-title{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:4px}
          .contrast-complete-sub{font-size:14px;color:#94a3b8;margin-bottom:16px}
          .contrast-complete-pairs{width:100%;max-width:400px;display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
          .contrast-complete-pair{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#fff;border-radius:10px;border:1px solid #f1f5f9}
          .contrast-complete-pair .py{font-size:16px;font-weight:700;color:#1e293b}
          .contrast-complete-pair .tag{padding:2px 10px;border-radius:6px;font-size:11px;font-weight:600}
          .contrast-complete-pair .tag.practice{background:#fee2e2;color:#dc2626}
          .contrast-complete-btn{padding:12px 36px;border-radius:12px;border:none;font-size:15px;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3);transition:all .2s}
          .contrast-complete-btn:active{transform:scale(.95)}
          .contrast-section-title{font-size:13px;font-weight:700;color:#64748b;margin:0 0 8px 4px;padding-top:4px}
        `;
        document.head.appendChild(s);
      }

      mastered = {};
      needsPractice = {};

      var html = '<div class="section-title">⚡ 对比精学</div>';
      html += '<div class="section-subtitle">对比易混拼音对，逐个攻克</div>';

      // Filter tabs
      html += '<div class="contrast-filters" id="cfFilters">';
      GROUPS.forEach(function(g){
        var count = g.key === 'all' ? '' : '<span class="count">'+getGroupCount(g.key)+'</span>';
        html += '<button class="contrast-filter'+(g.key==='all'?' active':'')+'" data-filter="'+g.key+'">'+g.label+count+'</button>';
      });
      html += '</div>';

      // Progress
      html += '<div class="contrast-progress" id="cfProgress">';
      html += '<div class="contrast-progress-bar"><div class="contrast-progress-fill" id="cfProgressFill"></div></div>';
      html += '<span class="contrast-progress-text" id="cfProgressText">已掌握 0/'+PAIRS.length+'</span>';
      html += '</div>';

      // Pair list
      html += '<div class="contrast-list" id="cfList"></div>';

      // Completed section
      html += '<div class="contrast-section-title" id="cfCompletedTitle" style="display:none">✅ 已掌握</div>';
      html += '<div class="contrast-list" id="cfCompletedList"></div>';

      // Completion screen
      html += '<div class="contrast-complete" id="cfComplete">';
      html += '<div class="contrast-complete-icon">🎉</div>';
      html += '<div class="contrast-complete-title">全部完成！</div>';
      html += '<div class="contrast-complete-sub" id="cfCompleteSub">你已经掌握了所有拼音对</div>';
      html += '<div class="contrast-complete-pairs" id="cfCompletePairs"></div>';
      html += '<button class="contrast-complete-btn" id="cfRestartBtn">🔄 重新挑战</button>';
      html += '</div>';

      container.innerHTML = html;

      // Bind filter clicks
      container.querySelectorAll('.contrast-filter').forEach(function(btn){
        btn.addEventListener('click', function(){
          container.querySelectorAll('.contrast-filter').forEach(function(b){ b.classList.remove('active'); });
          this.classList.add('active');
          activeFilter = this.dataset.filter;
          reindexPairs(container);
        });
      });

      // Bind restart
      container.querySelector('#cfRestartBtn').addEventListener('click', function(){
        mastered = {};
        needsPractice = {};
        reindexPairs(container);
      });

      // Render pairs
      reindexPairs(container);
    }
  });

  function reindexPairs(container){
    var list = container.querySelector('#cfList');
    var completedList = container.querySelector('#cfCompletedList');
    var completedTitle = container.querySelector('#cfCompletedTitle');
    var progressFill = container.querySelector('#cfProgressFill');
    var progressText = container.querySelector('#cfProgressText');
    var completeEl = container.querySelector('#cfComplete');

    var pairs = getFilteredPairs();
    var masterCount = 0;
    var totalCount = pairs.length;

    var activeHtml = '';
    var completedHtml = '';

    pairs.forEach(function(pair, idx){
      var pk = getPairKey(pair, idx);
      var isMastered = mastered[pk] === true;
      var isPractice = needsPractice[pk] === true;

      if(isMastered) masterCount++;

      var cardClass = 'contrast-pair' + (isMastered ? ' mastered' : '');

      var card = '<div class="'+cardClass+'" data-pk="'+pk+'">';
      card += '<div class="pair-label">'+pair.label+'</div>';
      card += '<div class="pair-cards">';
      card += '<div class="pair-card" data-py="'+pair.a+'"><div class="pair-pinyin">'+dn(pair.a)+'</div><div class="pair-play">🔊 点击播放</div></div>';
      card += '<div class="pair-card" data-py="'+pair.b+'"><div class="pair-pinyin">'+dn(pair.b)+'</div><div class="pair-play">🔊 点击播放</div></div>';
      card += '</div>';
      card += '<div class="pair-actions">';
      card += '<button class="pair-btn master" data-action="master">👍 掌握了</button>';
      card += '<button class="pair-btn practice" data-action="practice">🔄 再练练</button>';
      card += '</div></div>';

      if(isMastered){
        completedHtml += card;
      } else {
        activeHtml += card;
      }
    });

    list.innerHTML = activeHtml;

    if(completedHtml){
      completedList.innerHTML = completedHtml;
      completedList.style.display = '';
      completedTitle.style.display = '';
    } else {
      completedList.innerHTML = '';
      completedList.style.display = 'none';
      completedTitle.style.display = 'none';
    }

    // Update progress
    var m = Object.keys(mastered).filter(function(k){ return mastered[k]; }).length;
    var totalAll = PAIRS.length;
    var pct = totalAll > 0 ? Math.round(m/totalAll*100) : 0;
    progressFill.style.width = pct+'%';
    progressText.textContent = '已掌握 '+m+'/'+totalAll;

    // Show/hide completion screen
    var allDone = activeFilter === 'all' ? (m >= totalAll) : (masterCount >= totalCount && totalCount > 0);
    if(allDone && activeFilter === 'all'){
      list.style.display = 'none';
      completedList.style.display = 'none';
      completedTitle.style.display = 'none';
      completeEl.classList.add('show');
      renderComplete(container);
    } else {
      list.style.display = '';
      completeEl.classList.remove('show');
    }

    // Bind card clicks (play pinyin)
    bindCardPlays(container);
    // Bind action buttons
    bindActionBtns(container);
  }

  function bindCardPlays(container){
    container.querySelectorAll('.pair-card').forEach(function(card){
      card.addEventListener('click', function(){
        var py = this.dataset.py;
        playPinyin(py);
        // Visual feedback
        container.querySelectorAll('.pair-card').forEach(function(c){ c.classList.remove('playing'); });
        this.classList.add('playing');
        var self = this;
        setTimeout(function(){ self.classList.remove('playing'); }, 800);
      });
    });
  }

  function bindActionBtns(container){
    container.querySelectorAll('.pair-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var pairEl = this.closest('.contrast-pair');
        var pk = pairEl.dataset.pk;
        var action = this.dataset.action;

        if(action === 'master'){
          mastered[pk] = true;
          delete needsPractice[pk];
        } else if(action === 'practice'){
          needsPractice[pk] = true;
          delete mastered[pk];
        }

        reindexPairs(container);
      });
    });
  }

  function renderComplete(container){
    var pairsEl = container.querySelector('#cfCompletePairs');
    var sub = container.querySelector('#cfCompleteSub');

    var practicePairs = PAIRS.filter(function(pair, idx){
      var pk = getPairKey(pair, idx);
      return needsPractice[pk] === true;
    });

    if(practicePairs.length > 0){
      sub.textContent = '以下拼音对还需要再练练：';
      pairsEl.innerHTML = practicePairs.map(function(p){
        return '<div class="contrast-complete-pair"><span class="py">'+dn(p.a)+' — '+dn(p.b)+'</span><span class="tag practice">再练练</span></div>';
      }).join('');
      pairsEl.style.display = '';
    } else {
      sub.textContent = '你已全部掌握，太棒了！🎉';
      pairsEl.style.display = 'none';
    }
  }
})();
