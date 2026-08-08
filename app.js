/* ═══════════════════════════════════════════════════════════════
   APP — Core: navigation, data, router
   ═══════════════════════════════════════════════════════════════ */
const $=s=>document.getElementById(s);
const qa=(s,c)=>c?c.querySelectorAll(s):document.querySelectorAll(s);
const q1=(s,c)=>c?c.querySelector(s):document.querySelector(s);

/* ─── SHARED PINYIN DATA ───────────────────────────────────── */
const PINYIN_DATA = {
  shengmu: ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'],
  yunmu: ['a','o','e','i','u','v','ai','ei','ui','ao','ou','iu','ie','ve','er','an','en','in','un','vn','ang','eng','ing','ong'],
  zhengti: ['zhi','chi','shi','ri','zi','ci','si','yi','wu','yu','ye','yue','yuan','yin','yun','ying']
};
function dn(py){return py.replace('v','ü')}
function catName(c){return{shengmu:'声母',yunmu:'韵母',zhengti:'整体认读'}[c]||'全部'}

/* ─── SHARED ALPHABET DATA ─────────────────────────────────── */
const ALPHABET_DATA = [
  {letter:'A',word:'apple',emoji:'🍎',vowel:true},
  {letter:'B',word:'ball',emoji:'⚽',vowel:false},
  {letter:'C',word:'cat',emoji:'🐱',vowel:false},
  {letter:'D',word:'dog',emoji:'🐕',vowel:false},
  {letter:'E',word:'egg',emoji:'🥚',vowel:true},
  {letter:'F',word:'fish',emoji:'🐟',vowel:false},
  {letter:'G',word:'girl',emoji:'👧',vowel:false},
  {letter:'H',word:'hat',emoji:'🎩',vowel:false},
  {letter:'I',word:'ice',emoji:'🧊',vowel:true},
  {letter:'J',word:'juice',emoji:'🧃',vowel:false},
  {letter:'K',word:'kite',emoji:'🪁',vowel:false},
  {letter:'L',word:'lion',emoji:'🦁',vowel:false},
  {letter:'M',word:'moon',emoji:'🌙',vowel:false},
  {letter:'N',word:'nose',emoji:'👃',vowel:false},
  {letter:'O',word:'orange',emoji:'🍊',vowel:true},
  {letter:'P',word:'pig',emoji:'🐷',vowel:false},
  {letter:'Q',word:'queen',emoji:'👑',vowel:false},
  {letter:'R',word:'rabbit',emoji:'🐰',vowel:false},
  {letter:'S',word:'sun',emoji:'☀️',vowel:false},
  {letter:'T',word:'tree',emoji:'🌳',vowel:false},
  {letter:'U',word:'umbrella',emoji:'☂️',vowel:true},
  {letter:'V',word:'violin',emoji:'🎻',vowel:false},
  {letter:'W',word:'water',emoji:'💧',vowel:false},
  {letter:'X',word:'x-ray',emoji:'🔬',vowel:false},
  {letter:'Y',word:'yoyo',emoji:'🪀',vowel:false},
  {letter:'Z',word:'zebra',emoji:'🦓',vowel:false}
];

/* ─── NAV GROUP ────────────────────────────────────────────── */
const NAV_GROUPS = {
  pinyin: {leafPages:['syllable-table','listening','dictation','memory-tricks','study-plan','tones','blending']},
  english: {leafPages:['alphabet','writing']}
};
let currentNav = 'pinyin';

/* ─── MODULE REGISTRY ──────────────────────────────────────── */
const modules = {};
function registerModule(name, api){ modules[name]=api }

let currentPage = '';

/* ─── NAVIGATION ───────────────────────────────────────────── */
function switchNav(nav){
  if(currentNav===nav) return;
  currentNav = nav;
  // Update top nav buttons
  qa('.top-main[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===nav));
  qa('.nav-top[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===nav));
  // Show/hide sub groups
  qa('[data-nav-group]').forEach(el=>el.style.display=el.dataset.navGroup===nav?'':'none');
}

function switchPage(page){
  if(currentPage===page) return;
  // Cleanup current module
  if(modules[currentPage] && modules[currentPage].cleanup){
    try{ modules[currentPage].cleanup() }catch(e){}
  }
  currentPage = page;
  // Update nav leaf active states
  qa('.nav-leaf').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  qa('.top-leaf').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  // Auto-switch nav group if the page belongs to a different group
  for(const [nav, group] of Object.entries(NAV_GROUPS)){
    if(group.leafPages.includes(page)){
      switchNav(nav);
      break;
    }
  }
  // Render
  const app = $('app');
  if(modules[page] && modules[page].render){
    modules[page].render(app);
  }else{
    app.innerHTML = `<div class="placeholder-page"><div class="icon">🏗️</div><h2>加载中...</h2></div>`;
  }
}

/* ─── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',function(){
  // Top-level nav clicks (sidebar + topbar)
  qa('.nav-top[data-nav], .top-main[data-nav]').forEach(el=>{
    el.addEventListener('click',function(){
      const nav = this.dataset.nav;
      // Switch to first page of that group
      const group = NAV_GROUPS[nav];
      if(group && group.leafPages.length > 0){
        switchPage(group.leafPages[0]);
      }
    });
  });
  // Nav leaf clicks
  qa('.nav-leaf').forEach(el=>{
    el.addEventListener('click',function(){
      if(this.dataset.page) switchPage(this.dataset.page);
    });
  });
  qa('.top-leaf').forEach(el=>{
    el.addEventListener('click',function(){
      if(this.dataset.page) switchPage(this.dataset.page);
    });
  });
  // Load default
  switchPage('syllable-table');

  // ─── DYNAMIC TOPBAR HEIGHT (mobile) ────────────────────────────
  function fixTopbarSpacing(){
    const topbar = document.getElementById('topbar');
    const content = document.getElementById('app');
    if(!topbar || !content) return;
    const h = topbar.offsetHeight;
    content.style.marginTop = h > 0 ? h + 'px' : '';
  }
  // Observe topbar size changes (sub-bar may wrap on small screens)
  if(window.ResizeObserver){
    const ro = new ResizeObserver(fixTopbarSpacing);
    const topbar = document.getElementById('topbar');
    if(topbar) ro.observe(topbar);
  }
  // Also fix on orientation change / resize
  window.addEventListener('orientationchange', function(){ setTimeout(fixTopbarSpacing, 200) });
  window.addEventListener('resize', fixTopbarSpacing);
  // Initial fix after render settles
  setTimeout(fixTopbarSpacing, 100);
});
window.switchPage = switchPage;
