/* ═══════════════════════════════════════════════════════════════
   MODULE: memory-tricks — 记忆技巧（四大子模块）
   ═══════════════════════════════════════════════════════════════ */
(function(){

/* ─── HELPERS ──────────────────────────────────────────────── */
function dn(py){ return py.replace('v','ü') }
let mneShuffle = false, mneShuffled = {};

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function playPinyin(py){
  if(window.api && typeof window.api.track === 'function') window.api.track('memory-tricks', py);
  if(window._mtAudio){ window._mtAudio.pause(); window._mtAudio=null }
  const a = new Audio(`../audio/${py}.mp3`);
  window._mtAudio = a;
  return new Promise(r=>{
    let done=false;
    function once(){if(!done){done=true;r()}}
    a.onended=once; a.onerror=once;
    a.play().catch(once);
    setTimeout(once,6000);
  });
}

/* ─── DATA: 相似音对比 ─────────────────────────────────────── */
const SOUND_COMPARISONS = [
  {id:'bp', label:'双唇音 · 不送气/送气', items:['b','p'], tip:'b 纸不动，p 纸动'},
  {id:'dt', label:'舌尖中音 · 不送气/送气', items:['d','t'], tip:'d 纸不动，t 纸动'},
  {id:'gk', label:'舌根音 · 不送气/送气', items:['g','k'], tip:'g 纸不动，k 纸动'},
  {id:'jq', label:'舌面音 · 不送气/送气', items:['j','q'], tip:'j 纸不动，q 纸动'},
  {id:'zhch', label:'舌尖后音 · 不送气/送气', items:['zh','ch'], tip:'zh 纸不动，ch 纸动'},
  {id:'zc', label:'舌尖前音 · 不送气/送气', items:['z','c'], tip:'z 纸不动，c 纸动'},
  {id:'z_zh', label:'平舌 vs 翘舌', items:['z','zh'], tip:'z 舌尖抵下齿，zh 舌尖卷起'},
  {id:'c_ch', label:'平舌 vs 翘舌', items:['c','ch'], tip:'c 舌尖抵下齿，ch 舌尖卷起'},
  {id:'s_sh', label:'平舌 vs 翘舌', items:['s','sh'], tip:'s 舌尖抵下齿，sh 舌尖卷起'},
  {id:'nl', label:'鼻音 vs 边音', items:['n','l'], tip:'n 气流从鼻出，l 气流从舌两侧'},
  {id:'fh', label:'唇齿音 vs 舌根音', items:['f','h'], tip:'f 上齿咬下唇，h 舌根抬起'},
  {id:'an_ang', label:'前鼻音 vs 后鼻音', items:['an','ang'], tip:'an 舌尖抵上齿龈，ang 舌根抬起'},
  {id:'en_eng', label:'前鼻音 vs 后鼻音', items:['en','eng'], tip:'en 舌尖抵上齿龈，eng 舌根抬起'},
  {id:'in_ing', label:'前鼻音 vs 后鼻音', items:['in','ing'], tip:'in 舌尖抵上齿龈，ing 舌根抬起'},
];

/* ─── DATA: 发音部位分组 ──────────────────────────────────── */
const POSITION_GROUPS = {
  shengmu: [
    {name:'双唇音', desc:'上下唇闭合', items:['b','p','m'], color:'#ef4444'},
    {name:'唇齿音', desc:'上齿咬下唇', items:['f'], color:'#f97316'},
    {name:'舌尖前音', desc:'舌尖抵上齿背', items:['z','c','s'], color:'#eab308'},
    {name:'舌尖中音', desc:'舌尖抵上齿龈', items:['d','t','n','l'], color:'#22c55e'},
    {name:'舌尖后音', desc:'舌尖卷起抵硬腭', items:['zh','ch','sh','r'], color:'#06b6d4'},
    {name:'舌面音', desc:'舌面抬起抵硬腭', items:['j','q','x'], color:'#6366f1'},
    {name:'舌根音', desc:'舌根抵软腭', items:['g','k','h'], color:'#a855f7'}
  ],
  yunmu: [
    {name:'开口呼', desc:'嘴巴张大', items:['a','o','e','er','ai','ei','ao','ou','an','en','ang','eng'], color:'#ec4899'},
    {name:'齐齿呼', desc:'上下齿对齐', items:['i','iu','ie','in','ing'], color:'#14b8a6'},
    {name:'合口呼', desc:'双唇收圆', items:['u','ui','un','ong'], color:'#8b5cf6'},
    {name:'撮口呼', desc:'嘴唇撮起', items:['v','ve','vn'], color:'#f43f5e'}
  ],
  zhengti: [
    {name:'翘舌组', desc:'翘舌整体认读', items:['zhi','chi','shi','ri'], color:'#06b6d4'},
    {name:'平舌组', desc:'平舌整体认读', items:['zi','ci','si'], color:'#eab308'},
    {name:'i系', desc:'以y(i)开头', items:['yi','ye','yin','ying'], color:'#14b8a6'},
    {name:'u/ü系', desc:'以w(u)/y(ü)开头', items:['wu','yu','yue','yuan','yun'], color:'#8b5cf6'},
  ]
};

/* ─── DATA: 记忆口诀 ───────────────────────────────────────── */
const MNEMONICS = {
  // ─── 声母（23个） ───
  b:{m:'右下半圆 b b b',w:'播'}, p:{m:'右上半圆 p p p',w:'爬'},
  m:{m:'两个门洞 m m m',w:'门'}, f:{m:'一根拐棍 f f f',w:'佛'},
  d:{m:'左下半圆 d d d',w:'得'}, t:{m:'伞柄朝下 t t t',w:'特'},
  n:{m:'一个门洞 n n n',w:'你'}, l:{m:'一根小棍 l l l',w:'了'},
  g:{m:'9字加弯 g g g',w:'鸽'}, k:{m:'一挺机枪 k k k',w:'蝌'},
  h:{m:'一把椅子 h h h',w:'喝'}, j:{m:'竖弯加点 j j j',w:'鸡'},
  q:{m:'左上半圆 q q q',w:'七'}, x:{m:'一个叉子 x x x',w:'西'},
  zh:{m:'小房子 zh zh zh',w:'织'}, ch:{m:'小椅子 ch ch ch',w:'吃'},
  sh:{m:'大狮子 sh sh sh',w:'狮'}, r:{m:'小草发芽 r r r',w:'日'},
  z:{m:'2字拐弯 z z z',w:'字'}, c:{m:'小小圆圈 c c c',w:'刺'},
  s:{m:'半个8字 s s s',w:'丝'}, y:{m:'小树发芽 y y y',w:'衣'},
  w:{m:'屋顶小屋 w w w',w:'屋'},
  // ─── 单韵母（6个） ───
  a:{m:'张大嘴巴 a a a',w:'啊'}, o:{m:'圆圆嘴巴 o o o',w:'喔'},
  e:{m:'扁扁嘴巴 e e e',w:'鹅'}, i:{m:'牙齿对齐 i i i',w:'衣'},
  u:{m:'突出小嘴 u u u',w:'乌'}, v:{m:'小鱼吐泡 ü ü ü',w:'鱼'},
  // ─── 复韵母（8个） ───
  ai:{m:'阿姨阿姨 ai ai ai',w:'爱'}, ei:{m:'用力用力 ei ei ei',w:'欸'},
  ui:{m:'围巾围巾 ui ui ui',w:'围'}, ao:{m:'棉袄棉袄 ao ao ao',w:'袄'},
  ou:{m:'莲藕莲藕 ou ou ou',w:'藕'}, iu:{m:'游泳游泳 iu iu iu',w:'游'},
  ie:{m:'椰子椰子 ie ie ie',w:'椰'}, ve:{m:'月亮月亮 üe üe üe',w:'月'},
  // ─── 特殊韵母（1个） ───
  er:{m:'耳朵耳朵 er er er',w:'耳'},
  // ─── 前鼻韵母（5个） ───
  an:{m:'小山小山 an an an',w:'安'}, en:{m:'小门小门 en en en',w:'摁'},
  in:{m:'树荫树荫 in in in',w:'荫'}, un:{m:'温温温温 un un un',w:'温'},
  vn:{m:'白云白云 ün ün ün',w:'云'},
  // ─── 后鼻韵母（4个） ───
  ang:{m:'仰头仰头 ang ang ang',w:'昂'}, eng:{m:'台灯台灯 eng eng eng',w:'灯'},
  ing:{m:'老鹰老鹰 ing ing ing',w:'鹰'}, ong:{m:'大钟大钟 ong ong ong',w:'钟'},
  // ─── 整体认读（16个） ───
  zhi:{m:'知知知 整体读不用拼',w:'知'}, chi:{m:'吃吃吃 整体读不用拼',w:'吃'},
  shi:{m:'诗诗诗 整体读不用拼',w:'诗'}, ri:{m:'日日日 整体读不用拼',w:'日'},
  zi:{m:'资资资 整体读不用拼',w:'资'}, ci:{m:'词词词 整体读不用拼',w:'词'},
  si:{m:'丝丝丝 整体读不用拼',w:'丝'},
  yi:{m:'衣衣衣 整体读不用拼',w:'衣'}, wu:{m:'乌乌乌 整体读不用拼',w:'乌'},
  yu:{m:'鱼鱼鱼 整体读不用拼',w:'鱼'},
  ye:{m:'椰椰椰 整体读不用拼',w:'椰'}, yue:{m:'月月月 整体读不用拼',w:'月'},
  yuan:{m:'圆圆圆 整体读不用拼',w:'圆'},
  yin:{m:'因因因 整体读不用拼',w:'因'}, yun:{m:'云云云 整体读不用拼',w:'云'},
  ying:{m:'鹰鹰鹰 整体读不用拼',w:'鹰'}
};

/* ─── STYLES (injected once) ───────────────────────────────── */
const MT_STYLE_ID = 'mt-styles';
function injectStyles(){
  if(document.getElementById(MT_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = MT_STYLE_ID;
  s.textContent = `
    .mt-index{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;padding:20px 0;animation:fadeSlide .3s ease}
    .mt-card{border-radius:16px;background:#fff;padding:24px;cursor:pointer;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.06);text-align:center;border:2px solid transparent}
    .mt-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
    .mt-card:active{transform:scale(.96)}
    .mt-card-icon{font-size:36px;margin-bottom:8px}
    .mt-card-title{font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px}
    .mt-card-desc{font-size:13px;color:#94a3b8;line-height:1.5}
    .mt-card[data-card="position"]{border-color:#c7d2fe}
    .mt-card[data-card="position"]:hover{border-color:#6366f1}
    .mt-card[data-card="compare"]{border-color:#fecaca}
    .mt-card[data-card="compare"]:hover{border-color:#ef4444}
    .mt-card[data-card="quiz"]{border-color:#bbf7d0}
    .mt-card[data-card="quiz"]:hover{border-color:#22c55e}
    .mt-card[data-card="mnemonic"]{border-color:#fde68a}
    .mt-card[data-card="mnemonic"]:hover{border-color:#f59e0b}

    /* Back button */
    .mt-back{padding:6px 16px;border:none;border-radius:8px;background:#f1f5f9;font-size:13px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;display:inline-flex;align-items:center;gap:4px;margin-bottom:12px}
    .mt-back:hover{background:#e2e8f0}
    .mt-back:active{transform:scale(.95)}
    .mt-header{display:flex;align-items:center;gap:10px;margin-bottom:14px}
    .mt-header h2{font-size:clamp(16px,3.5vw,20px);font-weight:800;color:#1e293b;margin:0}
    .mt-header .mt-sub{font-size:13px;color:#94a3b8;margin-left:auto}

    /* Position groups */
    .mt-pos-tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
    .mt-pos-tabs::-webkit-scrollbar{display:none}
    .mt-pos-tab{padding:6px 16px;border:none;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;transition:all .2s;white-space:nowrap;flex-shrink:0}
    .mt-pos-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
    .mt-pos-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
    .mt-pos-tab.active::after{content:'';display:block;height:3px;background:#6366f1;border-radius:3px 3px 0 0;margin-top:4px}
    .mt-pos-grid{display:flex;flex-direction:column;gap:10px}
    .mt-pos-group{border-radius:12px;padding:12px 14px;color:#fff}
    .mt-pos-group-name{font-size:14px;font-weight:700;margin-bottom:2px}
    .mt-pos-group-desc{font-size:11px;opacity:.85;margin-bottom:8px}
    .mt-pos-items{display:flex;gap:6px;flex-wrap:wrap}
    .mt-pos-item{width:48px;height:52px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,.25);cursor:pointer;transition:all .2s;font-size:18px;font-weight:700;border:none;color:#fff;backdrop-filter:blur(4px)}
    .mt-pos-item:hover{transform:scale(1.12)}
    .mt-pos-item:active{transform:scale(.9)}
    .mt-pos-item .mt-pos-label{font-size:9px;opacity:.7;margin-top:1px}

    /* Sound compare */
    .mt-compare-grid{display:flex;flex-direction:column;gap:12px}
    .mt-compare-row{border-radius:12px;background:#fff;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.04);border:1px solid #f1f5f9}
    .mt-compare-label{font-size:12px;font-weight:600;color:#64748b;margin-bottom:6px}
    .mt-compare-items{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .mt-compare-cmp{display:flex;align-items:center;gap:8px;padding:6px 14px 6px 10px;border-radius:10px;background:#f8fafc;border:1.5px solid #e2e8f0;cursor:pointer;transition:all .2s}
    .mt-compare-cmp:hover{background:#eef2ff;border-color:#c7d2fe}
    .mt-compare-cmp:active{transform:scale(.93)}
    .mt-compare-cmp.playing{background:#6366f1;color:#fff;border-color:#6366f1}
    .mt-compare-cmp .mt-cmp-py{font-size:20px;font-weight:700}
    .mt-compare-cmp .mt-cmp-icon{font-size:11px;color:#a5b4fc}
    .mt-compare-cmp.playing .mt-cmp-icon{color:rgba(255,255,255,.6)}
    .mt-compare-tip{font-size:12px;color:#94a3b8;margin-top:6px;padding-left:4px;border-left:3px solid #e2e8f0;padding-left:8px}

    /* Listen quiz */
    .mt-quiz-setup{background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.06);text-align:center;max-width:460px;margin:20px auto}
    .mt-quiz-setup-icon{font-size:40px;margin-bottom:8px}
    .mt-quiz-setup h3{font-size:17px;font-weight:700;color:#1e293b;margin-bottom:16px}
    .mt-quiz-cats{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:16px}
    .mt-quiz-cat{padding:8px 18px;border:2px solid #e2e8f0;border-radius:10px;background:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;color:#1e293b}
    .mt-quiz-cat:hover{border-color:#6366f1}
    .mt-quiz-cat.selected{border-color:#6366f1;background:#eef2ff;color:#6366f1}
    .mt-quiz-start{padding:12px 36px;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 16px rgba(99,102,241,.3)}
    .mt-quiz-start:active{transform:scale(.95)}
    .mt-quiz-start:disabled{background:#cbd5e1;cursor:default;box-shadow:none}
    .mt-quiz-area{text-align:center;padding:20px 0}
    .mt-quiz-progress{font-size:13px;color:#94a3b8;margin-bottom:16px}
    .mt-quiz-answer{font-size:clamp(48px,14vw,80px);font-weight:800;color:#6366f1;min-height:clamp(60px,16vw,90px);display:flex;align-items:center;justify-content:center;margin-bottom:16px;transition:all .3s}
    .mt-quiz-answer.showing{animation:certPop .3s ease}
    .mt-quiz-options{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:380px;margin:0 auto 16px}
    .mt-quiz-opt{padding:14px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;font-size:22px;font-weight:700;cursor:pointer;transition:all .15s}
    .mt-quiz-opt:hover{border-color:#a5b4fc;background:#f8faff}
    .mt-quiz-opt:active{transform:scale(.92)}
    .mt-quiz-opt.correct{background:#dcfce7;border-color:#86efac;color:#16a34a;transform:scale(1.03)}
    .mt-quiz-opt.wrong{background:#fee2e2;border-color:#fca5a5;color:#dc2626}
    .mt-quiz-opt.reveal{background:#f1f5f9;border-color:#cbd5e1;color:#64748b;cursor:default}
    .mt-quiz-opt.disabled{pointer-events:none}
    .mt-quiz-score{display:flex;gap:20px;justify-content:center;margin-bottom:16px}
    .mt-quiz-score div{text-align:center}
    .mt-quiz-score .num{font-size:28px;font-weight:800}
    .mt-quiz-score .lbl{font-size:12px;color:#94a3b8}
    .mt-quiz-score .num.correct{color:#22c55e}
    .mt-quiz-score .num.wrong{color:#ef4444}
    .mt-quiz-score .num.remain{color:#6366f1}
    .mt-quiz-next{padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(99,102,241,.3);margin-top:4px}
    .mt-quiz-next:active{transform:scale(.95)}
    .mt-quiz-finish{text-align:center;padding:20px 0}
    .mt-quiz-finish .big{font-size:48px;margin-bottom:8px}
    .mt-quiz-finish .score{font-size:36px;font-weight:800;color:#6366f1}
    .mt-quiz-finish .detail{font-size:14px;color:#94a3b8;margin:4px 0 16px}
    .mt-quiz-retry{padding:10px 28px;border:none;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(99,102,241,.3)}
    .mt-quiz-retry:active{transform:scale(.95)}

    /* Mnemonics */
    .mt-mne-tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
    .mt-mne-tabs::-webkit-scrollbar{display:none}
    .mt-mne-tab{padding:6px 16px;border:none;border-radius:8px 8px 0 0;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;transition:all .2s;white-space:nowrap;flex-shrink:0}
    .mt-mne-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
    .mt-mne-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
    .mt-mne-tab.active::after{content:'';display:block;height:3px;background:#6366f1;border-radius:3px 3px 0 0;margin-top:4px}
    .mt-mne-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
    .mt-mne-card{border-radius:12px;background:#fff;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.04);border:1px solid #f1f5f9;cursor:pointer;transition:all .2s;text-align:center}
    .mt-mne-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
    .mt-mne-card:active{transform:scale(.95)}
    .mt-mne-py{font-size:22px;font-weight:800;color:#6366f1}
    .mt-mne-word{font-size:24px;font-weight:700;color:#1e293b;margin:2px 0}
    .mt-mne-tip{font-size:12px;color:#94a3b8;margin-top:2px}
    .mt-mne-card.playing{background:#6366f1;color:#fff;transform:scale(1.08);box-shadow:0 4px 16px rgba(99,102,241,.35)}
    .mt-mne-card.playing .mt-mne-py{color:#fff}
    .mt-mne-card.playing .mt-mne-word{color:#fff}
    .mt-mne-card.playing .mt-mne-tip{color:rgba(255,255,255,.7)}

    /* Shuffle btn for mnemonics */
    .mne-shuffle-btn{
      padding:5px 12px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;
      font-size:12px;font-weight:600;cursor:pointer;color:#64748b;transition:all .2s;
      display:inline-flex;align-items:center;gap:3px;white-space:nowrap;flex-shrink:0;margin-left:auto
    }
    .mne-shuffle-btn:hover{border-color:#a5b4fc;color:#6366f1}
    .mne-shuffle-btn.active{background:#eef2ff;color:#6366f1;border-color:#a5b4fc}
  `;
  document.head.appendChild(s);
}

/* ─── RENDER: INDEX (4 cards) ─────────────────────────────── */
function renderIndex(container){
  container.innerHTML = `
    <div class="section-title">🧠 记忆技巧</div>
    <div class="section-subtitle">选择一种记忆方法，让拼音学习更轻松</div>
    <div class="mt-index">
      <div class="mt-card" data-card="position" data-sub="position">
        <div class="mt-card-icon">🎨</div>
        <div class="mt-card-title">发音部位分组</div>
        <div class="mt-card-desc">按发音位置分类学习，颜色编码一目了然</div>
      </div>
      <div class="mt-card" data-card="compare" data-sub="compare">
        <div class="mt-card-icon">🔄</div>
        <div class="mt-card-title">相似音对比</div>
        <div class="mt-card-desc">对比易混淆拼音，听差异辨发音</div>
      </div>
      <div class="mt-card" data-card="quiz" data-sub="quiz">
        <div class="mt-card-icon">🎯</div>
        <div class="mt-card-title">听音选卡</div>
        <div class="mt-card-desc">播放随机拼音，四选一自测</div>
      </div>
      <div class="mt-card" data-card="mnemonic" data-sub="mnemonic">
        <div class="mt-card-icon">💡</div>
        <div class="mt-card-title">记忆口诀</div>
        <div class="mt-card-desc">象形联想口诀，记拼音不再难</div>
      </div>
    </div>
  `;
  container.querySelectorAll('.mt-card').forEach(el=>{
    el.addEventListener('click',function(){
      const sub = this.dataset.sub;
      renderSub(container, sub);
    });
  });
}

/* ─── RENDER SUB HEADER ───────────────────────────────────── */
function renderSubHeader(container, title, subtitle, extra){
  const h = document.createElement('div');
  h.className = 'mt-header';
  h.innerHTML = `<button class="mt-back" id="mtBackBtn">← 返回</button><h2>${title}</h2>${subtitle ? `<span class="mt-sub">${subtitle}</span>` : ''}${extra || ''}`;
  h.querySelector('#mtBackBtn').addEventListener('click', ()=>renderIndex(container));
  return h;
}

/* ═══════════════════════════════════════════════════════════════
   SUB 1: 发音部位分组
   ═══════════════════════════════════════════════════════════════ */
let posCurrentTab = 'shengmu';
function renderPosition(container){
  posCurrentTab = 'shengmu';
  const catKeys = Object.keys(POSITION_GROUPS);
  const header = renderSubHeader(container, '🎨 发音部位分组', '点卡片听发音');
  container.innerHTML = '';
  container.appendChild(header);
  const tabsDiv = document.createElement('div');
  tabsDiv.className = 'mt-pos-tabs';
  tabsDiv.innerHTML = catKeys.map(k=>`<button class="mt-pos-tab${k==='shengmu'?' active':''}" data-pos="${k}">${k==='shengmu'?'声母':k==='yunmu'?'韵母':'整体认读'}</button>`).join('');
  container.appendChild(tabsDiv);
  const gridDiv = document.createElement('div');
  gridDiv.className = 'mt-pos-grid';
  container.appendChild(gridDiv);
  renderPosGroups(gridDiv, 'shengmu');
  tabsDiv.addEventListener('click', e=>{
    const tab = e.target.closest('.mt-pos-tab');
    if(!tab || tab.classList.contains('active')) return;
    tabsDiv.querySelectorAll('.mt-pos-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const cat = tab.dataset.pos;
    renderPosGroups(gridDiv, cat);
  });
}

function renderPosGroups(grid, cat){
  const groups = POSITION_GROUPS[cat] || [];
  grid.innerHTML = groups.map(g=>`
    <div class="mt-pos-group" style="background:${g.color}">
      <div class="mt-pos-group-name">${g.name}</div>
      <div class="mt-pos-group-desc">${g.desc}</div>
      <div class="mt-pos-items">
        ${g.items.map(py=>`<button class="mt-pos-item" data-py="${py}"><span>${dn(py)}</span><span class="mt-pos-label">▶</span></button>`).join('')}
      </div>
    </div>
  `).join('');
  grid.querySelectorAll('.mt-pos-item').forEach(el=>{
    el.addEventListener('click', function(){
      grid.querySelectorAll('.mt-pos-item').forEach(c=>c.style.transform='');
      this.style.transform='scale(1.15)';
      playPinyin(this.dataset.py).then(()=>this.style.transform='');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   SUB 2: 相似音对比
   ═══════════════════════════════════════════════════════════════ */
function renderCompare(container){
  const header = renderSubHeader(container, '🔄 相似音对比', '点击对比听差异');
  container.innerHTML = '';
  container.appendChild(header);
  const grid = document.createElement('div');
  grid.className = 'mt-compare-grid';
  container.appendChild(grid);
  grid.innerHTML = SOUND_COMPARISONS.map(cmp => `
    <div class="mt-compare-row">
      <div class="mt-compare-label">${cmp.label}</div>
      <div class="mt-compare-items">
        ${cmp.items.map(py=>`
          <button class="mt-compare-cmp" data-py="${py}">
            <span class="mt-cmp-py">${dn(py)}</span>
            <span class="mt-cmp-icon">▶</span>
          </button>
        `).join('')}
        <span style="color:#cbd5e1;font-size:13px;margin:0 2px">|</span>
        <button class="mt-compare-cmp play-all-btn" data-all="${cmp.items.join(',')}" style="background:#eef2ff;border-color:#c7d2fe;font-size:12px;font-weight:600;color:#6366f1">
          ▶ 连播对比
        </button>
      </div>
      <div class="mt-compare-tip">💡 ${cmp.tip}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.mt-compare-cmp:not(.play-all-btn)').forEach(el=>{
    el.addEventListener('click', function(){
      const row = this.closest('.mt-compare-row');
      row.querySelectorAll('.mt-compare-cmp').forEach(c=>c.classList.remove('playing'));
      this.classList.add('playing');
      playPinyin(this.dataset.py).then(()=>this.classList.remove('playing'));
    });
  });
  grid.querySelectorAll('.play-all-btn').forEach(el=>{
    el.addEventListener('click', async function(){
      const items = this.dataset.all.split(',');
      for(const py of items){
        await playPinyin(py);
        await new Promise(r=>setTimeout(r,300));
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   SUB 3: 听音选卡
   ═══════════════════════════════════════════════════════════════ */
let quizState = null;

function renderQuiz(container){
  const header = renderSubHeader(container, '🎯 听音选卡', '听声音，选拼音');
  container.innerHTML = '';
  container.appendChild(header);
  const setup = document.createElement('div');
  container.appendChild(setup);
  showQuizSetup(setup);
}

function showQuizSetup(container){
  container.innerHTML = `
    <div class="mt-quiz-setup">
      <div class="mt-quiz-setup-icon">🎯</div>
      <h3>选择出题范围</h3>
      <div class="mt-quiz-cats">
        <button class="mt-quiz-cat selected" data-range="all">全部</button>
        <button class="mt-quiz-cat" data-range="shengmu">声母</button>
        <button class="mt-quiz-cat" data-range="yunmu">韵母</button>
        <button class="mt-quiz-cat" data-range="zhengti">整体认读</button>
      </div>
      <button class="mt-quiz-start" id="quizStartBtn" disabled>开始答题</button>
    </div>
  `;
  const cats = container.querySelector('.mt-quiz-cats');
  const startBtn = container.querySelector('#quizStartBtn');
  cats.addEventListener('click', e=>{
    const cat = e.target.closest('.mt-quiz-cat');
    if(!cat) return;
    cats.querySelectorAll('.mt-quiz-cat').forEach(c=>c.classList.remove('selected'));
    cat.classList.add('selected');
    startBtn.disabled = false;
  });
  startBtn.addEventListener('click', ()=>{
    const selected = container.querySelector('.mt-quiz-cat.selected');
    startQuiz(container, selected.dataset.range);
  });
}

function getQuizItems(range){
  if(range === 'all'){
    return [...PINYIN_DATA.shengmu, ...PINYIN_DATA.yunmu, ...PINYIN_DATA.zhengti];
  }
  return [...PINYIN_DATA[range]];
}

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function startQuiz(container, range){
  const items = getQuizItems(range);
  if(items.length < 4){
    container.innerHTML = `<div class="mt-quiz-setup"><p style="color:#dc2626">该分类拼音不足4个，无法出题</p><button class="mt-quiz-start" onclick="window._mtBackToQuiz()" style="margin-top:12px">返回选择</button></div>`;
    return;
  }
  const totalQ = Math.min(10, items.length);
  const questionPool = shuffleArray(items).slice(0, totalQ);
  quizState = {
    pool: questionPool,
    current: 0,
    correct: 0,
    wrong: 0,
    answered: false,
    range: range,
    total: totalQ
  };
  showQuizQuestion(container);
}

function showQuizQuestion(container){
  const state = quizState;
  const py = state.pool[state.current];
  const allItems = getQuizItems(state.range);
  // Generate wrong options
  let wrongOptions = shuffleArray(allItems.filter(i => i !== py)).slice(0, 3);
  // Shuffle all 4 options
  const options = shuffleArray([py, ...wrongOptions]);

  container.innerHTML = `
    <div class="mt-quiz-area">
      <div class="mt-quiz-progress">第 ${state.current+1}/${state.total} 题</div>
      <div class="mt-quiz-score">
        <div><div class="num correct" id="qScoreC">${state.correct}</div><div class="lbl">✅ 正确</div></div>
        <div><div class="num wrong" id="qScoreW">${state.wrong}</div><div class="lbl">❌ 错误</div></div>
        <div><div class="num remain" id="qScoreR">${state.total - state.current}</div><div class="lbl">剩余</div></div>
      </div>
      <div class="mt-quiz-answer" id="quizAnswer">🔊 听声音... <span style="font-size:14px;display:block;color:#94a3b8;margin-top:4px">点击下方▼播放</span></div>
      <div class="mt-quiz-options" id="quizOptions">
        ${options.map((opt,i)=>`<button class="mt-quiz-opt" data-opt="${opt}" data-idx="${i}">${dn(opt)}</button>`).join('')}
      </div>
      <button class="mt-quiz-next" id="quizNextBtn" style="display:none">下一题 →</button>
    </div>
  `;

  // Play audio after a short delay
  setTimeout(()=>{
    playPinyin(py).catch(()=>{});
  }, 400);

  let answered = false;
  const opts = container.querySelectorAll('.mt-quiz-opt');
  opts.forEach(el => {
    el.addEventListener('click', function(){
      if(answered) return;
      answered = true;
      state.answered = true;
      const chosen = this.dataset.opt;
      const correct = chosen === py;
      opts.forEach(o => o.classList.add('disabled'));
      this.classList.add(correct ? 'correct' : 'wrong');
      // Reveal the correct answer
      opts.forEach(o => {
        if(o.dataset.opt === py) o.classList.add('correct');
        if(o !== this && o.dataset.opt !== py) o.classList.add('reveal');
      });
      if(correct) state.correct++; else state.wrong++;
      document.getElementById('qScoreC').textContent = state.correct;
      document.getElementById('qScoreW').textContent = state.wrong;
      const answerDiv = document.getElementById('quizAnswer');
      answerDiv.innerHTML = correct ? '✅ 正确！' : `❌ 正确答案：<span style="font-size:clamp(40px,10vw,60px);color:#6366f1">${dn(py)}</span>`;
      answerDiv.className = 'mt-quiz-answer showing';
      // Show next/finish button
      const nextBtn = document.getElementById('quizNextBtn');
      const isLast = state.current >= state.total - 1;
      nextBtn.textContent = isLast ? '查看结果 📊' : '下一题 →';
      nextBtn.style.display = 'inline-block';
    });
  });

  const nextBtn = container.querySelector('#quizNextBtn');
  nextBtn.addEventListener('click', function(){
    state.current++;
    if(state.current >= state.total){
      showQuizResult(container);
    } else {
      showQuizQuestion(container);
    }
  });
}

function showQuizResult(container){
  const state = quizState;
  const total = state.total;
  const correct = state.correct;
  const pct = Math.round(correct / total * 100);
  let emoji = '😢';
  let msg = '再练练！';
  if(pct >= 90) { emoji = '🏆'; msg = '太棒了！'; }
  else if(pct >= 70) { emoji = '🌟'; msg = '不错哦！'; }
  else if(pct >= 50) { emoji = '💪'; msg = '继续加油！'; }
  container.innerHTML = `
    <div class="mt-quiz-finish">
      <div class="big">${emoji}</div>
      <div class="score">${correct}/${total}</div>
      <div class="detail">${msg} 正确率 ${pct}%</div>
      <button class="mt-quiz-retry" id="quizRetryBtn">🔁 再来一次</button>
      <button class="mt-quiz-retry" id="quizBackBtn" style="background:#f1f5f9;color:#64748b;box-shadow:none;margin-left:8px">← 返回</button>
    </div>
  `;
  container.querySelector('#quizRetryBtn').addEventListener('click', ()=>{
    const range = state.range;
    const items = getQuizItems(range);
    const totalQ = Math.min(10, items.length);
    const questionPool = shuffleArray(items).slice(0, totalQ);
    quizState = {
      pool: questionPool,
      current: 0,
      correct: 0,
      wrong: 0,
      answered: false,
      range: range,
      total: totalQ
    };
    showQuizQuestion(container);
  });
  container.querySelector('#quizBackBtn').addEventListener('click', ()=>{
    renderSub(container, 'quiz');
  });
}

/* ═══════════════════════════════════════════════════════════════
   SUB 4: 记忆口诀
   ═══════════════════════════════════════════════════════════════ */
function renderMnemonic(container){
  mneShuffle = false; mneShuffled = {};
  const catKeys = ['shengmu','yunmu','zhengti'];
  const shuffleHtml = `<button class="mne-shuffle-btn" id="mneShuffleBtn">🔀 打乱顺序</button>`;
  const header = renderSubHeader(container, '💡 记忆口诀', '点击卡片听发音+看口诀', shuffleHtml);
  container.innerHTML = '';
  container.appendChild(header);
  // Wire shuffle button
  const sb = container.querySelector('#mneShuffleBtn');
  sb.addEventListener('click', function(){
    mneShuffle = !mneShuffle;
    const curCat = container.querySelector('.mt-mne-tab.active').dataset.mne;
    if(mneShuffle){
      mneShuffled[curCat] = shuffleArray(PINYIN_DATA[curCat] || []);
      sb.classList.add('active');
      sb.innerHTML = '🔀 已打乱';
    } else {
      delete mneShuffled[curCat];
      sb.classList.remove('active');
      sb.innerHTML = '🔀 打乱顺序';
    }
    renderMneGrid(container.querySelector('.mt-mne-grid'), curCat);
  });
  const tabsDiv = document.createElement('div');
  tabsDiv.className = 'mt-mne-tabs';
  tabsDiv.innerHTML = catKeys.map(k=>`<button class="mt-mne-tab${k==='shengmu'?' active':''}" data-mne="${k}">${k==='shengmu'?'声母':k==='yunmu'?'韵母':'整体认读'}</button>`).join('');
  container.appendChild(tabsDiv);
  const gridDiv = document.createElement('div');
  gridDiv.className = 'mt-mne-grid';
  container.appendChild(gridDiv);
  renderMneGrid(gridDiv, 'shengmu');
  tabsDiv.addEventListener('click', e=>{
    const tab = e.target.closest('.mt-mne-tab');
    if(!tab || tab.classList.contains('active')) return;
    tabsDiv.querySelectorAll('.mt-mne-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    // Reset shuffle on tab switch
    mneShuffle = false; mneShuffled = {};
    const sb = container.querySelector('#mneShuffleBtn');
    if(sb){ sb.classList.remove('active'); sb.innerHTML = '🔀 打乱顺序'; }
    renderMneGrid(gridDiv, tab.dataset.mne);
  });
}

function renderMneGrid(grid, cat){
  let items = PINYIN_DATA[cat] || [];
  if(mneShuffle && mneShuffled[cat]) items = mneShuffled[cat];
  grid.innerHTML = items.map(py => {
    const m = MNEMONICS[py];
    if(!m) return '';
    return `
      <div class="mt-mne-card" data-py="${py}">
        <div class="mt-mne-py">${dn(py)}</div>
        ${m.w ? `<div class="mt-mne-word">${m.w}</div>` : ''}
        <div class="mt-mne-tip">${m.m || ''}</div>
      </div>
    `;
  }).filter(Boolean).join('');
  grid.querySelectorAll('.mt-mne-card').forEach(el=>{
    el.addEventListener('click', function(){
      grid.querySelectorAll('.mt-mne-card').forEach(c=>c.classList.remove('playing'));
      this.classList.add('playing');
      playPinyin(this.dataset.py).then(()=>this.classList.remove('playing'));
    });
  });
}

/* ─── DISPATCH ─────────────────────────────────────────────── */
function renderSub(container, sub){
  injectStyles();
  switch(sub){
    case 'position': renderPosition(container); break;
    case 'compare': renderCompare(container); break;
    case 'quiz': renderQuiz(container); break;
    case 'mnemonic': renderMnemonic(container); break;
    default: renderIndex(container);
  }
}

/* ─── REGISTER MODULE ──────────────────────────────────────── */
registerModule('memory-tricks', {
  render: function(container){
    injectStyles();
    renderIndex(container);
  },
  cleanup: function(){
    if(window._mtAudio){ window._mtAudio.pause(); window._mtAudio = null }
  }
});

window._mtBackToQuiz = function(){ renderSub(document.getElementById('app'), 'quiz'); };

})();
