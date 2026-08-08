/* ═══════════════════════════════════════════════════════════════
   MODULE: syllable-table — 音节表
   网格表展示所有声母×韵母的有效组合
   点击格子 → 弹窗选择四个声调播放
   整体认读音节直接播整体
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  let currentAudio = null;
  let playing = false;

  /* ─── 整体认读音节 ────────────────────────────────────────── */
  const ZHENG_TI = new Set([
    'zhi','chi','shi','ri','zi','ci','si',
    'yi','wu','yu','ye','yue','yuan','yin','yun','ying'
  ]);

  /* ─── 音节库 ──────────────────────────────────────────────── */
  const SYLLABLE_DATA = [
    {s:"ba",i:"b",f:"a"},{s:"bo",i:"b",f:"o"},{s:"bi",i:"b",f:"i"},{s:"bu",i:"b",f:"u"},{s:"bai",i:"b",f:"ai"},{s:"bei",i:"b",f:"ei"},{s:"bao",i:"b",f:"ao"},{s:"ban",i:"b",f:"an"},{s:"ben",i:"b",f:"en"},{s:"bang",i:"b",f:"ang"},{s:"beng",i:"b",f:"eng"},{s:"bie",i:"b",f:"ie"},{s:"biao",i:"b",f:"iao"},{s:"bian",i:"b",f:"ian"},{s:"bin",i:"b",f:"in"},{s:"bing",i:"b",f:"ing"},
    {s:"pa",i:"p",f:"a"},{s:"po",i:"p",f:"o"},{s:"pi",i:"p",f:"i"},{s:"pu",i:"p",f:"u"},{s:"pai",i:"p",f:"ai"},{s:"pei",i:"p",f:"ei"},{s:"pao",i:"p",f:"ao"},{s:"pou",i:"p",f:"ou"},{s:"pan",i:"p",f:"an"},{s:"pen",i:"p",f:"en"},{s:"pang",i:"p",f:"ang"},{s:"peng",i:"p",f:"eng"},{s:"pie",i:"p",f:"ie"},{s:"piao",i:"p",f:"iao"},{s:"pian",i:"p",f:"ian"},{s:"pin",i:"p",f:"in"},{s:"ping",i:"p",f:"ing"},
    {s:"ma",i:"m",f:"a"},{s:"mo",i:"m",f:"o"},{s:"me",i:"m",f:"e"},{s:"mi",i:"m",f:"i"},{s:"mu",i:"m",f:"u"},{s:"mai",i:"m",f:"ai"},{s:"mei",i:"m",f:"ei"},{s:"mao",i:"m",f:"ao"},{s:"mou",i:"m",f:"ou"},{s:"man",i:"m",f:"an"},{s:"men",i:"m",f:"en"},{s:"mang",i:"m",f:"ang"},{s:"meng",i:"m",f:"eng"},{s:"mie",i:"m",f:"ie"},{s:"miao",i:"m",f:"iao"},{s:"miu",i:"m",f:"iu"},{s:"mian",i:"m",f:"ian"},{s:"min",i:"m",f:"in"},{s:"ming",i:"m",f:"ing"},
    {s:"fa",i:"f",f:"a"},{s:"fo",i:"f",f:"o"},{s:"fu",i:"f",f:"u"},{s:"fei",i:"f",f:"ei"},{s:"fou",i:"f",f:"ou"},{s:"fan",i:"f",f:"an"},{s:"fen",i:"f",f:"en"},{s:"fang",i:"f",f:"ang"},{s:"feng",i:"f",f:"eng"},
    {s:"da",i:"d",f:"a"},{s:"de",i:"d",f:"e"},{s:"di",i:"d",f:"i"},{s:"du",i:"d",f:"u"},{s:"dai",i:"d",f:"ai"},{s:"dei",i:"d",f:"ei"},{s:"dao",i:"d",f:"ao"},{s:"dou",i:"d",f:"ou"},{s:"dan",i:"d",f:"an"},{s:"den",i:"d",f:"en"},{s:"dang",i:"d",f:"ang"},{s:"deng",i:"d",f:"eng"},{s:"die",i:"d",f:"ie"},{s:"dia",i:"d",f:"ia"},{s:"diao",i:"d",f:"iao"},{s:"diu",i:"d",f:"iu"},{s:"dian",i:"d",f:"ian"},{s:"duo",i:"d",f:"uo"},{s:"dui",i:"d",f:"ui"},{s:"duan",i:"d",f:"uan"},{s:"dun",i:"d",f:"un"},{s:"dong",i:"d",f:"ong"},{s:"ding",i:"d",f:"ing"},
    {s:"ta",i:"t",f:"a"},{s:"te",i:"t",f:"e"},{s:"ti",i:"t",f:"i"},{s:"tu",i:"t",f:"u"},{s:"tai",i:"t",f:"ai"},{s:"tao",i:"t",f:"ao"},{s:"tou",i:"t",f:"ou"},{s:"tan",i:"t",f:"an"},{s:"tang",i:"t",f:"ang"},{s:"teng",i:"t",f:"eng"},{s:"tie",i:"t",f:"ie"},{s:"tiao",i:"t",f:"iao"},{s:"tian",i:"t",f:"ian"},{s:"tuo",i:"t",f:"uo"},{s:"tui",i:"t",f:"ui"},{s:"tuan",i:"t",f:"uan"},{s:"tun",i:"t",f:"un"},{s:"tong",i:"t",f:"ong"},{s:"ting",i:"t",f:"ing"},
    {s:"na",i:"n",f:"a"},{s:"ne",i:"n",f:"e"},{s:"ni",i:"n",f:"i"},{s:"nu",i:"n",f:"u"},{s:"nü",i:"n",f:"ü"},{s:"nai",i:"n",f:"ai"},{s:"nei",i:"n",f:"ei"},{s:"nao",i:"n",f:"ao"},{s:"nou",i:"n",f:"ou"},{s:"nan",i:"n",f:"an"},{s:"nen",i:"n",f:"en"},{s:"nang",i:"n",f:"ang"},{s:"neng",i:"n",f:"eng"},{s:"nie",i:"n",f:"ie"},{s:"niao",i:"n",f:"iao"},{s:"niu",i:"n",f:"iu"},{s:"nian",i:"n",f:"ian"},{s:"nin",i:"n",f:"in"},{s:"niang",i:"n",f:"iang"},{s:"ning",i:"n",f:"ing"},{s:"nuo",i:"n",f:"uo"},{s:"nuan",i:"n",f:"uan"},{s:"nong",i:"n",f:"ong"},{s:"nüe",i:"n",f:"üe"},
    {s:"la",i:"l",f:"a"},{s:"lo",i:"l",f:"o"},{s:"le",i:"l",f:"e"},{s:"li",i:"l",f:"i"},{s:"lu",i:"l",f:"u"},{s:"lü",i:"l",f:"ü"},{s:"lai",i:"l",f:"ai"},{s:"lei",i:"l",f:"ei"},{s:"lao",i:"l",f:"ao"},{s:"lou",i:"l",f:"ou"},{s:"lan",i:"l",f:"an"},{s:"lang",i:"l",f:"ang"},{s:"leng",i:"l",f:"eng"},{s:"lie",i:"l",f:"ie"},{s:"lia",i:"l",f:"ia"},{s:"liao",i:"l",f:"iao"},{s:"liu",i:"l",f:"iu"},{s:"lian",i:"l",f:"ian"},{s:"lin",i:"l",f:"in"},{s:"liang",i:"l",f:"iang"},{s:"ling",i:"l",f:"ing"},{s:"luo",i:"l",f:"uo"},{s:"luan",i:"l",f:"uan"},{s:"lun",i:"l",f:"un"},{s:"long",i:"l",f:"ong"},{s:"lüe",i:"l",f:"üe"},
    {s:"ga",i:"g",f:"a"},{s:"ge",i:"g",f:"e"},{s:"gu",i:"g",f:"u"},{s:"gai",i:"g",f:"ai"},{s:"gei",i:"g",f:"ei"},{s:"gao",i:"g",f:"ao"},{s:"gou",i:"g",f:"ou"},{s:"gan",i:"g",f:"an"},{s:"gen",i:"g",f:"en"},{s:"gang",i:"g",f:"ang"},{s:"geng",i:"g",f:"eng"},{s:"gua",i:"g",f:"ua"},{s:"guo",i:"g",f:"uo"},{s:"guai",i:"g",f:"uai"},{s:"gui",i:"g",f:"ui"},{s:"guan",i:"g",f:"uan"},{s:"gun",i:"g",f:"un"},{s:"guang",i:"g",f:"uang"},{s:"gong",i:"g",f:"ong"},
    {s:"ka",i:"k",f:"a"},{s:"ke",i:"k",f:"e"},{s:"ku",i:"k",f:"u"},{s:"kai",i:"k",f:"ai"},{s:"kei",i:"k",f:"ei"},{s:"kao",i:"k",f:"ao"},{s:"kou",i:"k",f:"ou"},{s:"kan",i:"k",f:"an"},{s:"ken",i:"k",f:"en"},{s:"kang",i:"k",f:"ang"},{s:"keng",i:"k",f:"eng"},{s:"kua",i:"k",f:"ua"},{s:"kuo",i:"k",f:"uo"},{s:"kuai",i:"k",f:"uai"},{s:"kui",i:"k",f:"ui"},{s:"kuan",i:"k",f:"uan"},{s:"kun",i:"k",f:"un"},{s:"kuang",i:"k",f:"uang"},{s:"kong",i:"k",f:"ong"},
    {s:"ha",i:"h",f:"a"},{s:"he",i:"h",f:"e"},{s:"hu",i:"h",f:"u"},{s:"hai",i:"h",f:"ai"},{s:"hei",i:"h",f:"ei"},{s:"hao",i:"h",f:"ao"},{s:"hou",i:"h",f:"ou"},{s:"han",i:"h",f:"an"},{s:"hen",i:"h",f:"en"},{s:"hang",i:"h",f:"ang"},{s:"heng",i:"h",f:"eng"},{s:"hua",i:"h",f:"ua"},{s:"huo",i:"h",f:"uo"},{s:"huai",i:"h",f:"uai"},{s:"hui",i:"h",f:"ui"},{s:"huan",i:"h",f:"uan"},{s:"hun",i:"h",f:"un"},{s:"huang",i:"h",f:"uang"},{s:"hong",i:"h",f:"ong"},
    {s:"ji",i:"j",f:"i"},{s:"ju",i:"j",f:"ü"},{s:"jia",i:"j",f:"ia"},{s:"jie",i:"j",f:"ie"},{s:"jiao",i:"j",f:"iao"},{s:"jiu",i:"j",f:"iu"},{s:"jian",i:"j",f:"ian"},{s:"jin",i:"j",f:"in"},{s:"jiang",i:"j",f:"iang"},{s:"jing",i:"j",f:"ing"},{s:"jue",i:"j",f:"üe"},{s:"juan",i:"j",f:"üan"},{s:"jun",i:"j",f:"ün"},{s:"jiong",i:"j",f:"iong"},
    {s:"qi",i:"q",f:"i"},{s:"qu",i:"q",f:"ü"},{s:"qia",i:"q",f:"ia"},{s:"qie",i:"q",f:"ie"},{s:"qiao",i:"q",f:"iao"},{s:"qiu",i:"q",f:"iu"},{s:"qian",i:"q",f:"ian"},{s:"qin",i:"q",f:"in"},{s:"qiang",i:"q",f:"iang"},{s:"qing",i:"q",f:"ing"},{s:"que",i:"q",f:"üe"},{s:"quan",i:"q",f:"üan"},{s:"qun",i:"q",f:"ün"},{s:"qiong",i:"q",f:"iong"},
    {s:"xi",i:"x",f:"i"},{s:"xu",i:"x",f:"ü"},{s:"xia",i:"x",f:"ia"},{s:"xie",i:"x",f:"ie"},{s:"xiao",i:"x",f:"iao"},{s:"xiu",i:"x",f:"iu"},{s:"xian",i:"x",f:"ian"},{s:"xin",i:"x",f:"in"},{s:"xiang",i:"x",f:"iang"},{s:"xing",i:"x",f:"ing"},{s:"xue",i:"x",f:"üe"},{s:"xuan",i:"x",f:"üan"},{s:"xun",i:"x",f:"ün"},{s:"xiong",i:"x",f:"iong"},
    {s:"zhi",i:"zh",f:"i"},{s:"chi",i:"ch",f:"i"},{s:"shi",i:"sh",f:"i"},{s:"ri",i:"r",f:"i"},{s:"zi",i:"z",f:"i"},{s:"ci",i:"c",f:"i"},{s:"si",i:"s",f:"i"},{s:"yi",i:"y",f:"i"},{s:"wu",i:"w",f:"u"},{s:"yu",i:"y",f:"ü"},
    {s:"zha",i:"zh",f:"a"},{s:"zhe",i:"zh",f:"e"},{s:"zhu",i:"zh",f:"u"},{s:"zhai",i:"zh",f:"ai"},{s:"zhei",i:"zh",f:"ei"},{s:"zhao",i:"zh",f:"ao"},{s:"zhou",i:"zh",f:"ou"},{s:"zhan",i:"zh",f:"an"},{s:"zhen",i:"zh",f:"en"},{s:"zhang",i:"zh",f:"ang"},{s:"zheng",i:"zh",f:"eng"},{s:"zhua",i:"zh",f:"ua"},{s:"zhuo",i:"zh",f:"uo"},{s:"zhuai",i:"zh",f:"uai"},{s:"zhui",i:"zh",f:"ui"},{s:"zhuan",i:"zh",f:"uan"},{s:"zhun",i:"zh",f:"un"},{s:"zhuang",i:"zh",f:"uang"},{s:"zhong",i:"zh",f:"ong"},
    {s:"cha",i:"ch",f:"a"},{s:"che",i:"ch",f:"e"},{s:"chu",i:"ch",f:"u"},{s:"chai",i:"ch",f:"ai"},{s:"chao",i:"ch",f:"ao"},{s:"chou",i:"ch",f:"ou"},{s:"chan",i:"ch",f:"an"},{s:"chen",i:"ch",f:"en"},{s:"chang",i:"ch",f:"ang"},{s:"cheng",i:"ch",f:"eng"},{s:"chua",i:"ch",f:"ua"},{s:"chuo",i:"ch",f:"uo"},{s:"chuai",i:"ch",f:"uai"},{s:"chui",i:"ch",f:"ui"},{s:"chuan",i:"ch",f:"uan"},{s:"chun",i:"ch",f:"un"},{s:"chuang",i:"ch",f:"uang"},{s:"chong",i:"ch",f:"ong"},
    {s:"sha",i:"sh",f:"a"},{s:"she",i:"sh",f:"e"},{s:"shu",i:"sh",f:"u"},{s:"shai",i:"sh",f:"ai"},{s:"shei",i:"sh",f:"ei"},{s:"shao",i:"sh",f:"ao"},{s:"shou",i:"sh",f:"ou"},{s:"shan",i:"sh",f:"an"},{s:"shen",i:"sh",f:"en"},{s:"shang",i:"sh",f:"ang"},{s:"sheng",i:"sh",f:"eng"},{s:"shua",i:"sh",f:"ua"},{s:"shuo",i:"sh",f:"uo"},{s:"shuai",i:"sh",f:"uai"},{s:"shui",i:"sh",f:"ui"},{s:"shuan",i:"sh",f:"uan"},{s:"shun",i:"sh",f:"un"},{s:"shuang",i:"sh",f:"uang"},
    {s:"re",i:"r",f:"e"},{s:"ru",i:"r",f:"u"},{s:"rao",i:"r",f:"ao"},{s:"rou",i:"r",f:"ou"},{s:"ran",i:"r",f:"an"},{s:"ren",i:"r",f:"en"},{s:"rang",i:"r",f:"ang"},{s:"reng",i:"r",f:"eng"},{s:"rua",i:"r",f:"ua"},{s:"ruo",i:"r",f:"uo"},{s:"rui",i:"r",f:"ui"},{s:"ruan",i:"r",f:"uan"},{s:"run",i:"r",f:"un"},{s:"rong",i:"r",f:"ong"},
    {s:"za",i:"z",f:"a"},{s:"ze",i:"z",f:"e"},{s:"zu",i:"z",f:"u"},{s:"zai",i:"z",f:"ai"},{s:"zei",i:"z",f:"ei"},{s:"zao",i:"z",f:"ao"},{s:"zou",i:"z",f:"ou"},{s:"zan",i:"z",f:"an"},{s:"zen",i:"z",f:"en"},{s:"zang",i:"z",f:"ang"},{s:"zeng",i:"z",f:"eng"},{s:"zuo",i:"z",f:"uo"},{s:"zui",i:"z",f:"ui"},{s:"zuan",i:"z",f:"uan"},{s:"zun",i:"z",f:"un"},{s:"zong",i:"z",f:"ong"},
    {s:"ca",i:"c",f:"a"},{s:"ce",i:"c",f:"e"},{s:"cu",i:"c",f:"u"},{s:"cai",i:"c",f:"ai"},{s:"cao",i:"c",f:"ao"},{s:"cou",i:"c",f:"ou"},{s:"can",i:"c",f:"an"},{s:"cen",i:"c",f:"en"},{s:"cang",i:"c",f:"ang"},{s:"ceng",i:"c",f:"eng"},{s:"cuo",i:"c",f:"uo"},{s:"cui",i:"c",f:"ui"},{s:"cuan",i:"c",f:"uan"},{s:"cun",i:"c",f:"un"},{s:"cong",i:"c",f:"ong"},
    {s:"sa",i:"s",f:"a"},{s:"se",i:"s",f:"e"},{s:"su",i:"s",f:"u"},{s:"sai",i:"s",f:"ai"},{s:"sao",i:"s",f:"ao"},{s:"sou",i:"s",f:"ou"},{s:"san",i:"s",f:"an"},{s:"sen",i:"s",f:"en"},{s:"sang",i:"s",f:"ang"},{s:"seng",i:"s",f:"eng"},{s:"suo",i:"s",f:"uo"},{s:"sui",i:"s",f:"ui"},{s:"suan",i:"s",f:"uan"},{s:"sun",i:"s",f:"un"},{s:"song",i:"s",f:"ong"},
    {s:"ya",i:"y",f:"a"},{s:"yo",i:"y",f:"o"},{s:"ye",i:"y",f:"e"},{s:"yao",i:"y",f:"ao"},{s:"you",i:"y",f:"ou"},{s:"yan",i:"y",f:"an"},{s:"yin",i:"y",f:"in"},{s:"yang",i:"y",f:"ang"},{s:"ying",i:"y",f:"ing"},{s:"yue",i:"y",f:"üe"},{s:"yuan",i:"y",f:"üan"},{s:"yun",i:"y",f:"ün"},{s:"yong",i:"y",f:"ong"},
    {s:"wa",i:"w",f:"a"},{s:"wo",i:"w",f:"o"},{s:"wai",i:"w",f:"ai"},{s:"wei",i:"w",f:"ei"},{s:"wan",i:"w",f:"an"},{s:"wen",i:"w",f:"en"},{s:"wang",i:"w",f:"ang"},{s:"weng",i:"w",f:"eng"}
  ];

  const SM_LIST = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'];
  const YM_LIST = ['a','o','e','i','u','v','ai','ei','ui','ao','ou','iu','ie','ve','er','an','en','in','un','vn','ang','eng','ing','ong'];
  const YM_CATS = [
    {name:'单韵母', list:['a','o','e','i','u','ü'], bg:'#eef2ff', fg:'#6366f1'},
    {name:'复韵母', list:['ai','ei','ui','ao','ou','iu','ie','üe','er'], bg:'#e0f2fe', fg:'#0284c7'},
    {name:'前鼻音', list:['an','en','in','un','ün'], bg:'#f5f3ff', fg:'#7c3aed'},
    {name:'后鼻音', list:['ang','eng','ing','ong'], bg:'#fffbeb', fg:'#d97706'},
    {name:'三拼音节', list:['ia','ian','iang','iao','iong','ua','uai','uan','uang','uo','üan'], bg:'#fce7f3', fg:'#db2777'}
  ];
  // 完整韵母列表包含所有分类
  const YM_FULL = [].concat(...YM_CATS.map(c=>c.list));
  const YM_CAT_MAP = {};
  YM_CATS.forEach((cat, ci)=>{
    cat.list.forEach(ym=>{ YM_CAT_MAP[ym] = ci; });
  });

  /* ─── 声调符号 ────────────────────────────────────────────── */
  const TONE_MAP = {
    1: { 'a':'ā','e':'ē','i':'ī','o':'ō','u':'ū','ü':'ǖ','v':'ǖ' },
    2: { 'a':'á','e':'é','i':'í','o':'ó','u':'ú','ü':'ǘ','v':'ǘ' },
    3: { 'a':'ǎ','e':'ě','i':'ǐ','o':'ǒ','u':'ǔ','ü':'ǚ','v':'ǚ' },
    4: { 'a':'à','e':'è','i':'ì','o':'ò','u':'ù','ü':'ǜ','v':'ǜ' }
  };
  const TONE_NAMES = {1:'一声',2:'二声',3:'三声',4:'四声'};
  const TONE_SYMBOLS = {1:'ˉ',2:'ˊ',3:'ˇ',4:'ˋ'};

  function addTone(py, tone){
    const v = py.replace('ü','v');
    let idx = v.indexOf('a');
    if(idx === -1) idx = v.indexOf('e');
    if(idx === -1 && v.includes('ou')) idx = v.indexOf('o');
    if(idx === -1){
      for(let i=v.length-1; i>=0; i--){
        if('aeiou'.includes(v[i])){ idx=i; break; }
      }
    }
    if(idx === -1) return py;
    const marked = TONE_MAP[tone][v[idx]] || v[idx];
    return py.slice(0, idx) + marked + py.slice(idx + 1);
  }

  function dn(py){ return py.replace('v','ü'); }

  /* 韵母显示：三拼音节拆成 介音-韵母 */
  function ymLabel(ym, catName){
    if(catName !== '三拼音节') return dn(ym);
    const medial = ym[0];
    const rest = dn(ym).slice(1);
    return dn(medial) + '-' + rest;
  }

  /* ─── 音频 ────────────────────────────────────────────────── */
  function playMP3(path){
    if(currentAudio){ currentAudio.pause(); currentAudio=null }
    const a = new Audio(path);
    currentAudio = a;
    return new Promise(r=>{
      let done=false;
      function once(){if(!done){done=true;r()}}
      a.onended=once; a.onerror=once;
      a.play().catch(once);
      setTimeout(once,5000);
    });
  }

  function delay(ms){ return new Promise(r=>setTimeout(r, ms)) }

  function mp3Tone(syl){ return `audio/yinjie/${syl.replace('ü','v')}`; }

  async function playSyllable(sm, ym, syl, tone){
    tone = tone || 1;
    if(ZHENG_TI.has(syl)){
      await playMP3(`${mp3Tone(syl)}${tone}.mp3`);
      return;
    }
    if(isSanPin(ym)){
      const medial = ym[0];
      const rest = dn(ym).slice(1);
      await playMP3(`audio/${sm}.mp3`);
      await delay(100);
      // 介音：纯元音不带声调
      await playMP3(`audio/${medial === 'ü' ? 'v' : medial}.mp3`);
      await delay(100);
      // 韵母：带声调
      await playMP3(`audio/tones/${rest.replace('ü','v')}${tone}.mp3`);
      await delay(100);
      await playMP3(`${mp3Tone(syl)}${tone}.mp3`);
    } else {
      await playMP3(`audio/${sm}.mp3`);
      await delay(100);
      await playMP3(`audio/tones/${ym.replace('ü','v')}${tone}.mp3`);
      await delay(100);
      await playMP3(`${mp3Tone(syl)}${tone}.mp3`);
    }
  }

  function isSanPin(ym){
    if(ym.length <= 1) return false;
    const twoPin = ['i','u','v','ie','ve','in','ing','iu','ui','un'];
    if(twoPin.includes(ym)) return false;
    const first = ym[0];
    return first === 'i' || first === 'u' || first === 'ü' || first === 'v';
  }

  /* ─── 工具 ────────────────────────────────────────────────── */
  function getFinals(sm){
    return [...new Set(SYLLABLE_DATA.filter(d=>d.i===sm).map(d=>d.f))];
  }

  function findSyllable(sm, ym){
    return SYLLABLE_DATA.find(d=>d.i===sm && d.f===ym);
  }

  /* ─── 样式注入 ───────────────────────────────────────────── */
  const STYLE_ID = 'st-style';
  if(!document.getElementById(STYLE_ID)){
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .st-title{font-size:clamp(14px,3.5vw,16px);font-weight:700;color:#6366f1;margin:0 0 4px;padding-left:4px}
      .st-sub{font-size:clamp(11px,2.8vw,13px);color:#94a3b8;margin-bottom:10px;padding-left:4px}

      /* 表格容器：双轴滚动，高度适配 */
      .st-table-wrap{overflow:auto;scrollbar-width:thin;-webkit-overflow-scrolling:touch;margin-bottom:10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.04);max-height:70vh}
      .st-table-wrap::-webkit-scrollbar{height:6px;width:6px}
      .st-table-wrap::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}

      .st-table{display:flex;flex-direction:column;width:100%}
      .st-row{display:flex;gap:0;border-bottom:1px solid #f8fafc}

      /* ── 表头行 ── */
      .st-row.cat-row{background:#fff;position:sticky;top:0;z-index:4;border-bottom:1px solid #e2e8f0}
      .st-row.head{border-bottom:2px solid #e2e8f0;position:sticky;top:20px;z-index:3;background:#fff}

      /* 内容格：等比例伸缩，适配触屏 */
      .st-cell,.st-head,.st-empty{display:flex;align-items:center;justify-content:center;flex:1;min-width:44px;height:36px;font-size:13px;border-right:1px solid #f1f5f9;box-sizing:border-box;white-space:nowrap;overflow:hidden}
      .st-cell:last-child,.st-head:last-child,.st-empty:last-child{border-right:none}

      /* 分类行标签 */
      .st-cat{display:flex;align-items:center;justify-content:center;height:24px;font-size:11px;font-weight:700;letter-spacing:1px;border-right:1px solid #e2e8f0;box-sizing:border-box;white-space:nowrap;overflow:hidden}
      .st-cat:last-child{border-right:none}
      .st-row.cat-row .st-head.corner{height:24px;min-height:24px;flex:0 0 32px;min-width:32px}

      /* 左侧声母固定列 */
      .st-label{font-weight:700;color:#6366f1;background:#f8faff;flex:0 0 32px;cursor:pointer;transition:background .15s;position:sticky;left:0;z-index:2;border-right:1px solid #ddd;height:36px;display:flex;align-items:center;justify-content:center;font-size:13px}
      .st-label:hover{background:#eef2ff}
      .st-label:active{background:#dde4ff}

      /* 韵母表头 */
      .st-head{font-weight:600;cursor:pointer;transition:all .15s}
      .st-head:hover{filter:brightness(.95)}
      .st-head:active{transform:scale(.88)}
      .st-head.corner{background:#f8faff;color:#6366f1;font-weight:700;cursor:default;flex:0 0 32px;min-width:32px;position:sticky;left:0;z-index:4}
      .st-head.corner:hover{filter:none;transform:none}

      /* 音节格 */
      .st-cell{font-weight:600;color:#1e293b;background:#fff;cursor:pointer;transition:all .1s}
      .st-cell:hover{background:#eef2ff}
      .st-cell:active{transform:scale(.88);background:#dde4ff}
      .st-empty{background:#f8fafc;color:#cbd5e1}

      .st-hint{font-size:12px;color:#94a3b8;text-align:center;margin-top:8px}
      /* 弹窗 */
      .st-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px}
      .st-popup{background:#fff;border-radius:16px;padding:16px 12px 14px;max-width:380px;width:calc(100% - 16px);box-shadow:0 8px 32px rgba(0,0,0,.15);position:relative;text-align:center}
      .st-popup-close{position:absolute;top:8px;right:10px;border:none;background:none;font-size:18px;cursor:pointer;color:#94a3b8;padding:4px;line-height:1}
      .st-popup-close:hover{color:#64748b}
      .st-popup-label{font-size:12px;color:#94a3b8;margin-bottom:2px}
      .st-popup-label .st-sm{color:#6366f1;font-weight:600;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background .15s}
      .st-popup-label .st-sm:hover{background:#eef2ff}
      .st-popup-label .st-ym{color:#22c55e;font-weight:600;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background .15s}
      .st-popup-label .st-ym:hover{background:#dcfce7}
      .st-popup-title{font-size:clamp(18px,4.5vw,28px);font-weight:700;color:#1e293b;margin:4px 0;letter-spacing:1px}
      .st-popup-tones{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0}
      .st-tone-card{padding:8px 2px 6px;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;transition:all .15s;background:#fff;min-width:0;overflow:hidden}
      .st-tone-card:hover{border-color:#a5b4fc;background:#f8faff}
      .st-tone-card:active{transform:scale(.92)}
      .st-tone-card .tone-syl{font-size:clamp(16px,4vw,24px);font-weight:800;color:#1e293b;display:block}
      .st-tone-card .tone-sym{font-size:14px;color:#6366f1;display:block;margin-top:0}
      .st-tone-card .tone-name{font-size:10px;color:#94a3b8;display:block;margin-top:0}
      .st-popup-hint{font-size:10px;color:#cbd5e1;margin-top:6px}
    `;
    document.head.appendChild(s);
  }

  /* ─── RENDER ──────────────────────────────────────────────── */
  function render(container){
    container.innerHTML = `
      <div class="st-title">📊 音节表</div>
      <div class="st-sub">拼音音节总表 · 点击音节选声调 · 点击左侧/顶部标签单独听</div>

      <div class="st-table-wrap">
        <div class="st-table" id="stTable">
          <!-- 分类行：按韵母数量 flex 比例 -->
          <div class="st-row cat-row">
            <span class="st-head corner"></span>
            ${YM_CATS.map(cat=>`
              <span class="st-cat" style="flex:${cat.list.length} 1 0%;min-width:${cat.list.length*44}px;background:${cat.bg};color:${cat.fg}">${cat.name}</span>
            `).join('')}
          </div>
          <!-- 韵母表头行 -->
          <div class="st-row head">
            <span class="st-head corner"></span>
            ${YM_FULL.map(ym=>{
              const ci = YM_CAT_MAP[ym];
              const cat = YM_CATS[ci];
              return `<span class="st-head" data-play="ym:${ym}" style="background:${cat.bg};color:${cat.fg}">${ymLabel(ym, cat.name)}</span>`;
            }).join('')}
          </div>
          <!-- 音节行 -->
          ${SM_LIST.map(sm=>{
            const finals = getFinals(sm);
            return `
              <div class="st-row">
                <span class="st-label" data-play="sm:${sm}">${sm}</span>
                ${YM_FULL.map(ym=>{
                  if(finals.includes(ym)){
                    const syl = findSyllable(sm, ym);
                    return syl ? `<span class="st-cell" data-sm="${sm}" data-ym="${ym}" data-syl="${syl.s}">${dn(syl.s)}</span>` : `<span class="st-empty"></span>`;
                  }
                  return `<span class="st-empty"></span>`;
                }).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="st-hint">点击音节 → 四声调弹窗 &#x1f50a; | 点击表头单独听声母/韵母</div>
    `;

    const table = container.querySelector('#stTable');

    // 点击音节 → 弹窗
    table.addEventListener('click', e=>{
      const cell = e.target.closest('.st-cell');
      if(!cell || playing) return;
      if(currentAudio) currentAudio.pause();
      showPopup(cell.dataset.sm, cell.dataset.ym, cell.dataset.syl);
    });

    // 点击声母表头
    table.addEventListener('click', async e=>{
      const label = e.target.closest('[data-play^="sm:"]');
      if(!label || playing) return;
      const sm = label.dataset.play.split(':')[1];
      playing = true;
      await playMP3(`audio/${sm}.mp3`);
      playing = false;
    });

    // 点击韵母表头 → 弹窗选声调
    table.addEventListener('click', e=>{
      const head = e.target.closest('[data-play^="ym:"]');
      if(!head || playing) return;
      if(currentAudio) currentAudio.pause();
      const ym = head.dataset.play.split(':')[1];
      showYMPopup(ym);
    });
  }

  /* ─── 弹窗 ───────────────────────────────────────────────── */
  function showPopup(sm, ym, syl){
    const tones = [1,2,3,4];

    const overlay = document.createElement('div');
    overlay.className = 'st-overlay';
    overlay.innerHTML = `
      <div class="st-popup">
        <button class="st-popup-close">&times;</button>
        <div class="st-popup-label">
          ${isSanPin(ym) ? `
            <span class="st-sm" data-play="sm">&#x1F50A; ${sm}</span>
            <span style="margin:0 3px;color:#94a3b8">+</span>
            <span class="st-ym" data-play="ym-medial" style="color:#f59e0b;font-weight:700">&#x1F50A; ${dn(ym[0])}</span>
            <span style="margin:0 3px;color:#94a3b8">+</span>
            <span class="st-ym" data-play="ym-rest">&#x1F50A; ${dn(ym).slice(1)}</span>
          ` : `
            <span class="st-sm" data-play="sm">&#x1F50A; ${sm}</span>
            <span style="margin:0 3px;color:#94a3b8">+</span>
            <span class="st-ym" data-play="ym">&#x1F50A; ${dn(ym)}</span>
          `}
        </div>
        <div class="st-popup-title">
          ${ZHENG_TI.has(syl) ? `<span style="display:inline-block;font-size:10px;background:#fef3c7;color:#d97706;padding:1px 8px;border-radius:4px;margin-bottom:3px;font-weight:700">📌 整体认读音节</span><br>` : ''}
          ${dn(syl)}
        </div>
        <div class="st-popup-tones">
          ${tones.map(t=>`
            <div class="st-tone-card" data-tone="${t}">
              <span class="tone-syl">${addTone(syl, t)}</span>
              <span class="tone-sym">${TONE_SYMBOLS[t]}</span>
              <span class="tone-name">${TONE_NAMES[t]}</span>
            </div>
          `).join('')}
        </div>
        <div class="st-popup-hint">${ZHENG_TI.has(syl) ? '整体认读，直接播放' : '&darr; 点击卡片三步拼读，韵母自动匹配声调'}</div>
        ${(()=>{
          const dropDot = ['j','q','x','y'];
          const dotFinals = ['ü','üe','üan','ün'];
          if(dropDot.includes(sm) && dotFinals.includes(ym)){
            return `<div style="font-size:10px;color:#f59e0b;margin-top:4px">💡 ${sm}+${ym} 写作 <b>${sm}${ym.replace('ü','u')}</b>（ü 去两点）</div>`;
          }
          return '';
        })()}
      </div>
    `;

    document.body.appendChild(overlay);

    // 点击遮罩关闭
    overlay.addEventListener('click', e=>{
      if(e.target === overlay) overlay.remove();
    });

    // 关闭按钮
    overlay.querySelector('.st-popup-close').addEventListener('click', ()=>{
      if(currentAudio) currentAudio.pause();
      overlay.remove();
    });

    // 点击声母标签
    overlay.querySelector('[data-play="sm"]').addEventListener('click', async ()=>{
      if(playing) return;
      playing = true;
      await playMP3(`audio/${sm}.mp3`);
      playing = false;
    });

    // 点击介音标签（三拼音节）
    const medialBtn = overlay.querySelector('[data-play="ym-medial"]');
    if(medialBtn){
      medialBtn.addEventListener('click', async ()=>{
        if(playing) return;
        playing = true;
        const m = ym[0];
        await playMP3(`audio/${m === 'ü' ? 'v' : m}.mp3`);
        playing = false;
      });
    }

    // 点击韵母部分标签（三拼音节 - 去掉介音）
    const ymRestBtn = overlay.querySelector('[data-play="ym-rest"]');
    if(ymRestBtn){
      ymRestBtn.addEventListener('click', async ()=>{
        if(playing) return;
        playing = true;
        const rest = dn(ym).slice(1);
        await playMP3(`audio/${rest.replace('ü','v')}.mp3`);
        playing = false;
      });
    }

    // 点击韵母标签（非三拼）
    const ymFullBtn = overlay.querySelector('[data-play="ym"]');
    if(ymFullBtn){
      ymFullBtn.addEventListener('click', async ()=>{
        if(playing) return;
        playing = true;
        await playMP3(`audio/${ym.replace('ü','v')}.mp3`);
        playing = false;
      });
    }

    // 点击声调卡片
    overlay.querySelectorAll('.st-tone-card').forEach(card=>{
      card.addEventListener('click', async function(){
        if(playing) return;
        const tone = parseInt(this.dataset.tone);
        playing = true;
        this.style.borderColor = '#6366f1';
        this.style.background = '#eef2ff';
        await playSyllable(sm, ym, syl, tone);
        this.style.borderColor = '#e2e8f0';
        this.style.background = '#fff';
        playing = false;
      });
    });
  }

  /* ─── 韵母声调弹窗 ───────────────────────────────────────── */
  function showYMPopup(ym){
    const tones = [1,2,3,4];
    const isSP = isSanPin(ym);
    const base = isSP ? dn(ym).slice(1) : dn(ym); // 三拼只取韵母部分

    const overlay = document.createElement('div');
    overlay.className = 'st-overlay';
    overlay.innerHTML = `
      <div class="st-popup">
        <button class="st-popup-close">&times;</button>
        <div class="st-popup-label">${ymLabel(ym, isSP ? '三拼音节' : '')}</div>
        <div class="st-popup-tones">
          ${tones.map(t=>`
            <div class="st-tone-card" data-tone="${t}">
              <span class="tone-syl">${addTone(base, t)}</span>
              <span class="tone-sym">${TONE_SYMBOLS[t]}</span>
              <span class="tone-name">${TONE_NAMES[t]}</span>
            </div>
          `).join('')}
        </div>
        <div class="st-popup-hint">点击声调卡片播放</div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener('click', e=>{ if(e.target === overlay) overlay.remove(); });
    overlay.querySelector('.st-popup-close').addEventListener('click', ()=>{
      if(currentAudio) currentAudio.pause();
      overlay.remove();
    });

    overlay.querySelectorAll('.st-tone-card').forEach(card=>{
      card.addEventListener('click', async function(){
        if(playing) return;
        const tone = parseInt(this.dataset.tone);
        playing = true;
        this.style.borderColor = '#6366f1';
        this.style.background = '#eef2ff';
        // 三拼：播介音(纯) + 韵母(带调) | 非三拼：直接播韵母(带调)
        if(isSP){
          const medial = ym[0];
          const rest = dn(ym).slice(1);
          await playMP3(`audio/${medial === 'ü' ? 'v' : medial}.mp3`);
          await delay(300);
          await playMP3(`audio/tones/${rest.replace('ü','v')}${tone}.mp3`);
        } else {
          await playMP3(`audio/tones/${ym.replace('ü','v')}${tone}.mp3`);
        }
        this.style.borderColor = '#e2e8f0';
        this.style.background = '#fff';
        playing = false;
      });
    });
  }

  /* ─── 清理 ────────────────────────────────────────────────── */
  function cleanup(){
    if(currentAudio){ currentAudio.pause(); currentAudio=null }
  }

  /* ═══════════════════════════════════════════════════════════════
     注册
     ═══════════════════════════════════════════════════════════════ */
  registerModule('syllable-table', {
    render: render,
    cleanup: cleanup
  });

})();
