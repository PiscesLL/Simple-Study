/* ═══════════════════════════════════════════════════════════════
   MODULE: blending — 拼读训练
   模式一：随机模式（随机音节 + 四声调选择）
   模式二：选择模式（两步选择 + 四声调选择）
   音频路径：audio/yinjie/{syl}{tone}.mp3 | audio/tones/{ym}{tone}.mp3
   整体认读音节直接播放整体，不做三步拼读
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  let currentAudio = null;
  let mode = 'random';       // 'random' | 'select'
  let currentData = null;
  let selectSM = 'b';
  let selectYM = null;
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

  /* ─── 拼音常用字/词 ───────────────────────────────────────── */
  const PINYIN_WORDS = {
    'ba':{t:{1:'八',2:'拔',3:'把',4:'爸'},c:'八巴把爸吧',w:{1:'八点 八卦',2:'拔草 拔河',3:'把持 把手',4:'爸爸 老爸'}},
    'bo':{t:{1:'波',2:'博',3:'跛',4:'簸'},c:'波播伯薄',w:{1:'波浪 播音',2:'博士 脖子',3:'跛脚',4:'簸箕'}},
    'bi':{t:{1:'逼',2:'鼻',3:'比',4:'必'},c:'比笔必毕逼',w:{1:'逼近 逼迫',2:'鼻子 鼻涕',3:'比较 比如',4:'必须 必要'}},
    'bu':{t:{3:'补捕',4:'不步部'},c:'不步布部',w:{3:'补充 补习',4:'不要 部分 跑步'}},
    'bei':{t:{1:'杯悲',3:'北',4:'被备背'},c:'北杯背悲',w:{1:'杯子 悲伤',3:'北京 北方',4:'背后 准备 被窝'}},
    'bao':{t:{1:'包',3:'宝',4:'报'},c:'包宝抱报',w:{1:'包子 包含',3:'宝贝 宝座',4:'报告 报纸'}},
    'ban':{t:{1:'般班',4:'半办'},c:'半般办搬',w:{1:'一般 班级',4:'办法 办公'}},
    'ben':{c:'本奔笨',w:'基本 奔跑'},'bang':{c:'帮榜傍蚌',w:'帮助 傍晚'},'beng':{c:'崩蹦',w:'蹦蹦跳'},'bie':{c:'别憋',w:'别人 特别'},
    'biao':{c:'标表',w:'标准 手表'},'bian':{c:'边便变遍',w:'方便 变化'},'bin':{c:'宾滨',w:'宾馆 海滨'},'bing':{c:'兵冰饼并',w:'饼干 并且'},
    'pa':{c:'爬怕',w:'害怕 爬山'},'po':{c:'破婆泼',w:'破坏 活泼'},'pi':{c:'皮脾匹屁',w:'皮肤 脾气'},'pu':{c:'普铺扑',w:'普通 朴素'},
    'pai':{c:'拍排派',w:'排队 排球'},'pei':{c:'陪赔配',w:'陪伴 分配'},'pao':{c:'跑炮泡',w:'跑步 跑车'},'pou':{c:'剖',w:'解剖'},
    'pan':{c:'盘盼判',w:'盘子 期盼'},'pen':{c:'盆喷',w:'花盆 喷泉'},'pang':{c:'旁胖',w:'旁边 胖子'},'peng':{c:'朋碰棚',w:'朋友 碰见'},
    'pie':{c:'撇瞥',w:'撇开'},'piao':{c:'飘漂票',w:'漂亮 飘动'},'pian':{c:'片偏遍',w:'照片 便宜'},'pin':{c:'品拼频',w:'品质 拼音'},
    'ping':{c:'平瓶评苹',w:'苹果 评论'},
    'mo':{t:{1:'摸',2:'模魔',4:'末莫'},c:'摸末莫魔',w:{1:'抚摸',2:'模范 魔鬼',4:'周末 陌生'}},
    'me':{w:'什么 怎么'},
    'mi':{t:{2:'迷',3:'米',4:'密'},c:'米密迷蜜',w:{2:'迷路 谜语',3:'米饭 大米',4:'秘密 密切'}},
    'mu':{t:{3:'母',4:'目'},c:'目木母慕',w:{3:'母亲 父母',4:'目光 树木 目前'}},
    'mai':{t:{2:'埋',3:'买',4:'卖'},c:'买卖迈',w:{2:'埋伏 埋藏',3:'买菜 购买',4:'卖菜 出卖'}},
    'mei':{t:{2:'没',3:'每美',4:'妹'},c:'没每美妹',w:{2:'没有 没空',3:'每天 美丽',4:'妹妹 姐妹'}},
    'mao':{t:{1:'猫',2:'毛',4:'帽'},c:'猫毛帽冒',w:{1:'小猫 猫咪',2:'毛衣 毛发',4:'帽子 草帽'}},
    'mou':{c:'某谋',w:'某些 阴谋'},'man':{c:'满慢漫',w:'满意 慢慢'},'men':{c:'门们闷',w:'我们 开门'},'mang':{c:'忙盲茫',w:'帮忙 急忙'},
    'meng':{c:'梦猛蒙',w:'梦想 猛烈'},'mie':{c:'灭蔑',w:'消灭 蔑视'},'miao':{c:'秒妙瞄',w:'秒针 美妙'},'miu':{w:'谬论'},
    'mian':{c:'面棉免',w:'里面 面包'},'min':{c:'民敏',w:'人民 民族'},'ming':{c:'名明命鸣',w:'名字 明天'},
    'fa':{t:{1:'发',2:'罚',3:'法',4:'珐'},c:'发伐罚法',w:{1:'发现 出发',2:'惩罚 罚款',3:'方法 法律',4:'头发 理发'}},
    'fo':{t:{2:'佛'},c:'佛',w:{2:'佛教 佛祖 大佛'}},
    'fu':{t:{1:'夫肤',2:'福扶服',3:'府辅',4:'父附'},c:'夫福附服',w:{1:'夫人 大夫',2:'幸福 服务 衣服',3:'政府 辅导',4:'父亲 附近'}},
    'fei':{c:'飞非肥费',w:'飞机 非常'},
    'fou':{c:'否',w:'是否 否则'},'fan':{c:'反饭返范',w:'吃饭 返回'},'fen':{c:'分份粉',w:'分钟 充分'},'fang':{c:'方房放访',w:'方法 房间'},
    'feng':{c:'风封疯',w:'风景 丰富'},
    'da':{t:{2:'达',4:'大'},c:'大打答达',w:{2:'达到 到达',4:'大家 大人 回答'}},
    'de':{w:'好的 我的'},
    'di':{t:{1:'低滴',2:'敌',3:'底',4:'地第弟'},c:'地的第低',w:{1:'低头 水滴',2:'敌人 敌对',3:'到底 底片',4:'地方 弟弟 第一'}},
    'du':{t:{2:'读独',4:'度'},c:'读独度毒',w:{2:'读书 独立',4:'速度 温度'}},
    'dai':{c:'带待代袋',w:'带领 等待'},'dao':{c:'到道倒导',w:'知道 道路'},'dou':{c:'都斗抖豆',w:'都是 豆子'},'dan':{c:'单但蛋担',w:'但是 简单'},
    'dang':{c:'当挡档',w:'当然 当时'},'deng':{c:'等灯登',w:'等待 红灯'},'die':{c:'爹跌叠',w:'跌倒 重叠'},'diao':{c:'掉调雕',w:'调查 声调'},
    'diu':{w:'丢掉 扔了'},'dian':{c:'点店电典',w:'电话 点心'},'duo':{c:'多躲朵',w:'多少 多么'},'dui':{c:'对队',w:'对不起 排队'},
    'duan':{c:'短断端',w:'长短 不断'},'dun':{c:'顿吨墩',w:'顿时 一顿'},'dong':{c:'东冬动懂',w:'东西 动物'},'ding':{c:'定顶钉',w:'一定 顶点'},
    'ta':{c:'他她它踏',w:'他们 它们'},'te':{c:'特',w:'特别 特点'},'ti':{c:'体提题替',w:'身体 问题'},'tu':{c:'图土突兔',w:'图片 突然'},
    'tai':{c:'太抬态',w:'太阳 太太'},'tao':{c:'套逃掏',w:'整套 逃跑'},'tou':{c:'头投透',w:'头发 投入'},'tan':{c:'谈弹叹炭',w:'谈话 弹琴'},
    'tang':{c:'汤唐躺趟',w:'汤圆 一趟'},'teng':{c:'疼藤',w:'疼痛 藤蔓'},'tie':{c:'贴铁帖',w:'贴纸 地铁'},'tiao':{c:'条跳调',w:'条件 跳舞'},
    'tian':{c:'天甜田填',w:'天气 每天'},'tuo':{c:'脱托拖',w:'摆脱 拖地'},'tui':{c:'推腿退',w:'推车 后退'},'tuan':{c:'团',w:'团结 团员'},
    'tun':{c:'吞屯',w:'吞下'},'tong':{c:'同通痛统',w:'同学 通过'},'ting':{c:'听停庭厅',w:'听懂 客厅'},
    'na':{c:'那拿哪',w:'那里 拿着'},'ne':{w:'你呢'},'ni':{c:'你尼腻逆',w:'你好 你好 你呢'},'nu':{t:{2:'奴',3:'努',4:'怒'},c:'奴努怒',w:{2:'奴隶 奴才',3:'努力 努嘴',4:'愤怒 怒放'}},
    'nü':{c:'女',w:'女孩 女士'},
    'nai':{c:'奶耐奈',w:'奶奶 耐力'},'nei':{c:'内',w:'内部 内容'},'nao':{c:'脑闹恼',w:'大脑 热闹'},'nou':{w:'耨'},
    'nan':{c:'难南男',w:'南方 困难'},'nen':{c:'嫩',w:'嫩叶'},'nang':{w:'行囊'},'neng':{c:'能',w:'能够 能力'},
    'nie':{c:'捏镍',w:'捏住'},'niao':{c:'鸟尿',w:'小鸟 鸟儿'},'niu':{c:'牛扭纽',w:'牛奶 牛仔'},'nian':{c:'年念粘',w:'今年 想念'},
    'nin':{w:'您'},'niang':{c:'娘酿',w:'姑娘 新娘'},'ning':{c:'宁拧凝',w:'宁静 宁夏'},'nuo':{c:'诺糯',w:'诺言 糯米'},
    'nuan':{c:'暖',w:'暖和 温暖'},'nong':{c:'弄农浓',w:'农民 农村'},
    'la':{c:'拉啦辣蜡',w:'拉开 辣椒'},'le':{w:'快乐 欢乐'},'li':{c:'里利丽力立',w:'里面 美丽'},'lu':{c:'路陆录露',w:'马路 记录'},
    'lü':{c:'绿旅律率',w:'绿色 旅行'},
    'lai':{c:'来赖莱',w:'出来 原来'},'lei':{c:'类累雷泪',w:'类型 劳累'},'lao':{c:'老劳牢',w:'老师 劳动'},'lou':{c:'楼漏露',w:'楼上 漏洞'},
    'lan':{c:'蓝兰烂拦',w:'蓝天 兰花'},'lang':{c:'狼浪朗',w:'海浪 开朗'},'leng':{c:'冷愣',w:'寒冷 冰冷'},'lie':{c:'列烈劣猎',w:'排列 烈日'},
    'liao':{c:'了料聊僚',w:'了解 材料'},'liu':{c:'六流留柳',w:'六个 流行'},'lian':{c:'连联脸练',w:'连忙 联系'},
    'lin':{c:'林淋临邻',w:'树林 邻居'},'liang':{c:'两亮凉辆',w:'两个 明亮'},'ling':{c:'零铃领龄',w:'零钱 带领'},
    'luo':{c:'落罗螺',w:'落后 罗马'},'luan':{c:'乱卵',w:'混乱 杂乱'},'lun':{c:'论轮伦',w:'讨论 车轮'},'long':{c:'龙笼聋隆',w:'恐龙 灯笼'},
    'ga':{c:'嘎',w:'嘎嘎'},'ge':{c:'个各歌哥',w:'一个 唱歌'},'gu':{c:'古股鼓故',w:'故事 古代'},
    'gai':{c:'该改盖概',w:'应该 改变'},'gei':{w:'给你 送给'},'gao':{c:'高告搞糕',w:'高兴 蛋糕'},'gou':{c:'够狗购构',w:'能够 购物'},
    'gan':{c:'干敢感赶',w:'干净 感觉'},'gen':{c:'根跟',w:'根本 跟着'},'gang':{c:'刚钢港岗',w:'刚才 港口'},'geng':{c:'更耕',w:'更加 更新'},
    'gua':{c:'挂瓜刮',w:'挂念 瓜子'},'guo':{c:'过果锅国',w:'过去 水果'},'guai':{c:'怪乖拐',w:'奇怪 乖巧'},'gui':{c:'贵鬼规柜',w:'贵姓 规则'},
    'guan':{c:'关管官馆',w:'关心 管理'},'gun':{c:'滚棍',w:'滚动 滚开'},'guang':{c:'广光逛',w:'广大 阳光'},'gong':{c:'工公共攻功',w:'工作 公司'},
    'ka':{c:'卡咖',w:'卡片 咖啡'},'ke':{c:'可课科颗客',w:'可以 上课'},'ku':{c:'苦库哭酷',w:'辛苦 仓库'},
    'kai':{c:'开凯慨',w:'开心 开始'},'kao':{c:'考靠烤',w:'考试 可靠'},'kou':{c:'口扣寇',w:'门口 人口'},'kan':{c:'看刊砍',w:'看见 看法'},
    'ken':{c:'肯恳垦',w:'肯定'},'kang':{c:'康抗慷',w:'健康 反抗'},'keng':{c:'坑',w:'坑洼 火坑'},'kua':{c:'夸垮',w:'夸大 夸奖'},
    'kuo':{c:'扩阔括',w:'扩大 包括'},'kuai':{c:'快块筷',w:'快乐 筷子'},'kui':{c:'亏愧魁',w:'吃亏 惭愧'},'kuan':{c:'宽款',w:'宽度 宽带'},
    'kun':{c:'困昆坤',w:'困难 困扰'},'kuang':{c:'况旷框狂',w:'情况 疯狂'},'kong':{c:'空控孔',w:'空气 控制'},
    'ha':{c:'哈',w:'哈哈'},'he':{c:'和合河喝荷',w:'和平 喝水'},'hu':{c:'湖互呼虎户',w:'互相 呼吸'},
    'hai':{c:'海还孩害',w:'还有 孩子'},'hei':{c:'黑嘿',w:'黑色 黑夜'},'hao':{c:'好号毫豪',w:'好的 号码'},'hou':{c:'后厚候猴',w:'以后 时候'},
    'han':{c:'汉含喊寒',w:'汉语 包含'},'hen':{c:'很狠恨',w:'很多 很大'},'hang':{c:'行航巷',w:'行业 航行'},'heng':{c:'横恒衡',w:'横向 永恒'},
    'hua':{c:'话花划画华',w:'说话 花朵'},'huo':{c:'活火或伙货',w:'生活 火车'},'huai':{c:'坏怀',w:'坏人 怀疑'},'hui':{c:'会回汇灰挥',w:'会议 回家'},
    'huan':{c:'欢还环换',w:'欢迎 还原'},'hun':{c:'婚混魂',w:'结婚 混合'},'huang':{c:'黄皇慌惶',w:'黄色 慌张'},'hong':{c:'红虹宏洪',w:'红色 宏伟'},
    'ji':{t:{1:'几机',2:'级极',3:'己',4:'记计'},c:'几机记级极',w:{1:'几乎 机器',2:'年级 极好',3:'自己 知己',4:'记住 计算'}},
    'ju':{t:{1:'居',2:'局',3:'举',4:'句具'},c:'句具剧举',w:{1:'居民 居住',2:'局长 局面',3:'举手 举行',4:'句子 具体 工具'}},
    'jia':{t:{1:'家加',3:'假',4:'价'},c:'家加价假',w:{1:'大家 加法',3:'假装 假期',4:'价格 价钱'}},
    'jie':{t:{1:'接',2:'节',3:'姐',4:'界解'},c:'接节姐界解',w:{1:'接受 迎接',2:'节日 节目',3:'姐姐 姐妹',4:'世界 解决'}},
    'jiao':{c:'教叫交角较',w:'教学 比较'},'jiu':{c:'九就酒久救',w:'就是 很久'},'jian':{c:'见间件建简',w:'看见 时间'},'jin':{c:'今金近紧进',w:'今天 最近'},
    'jiang':{c:'将讲降江',w:'将来 讲话'},'jing':{c:'经京精静竟',w:'已经 北京'},'jue':{c:'觉决绝掘',w:'觉得 决定'},'juan':{c:'卷捐绢倦',w:'试卷 捐款'},
    'jun':{c:'军君均俊',w:'军队 平均'},'jiong':{c:'窘炯',w:'窘迫'},
    'qi':{c:'七其起气骑',w:'一起 天气'},'qu':{c:'去取趣区',w:'出去 有趣'},'qia':{c:'恰洽掐',w:'恰好 融洽'},'qie':{c:'切且窃',w:'一切 而且'},
    'qiao':{c:'桥巧悄俏',w:'桥梁 巧妙'},'qiu':{c:'秋球求仇',w:'秋天 要求'},'qian':{c:'前千钱浅',w:'前面 千万'},'qin':{c:'亲琴勤侵',w:'母亲 勤劳'},
    'qiang':{c:'强抢墙枪',w:'强大 强调'},'qing':{c:'情清请轻庆',w:'事情 清楚'},'que':{c:'却确缺雀',w:'确实 缺少'},'quan':{c:'全权泉劝',w:'全部 权力'},
    'qun':{c:'群裙',w:'群众 人群'},'qiong':{c:'穷琼',w:'贫穷 穷人'},
    'xi':{c:'西习息喜系',w:'东西 学习'},'xu':{c:'需许续序',w:'需要 允许'},'xia':{c:'下夏吓虾',w:'下午 夏天'},'xie':{c:'写些谢协血',w:'写字 谢谢'},
    'xiao':{c:'小笑校消效',w:'小学 学校'},'xiu':{c:'修休秀袖',w:'修理 休息'},'xian':{c:'先现显线县',w:'现在 发现'},'xin':{c:'心新信辛欣',w:'心里 新闻'},
    'xiang':{c:'想相香箱象',w:'想法 相信'},'xing':{c:'星行兴姓幸',w:'星期 行动'},'xue':{c:'学雪血削',w:'学习 下雪'},'xuan':{c:'选宣旋悬',w:'选择 宣传'},
    'xun':{c:'寻迅讯训',w:'寻找 迅速'},'xiong':{c:'兄胸凶雄',w:'兄弟 英雄'},
    'zhi':{t:{1:'之知',2:'直值',3:'只指',4:'志至'},c:'之只知指志',w:{1:'知道 知识',2:'直接 价值',3:'只有 手指',4:'志向 至今'}},
    'chi':{t:{1:'吃',2:'迟',3:'尺',4:'赤'},c:'吃迟尺持',w:{1:'吃饭 小吃',2:'迟到 迟早',3:'尺子 尺寸',4:'赤脚 赤色'}},
    'shi':{t:{1:'师失',2:'十时',3:'始史',4:'是世事'},c:'是时十事市',w:{1:'老师 失去',2:'十分 时间',3:'开始 历史',4:'是的 事情 世界'}},
    'ri':{t:{4:'日'},c:'日',w:{4:'日子 生日 日月'}},
    'zi':{c:'子自字资紫',w:'自己 儿子'},'ci':{c:'此次词辞',w:'这次 词语'},'si':{c:'四死思丝',w:'四个 思考'},
    'yi':{t:{1:'一衣',2:'移疑',3:'已以',4:'意亿义'},c:'一已以意亿',w:{1:'一个 衣服',2:'移动 怀疑',3:'已经 以后',4:'意思 意义'}},
    'wu':{t:{1:'屋乌',2:'无',3:'五午',4:'误物'},c:'五无午误屋',w:{1:'屋子 乌云',2:'无论 无比',3:'五个 中午',4:'错误 动物'}},
    'yu':{t:{2:'于鱼余',3:'与雨语',4:'育玉遇'},c:'于与雨语育',w:{2:'于是 金鱼 多余',3:'与其 下雨 语文',4:'教育 玉米 遇见'}},
    'ye':{c:'也野夜叶爷',w:'也是 夜晚'},'yue':{c:'月越约阅',w:'月亮 大约'},'yuan':{c:'远原院员圆',w:'原来 医院'},'yin':{c:'因音银引印',w:'因为 音乐'},
    'yun':{c:'运云允孕韵',w:'运动 允许'},'ying':{c:'应英影映迎',w:'应该 英语'},
    'zha':{c:'扎渣诈',w:'扎实 挣扎'},'zhe':{c:'这着者折',w:'这里 或者'},'zhu':{c:'住主助注猪',w:'住在 主要'},'zhai':{c:'摘宅窄债',w:'摘要 住宅'},
    'zhao':{c:'找照召招',w:'找到 招呼'},'zhou':{c:'周洲州粥',w:'周围 周末'},'zhan':{c:'站展战占粘',w:'车站 发展'},'zhen':{c:'真针诊阵震',w:'真的 认真'},
    'zhang':{c:'张长掌丈仗',w:'主张 长大'},'zheng':{c:'正争证政整',w:'正在 正确'},'zhua':{w:'抓住'},'zhuo':{c:'桌琢拙灼',w:'桌子 卓越'},
    'zhuai':{w:'拽住'},'zhui':{c:'追坠缀',w:'追求 追赶'},'zhuan':{c:'转专赚砖',w:'专门 转身'},'zhun':{c:'准',w:'准备 准确'},
    'zhuang':{c:'装庄壮撞',w:'服装 壮观'},'zhong':{c:'中种重终钟',w:'中国 重要'},
    'cha':{c:'查差茶察',w:'检查 查看'},'che':{c:'车扯撤澈',w:'汽车 彻底'},'chu':{c:'出处初触',w:'出来 出去'},
    'chai':{c:'拆柴差',w:'拆开 木柴'},'chao':{c:'超抄潮吵',w:'超过 超市'},'chou':{c:'抽臭仇丑',w:'抽空 丑陋'},'chan':{c:'产缠铲颤',w:'产生 产品'},
    'chen':{c:'沉晨臣衬',w:'沉默 早晨'},'chang':{c:'长常唱场厂',w:'经常 唱歌'},'cheng':{c:'成城程乘称',w:'成为 城市'},
    'chong':{c:'重冲虫充',w:'重新 充分'},'chui':{c:'吹锤垂',w:'吹风 垂钓'},'chun':{c:'春纯唇醇',w:'春天 纯洁'},'chuo':{w:'辍学'},
    'chuan':{c:'穿船传串',w:'穿过 传统'},'chuang':{c:'窗床创',w:'窗户 创造'},
    'sha':{c:'沙杀纱啥',w:'沙发 沙子'},'she':{c:'设社涉射蛇',w:'设计 社会'},'shu':{c:'书数术输树',w:'书本 数学'},
    'shai':{c:'晒筛',w:'晒太阳'},'shao':{c:'少烧绍哨',w:'多少 少量'},'shou':{c:'手收受首瘦',w:'手机 首先'},'shan':{c:'山善闪衫',w:'山上 善良'},
    'shen':{c:'什深身神审',w:'什么 身体'},'shang':{c:'上商赏尚',w:'上面 商店'},'sheng':{c:'生声省胜升',w:'生活 学生'},
    'shua':{c:'刷耍',w:'刷牙 玩耍'},'shuo':{c:'说硕',w:'说话 听说'},'shuai':{c:'帅摔甩衰',w:'帅气 摔倒'},'shui':{c:'水睡谁税',w:'水果 睡觉'},
    'shuan':{c:'栓',w:'栓住'},'shun':{c:'顺瞬舜',w:'顺利 顺序'},'shuang':{c:'双爽霜',w:'双方 清爽'},
    're':{c:'热惹',w:'热水 热爱'},'ru':{c:'如入乳辱',w:'如果 进入'},'rao':{c:'绕扰饶',w:'围绕 打扰'},'rou':{c:'肉柔揉',w:'牛肉 柔软'},
    'ran':{c:'然染燃',w:'然后 自然'},'ren':{c:'人认任忍仁',w:'人们 认识'},'rang':{c:'让壤',w:'让步 土壤'},'reng':{c:'仍扔',w:'仍然 扔掉'},
    'rui':{c:'锐瑞蕊',w:'锐利'},'ruan':{c:'软',w:'软件 柔软'},'run':{c:'润闰',w:'滋润 润滑'},'rong':{c:'容荣融溶',w:'容易 光荣'},
    'za':{c:'杂砸扎',w:'杂志 砸碎'},'ze':{c:'则责择',w:'规则 责任'},'zu':{c:'组族祖阻',w:'组织 民族'},
    'zai':{c:'在再灾载',w:'现在 再见'},'zao':{c:'早造糟澡',w:'早上 造成'},'zou':{c:'走奏揍',w:'走路 行走'},'zan':{c:'赞暂咱',w:'赞成 暂时'},
    'zen':{w:'怎么'},'zang':{c:'脏葬藏',w:'肝脏 埋葬'},'zeng':{c:'增赠憎',w:'增加 赠送'},'zuo':{c:'做坐左右作',w:'做事 坐下'},
    'zui':{c:'最罪醉嘴',w:'最后 嘴巴'},'zuan':{c:'钻',w:'钻石 钻研'},'zun':{c:'尊遵',w:'尊敬 遵守'},'zong':{c:'总综踪纵',w:'总结 综合'},
    'ca':{c:'擦',w:'擦汗 摩擦'},'ce':{c:'测策册侧',w:'测试 策略'},'cu':{c:'粗促醋',w:'粗心 促进'},
    'cai':{c:'才材财采彩',w:'刚才 才能'},'cao':{c:'操草槽',w:'操场 小草'},'cou':{c:'凑',w:'凑合 紧凑'},'can':{c:'参餐残灿',w:'参加 参观'},
    'cen':{w:'参差'},'cang':{c:'藏仓沧舱',w:'躲藏 仓库'},'ceng':{c:'层曾蹭',w:'层次 曾经'},'cuo':{c:'错措挫',w:'错误 措施'},
    'cui':{c:'翠脆摧催',w:'翠绿 干脆'},'cuan':{c:'窜篡',w:'逃窜'},'cun':{c:'存村寸',w:'存在 村庄'},'cong':{c:'从聪丛葱',w:'从前 聪明'},
    'sa':{c:'撒洒',w:'撒娇 洒脱'},'se':{c:'色塞涩瑟',w:'颜色 红色'},'su':{c:'速诉宿素苏',w:'速度 告诉'},
    'sai':{c:'赛塞腮',w:'比赛 塞子'},'sao':{c:'扫骚嫂',w:'打扫 扫描'},'sou':{c:'搜艘馊',w:'搜索 搜集'},'san':{c:'三散伞',w:'三个 散步'},
    'sen':{c:'森',w:'森林'},'sang':{c:'桑丧嗓',w:'嗓子 丧气'},'seng':{c:'僧',w:'僧人'},'suo':{c:'所锁缩索',w:'所以 所有'},
    'sui':{c:'随虽岁碎',w:'随便 虽然'},'suan':{c:'算酸蒜',w:'计算 算术'},'sun':{c:'孙损笋',w:'孙子 损失'},'song':{c:'送松宋颂',w:'送给 放松'},
    'ya':{c:'牙压鸭涯',w:'牙齿 压力'},'yao':{c:'要腰邀遥谣',w:'要求 需要'},'you':{c:'有又由友油',w:'没有 朋友'},
    'yan':{c:'眼言烟演严',w:'眼睛 语言'},'yang':{c:'样阳洋扬养',w:'一样 阳光'},'yong':{c:'用永勇拥泳',w:'使用 永远'},
    'wa':{c:'瓦挖蛙袜',w:'青蛙 袜子'},'wo':{c:'我窝卧握',w:'我们 我的'},'wai':{c:'外歪',w:'外面 外交'},'wei':{c:'为位未卫微',w:'因为 位置'},
    'wan':{c:'完万玩碗晚',w:'完成 晚上'},'wen':{c:'问文温闻稳',w:'问题 文化'},'wang':{c:'王往望忘网',w:'国王 忘记'},
    'er':{c:'二儿耳尔',w:'儿子 耳朵'},
    'yo':{w:'哟 哎哟'}
  };

  const YM_CATS = [
    {name:'单韵母', list:['a','o','e','i','u','ü'], bg:'#eef2ff', fg:'#6366f1'},
    {name:'复韵母', list:['ai','ei','ui','ao','ou','iu','ie','üe','er'], bg:'#e0f2fe', fg:'#0284c7'},
    {name:'前鼻音', list:['an','en','in','un','ün'], bg:'#f5f3ff', fg:'#7c3aed'},
    {name:'后鼻音', list:['ang','eng','ing','ong'], bg:'#fffbeb', fg:'#d97706'},
    {name:'三拼音节', list:['ia','ian','iang','iao','iong','ua','uai','uan','uang','uo','üan'], bg:'#fce7f3', fg:'#db2777'}
  ];
  const YM_FULL = [].concat(...YM_CATS.map(c=>c.list));

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
  function ymLabel(ym){
    const sanpin = ['ia','ian','iang','iao','iong','ua','uai','uan','uang','uo','üan'];
    if(sanpin.includes(ym)){
      const medial = ym[0];
      const rest = dn(ym).slice(1);
      return dn(medial) + '-' + rest;
    }
    return dn(ym);
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
    // 三拼音节检测：韵母以 i/u/ü 开头，且不是两拼复韵母/鼻韵母
    if(isSanPin(ym)){
      const medial = ym[0]; // i / u / ü
      const rest = dn(ym).slice(1); // 去掉介音后的韵母
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
    // 三拼音节至少 2 个字符
    if(ym.length <= 1) return false;
    const twoPin = ['i','u','v','ie','ve','in','ing','iu','ui','un'];
    if(twoPin.includes(ym)) return false;
    const first = ym[0];
    return first === 'i' || first === 'u' || first === 'ü' || first === 'v';
  }

  /* ─── 工具 ────────────────────────────────────────────────── */
  function pickRandom(){
    currentData = SYLLABLE_DATA[Math.floor(Math.random() * SYLLABLE_DATA.length)];
  }

  function getFinals(sm){
    return [...new Set(SYLLABLE_DATA.filter(d=>d.i===sm).map(d=>d.f))];
  }

  function findSyllable(sm, ym){
    return SYLLABLE_DATA.find(d=>d.i===sm && d.f===ym);
  }

  /* 三拼音节公式：声母 + 介音 + 韵母 */
  function formulaHTML(sm, ym){
    if(isSanPin(ym)){
      const medial = ym[0];
      const rest = dn(ym).slice(1);
      return `<span class="sm">${sm}</span><span class="arr"> + </span><span class="ym" style="color:#f59e0b;font-weight:700">${dn(medial)}</span><span class="arr"> + </span><span class="ym">${rest}</span>`;
    }
    return `<span class="sm">${sm}</span><span class="arr"> + </span><span class="ym">${dn(ym)}</span>`;
  }

  /* 声母/介音/韵母按钮组 */
  function componentButtonsHTML(sm, ym){
    if(isSanPin(ym)){
      const medial = ym[0];
      const rest = dn(ym).slice(1);
      const medialFile = medial === 'ü' ? 'v' : medial;
      return `
        <button data-play="sm">🔊 声母 ${sm}</button>
        <button data-play="ym-medial" data-medial="${medialFile}" style="background:#fff3e0;color:#f59e0b;border-color:#fde68a">🔊 介音 ${dn(medial)}</button>
        <button data-play="ym-rest" data-ym-rest="${rest}">🔊 韵母 ${rest}</button>
      `;
    }
    return `
      <button data-play="sm">🔊 声母 ${sm}</button>
      <button data-play="ym">🔊 韵母 ${dn(ym)}</button>
    `;
  }

  /* ü 去两点提示：j/q/x/y + ü 时显示 */
  function yuHint(sm, ym){
    const dropDot = ['j','q','x','y'];
    const dotFinals = ['ü','üe','üan','ün'];
    if(dropDot.includes(sm) && dotFinals.includes(ym)){
      return `<div class="bl-yu-hint" style="font-size:11px;color:#f59e0b;margin:2px 0 6px">💡 ${sm} + ${ym} 实际写作 <b>${sm}${ym.replace('ü','u')}</b>（ü 去两点）</div>`;
    }
    return '';
  }

  /* ─── 样式 ────────────────────────────────────────────────── */
  const STYLE_ID = 'blend-style';
  if(!document.getElementById(STYLE_ID)){
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      .bl-title{font-size:clamp(14px,3.5vw,16px);font-weight:700;color:#6366f1;margin:0 0 4px;padding-left:4px}
      .bl-sub{font-size:clamp(11px,2.8vw,13px);color:#94a3b8;margin-bottom:10px;padding-left:4px}
      .bl-card{background:#fff;border-radius:20px;padding:20px 16px 16px;box-shadow:0 2px 8px rgba(0,0,0,.05);text-align:center;margin-bottom:14px;max-width:480px;margin-left:auto;margin-right:auto}
      .bl-formula{font-size:clamp(18px,4.5vw,28px);color:#94a3b8;margin-bottom:4px;font-weight:500;letter-spacing:2px}
      .bl-formula .sm{color:#6366f1;font-weight:700}
      .bl-formula .ym{color:#22c55e;font-weight:700}
      .bl-formula .arr{color:#94a3b8;margin:0 4px}
      .bl-component-btn{display:flex;justify-content:center;gap:12px;margin-bottom:10px}
      .bl-component-btn button{border:none;background:#f1f4ff;padding:4px 14px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;color:#6366f1;transition:all .15s}
      .bl-component-btn button:hover{background:#e0e7ff}
      .bl-component-btn button:active{transform:scale(.9)}
      .bl-tone-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
      .bl-tone-card{padding:12px 4px 8px;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;transition:all .15s;background:#fff}
      .bl-tone-card:hover{border-color:#a5b4fc;background:#f8faff}
      .bl-tone-card:active{transform:scale(.92)}
      .bl-tone-card .tsyl{font-size:clamp(20px,5vw,30px);font-weight:800;color:#1e293b;display:block}
      .bl-tone-card .tsym{font-size:16px;color:#6366f1;display:block;margin-top:1px}
      .bl-tone-card .tname{font-size:11px;color:#94a3b8;margin-top:1px;display:block}
      .bl-tone-card.playing{border-color:#6366f1;background:#eef2ff}
      .bl-btns{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:8px}
      .bl-btn{padding:10px 24px;border:none;border-radius:10px;font-size:clamp(14px,3.5vw,18px);font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
      .bl-btn:active{transform:scale(.93)}
      .bl-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .bl-btn-next{background:#3b82f6;color:#fff;box-shadow:0 4px 12px rgba(59,130,246,.25)}
      .bl-btn-next:hover{background:#2563eb}
      .bl-hint{font-size:12px;color:#94a3b8;margin-top:8px}
      /* 模式切换 Tabs */
      .bl-modes{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none}
      .bl-modes::-webkit-scrollbar{display:none}
      .bl-modes .bl-mode-tab{
        flex-shrink:0;padding:8px 18px;border:none;border-radius:8px 8px 0 0;
        font-size:14px;font-weight:600;cursor:pointer;background:transparent;color:#94a3b8;
        transition:all .2s;position:relative;white-space:nowrap
      }
      .bl-modes .bl-mode-tab:hover{color:#6366f1;background:rgba(99,102,241,.06)}
      .bl-modes .bl-mode-tab.active{color:#6366f1;background:#fff;box-shadow:0 -1px 3px rgba(0,0,0,.04)}
      .bl-modes .bl-mode-tab.active::after{content:'';position:absolute;bottom:0;left:15%;right:15%;height:3px;background:#6366f1;border-radius:3px 3px 0 0}
      /* 选择器 */
      .bl-sel-label{font-size:13px;font-weight:600;color:#64748b;margin-bottom:6px}
      .bl-sel-sm{display:grid;grid-template-columns:repeat(auto-fill,minmax(48px,1fr));gap:4px;margin-bottom:10px}
      .bl-sel-sm-btn{flex-shrink:0;padding:6px 14px;border:2px solid #e2e8f0;border-radius:8px;background:#fff;font-size:14px;font-weight:700;cursor:pointer;color:#1e293b;transition:all .15s;white-space:nowrap}
      .bl-sel-sm-btn:hover{border-color:#a5b4fc;color:#6366f1}
      .bl-sel-sm-btn.active{background:#6366f1;color:#fff;border-color:#6366f1}
      .bl-sel-ym{display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:3px;margin-bottom:10px}
      .bl-sel-ym-btn{padding:3px 2px;border:1.5px solid #e2e8f0;border-radius:6px;background:#fff;font-size:12px;font-weight:600;cursor:pointer;color:#1e293b;text-align:center;transition:all .15s;line-height:1.2}
      .bl-sel-ym-btn:hover{border-color:#a5b4fc;color:#6366f1}
      .bl-sel-ym-btn.active{background:#22c55e;color:#fff;border-color:#22c55e}
      .bl-sel-ym-btn.disabled{opacity:.25;cursor:default}
      .bl-sel-ym-btn.disabled:hover{border-color:#e2e8f0;color:#1e293b}
      .bl-ym-cat{font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;display:flex;align-items:center;justify-content:center;margin:0;line-height:1.4;min-width:auto}
    `;
    document.head.appendChild(el);
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER 入口
     ═══════════════════════════════════════════════════════════════ */
  function render(container){
    pickRandom();
    selectSM = 'b';
    selectYM = null;
    mode = 'select';
    renderPage(container);
  }

  function renderPage(container){
    if(mode === 'random') renderRandom(container);
    else renderSelect(container);
  }

  /* ─── 四声调卡片渲染 ─────────────────────────────────────── */
  function toneCardsHTML(syl, sm, ym){
    return [1,2,3,4].map(t=>`
      <div class="bl-tone-card" data-sm="${sm}" data-ym="${ym}" data-syl="${syl}" data-tone="${t}">
        <span class="tsyl">${addTone(syl, t)}</span>
        <span class="tsym">${TONE_SYMBOLS[t]}</span>
        <span class="tname">${TONE_NAMES[t]}</span>
      </div>
    `).join('');
  }

  /* 四声调代表字固定行 */
  /* 四声调代表字（每调一字，对齐显示） */
  function toneCharRowHTML(syl){
    const entry = PINYIN_WORDS[syl];
    const chars = [1,2,3,4].map(t=>{
      let ch = '';
      if(entry){
        if(entry.t && entry.t[t]) ch = entry.t[t][0]; // 只取第一个字
        else if(!entry.t && entry.c){
          const arr = entry.c.split('');
          ch = arr[(t - 1) % arr.length];
        }
      }
      return ch;
    });
    if(!chars.some(c=>c)) return '';
    return `<div class="bl-tone-char-row" style="display:flex;gap:8px;margin-top:6px;text-align:center">
      ${chars.map(c=>`<span style="flex:1;font-size:clamp(18px,4.5vw,26px);font-weight:700;color:#f59e0b">${c || ''}</span>`).join('')}
    </div>`;
  }

  /* 当前选中声调的常用词（该调没有字则不显示词） */
  function toneWordsHTML(syl, tone){
    tone = tone || 1;
    const entry = PINYIN_WORDS[syl];
    // 该声调没有对应字 → 不显示词；无t字段的音节也不显示（避免调错配）
    if(entry){
      const hasToneChar = entry.t && !!entry.t[tone];
      if(!hasToneChar) return '';
    }
    let toneWords = [];
    if(entry && entry.w){
      if(typeof entry.w === 'object'){
        // 按调分组格式
        const words = entry.w[tone];
        if(words) toneWords = words.split(' ');
      } else {
        // 平面列表（无 t 字段的音节作为 fallback）
        toneWords = entry.w.split(' ');
      }
    }
    if(!toneWords.length) return '';
    const shuffled = toneWords.sort(()=>Math.random()-0.5).slice(0, Math.min(3, toneWords.length));
    const shown = shuffled.map(w => `<span style="display:inline-block;background:#f0f4ff;color:#6366f1;padding:2px 10px;border-radius:6px;margin:2px 4px;font-size:14px;font-weight:600">${w}</span>`).join('');
    return `<div class="bl-tone-words" style="margin-top:4px;padding-top:4px;border-top:1px dashed #e2e8f0;text-align:center">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">📖 ${TONE_NAMES[tone]}常用词</div>
      <div>${shown}</div>
    </div>`;
  }

  function bindToneCards(container, smGetter, ymGetter, sylGetter){
    container.querySelectorAll('.bl-tone-card').forEach(card=>{
      card.addEventListener('click', async function(){
        if(playing) return;
        const sm = this.dataset.sm;
        const ym = this.dataset.ym;
        const syl = this.dataset.syl;
        const tone = parseInt(this.dataset.tone);
        // 先更新常用词
        const wordsDiv = container.querySelector('.bl-tone-words');
        const wordsHTML = toneWordsHTML(syl, tone);
        if(wordsDiv) wordsDiv.outerHTML = wordsHTML;
        else if(wordsHTML){
          const charRow = container.querySelector('.bl-tone-char-row');
          if(charRow) charRow.insertAdjacentHTML('afterend', wordsHTML);
          else container.querySelector('#blToneGrid').insertAdjacentHTML('afterend', wordsHTML);
        }
        // 再播放音频
        this.classList.add('playing');
        playing = true;
        await playSyllable(sm, ym, syl, tone);
        this.classList.remove('playing');
        playing = false;
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     模式一：随机模式
     ═══════════════════════════════════════════════════════════════ */
  function renderRandom(container){
    const d = currentData;
    const isZT = ZHENG_TI.has(d.s);

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
        <div class="bl-title" style="margin:0">🔗 拼读训练</div>
        <div class="bl-modes" style="margin:0">
          <button class="bl-mode-tab${mode==='select'?' active':''}" data-mode="select">🎯 选择模式</button>
          <button class="bl-mode-tab${mode==='random'?' active':''}" data-mode="random">🎲 随机模式</button>
        </div>
      </div>
      <div class="bl-sub" style="margin-bottom:10px">${isZT ? '整体认读音节，直接播放' : '选择声调，三步拼读'}</div>

      <div class="bl-card">
        <div class="bl-formula">${formulaHTML(d.i, d.f)}</div>
        ${isZT ? `<div class="bl-zt-badge" style="font-size:11px;font-weight:700;color:#d97706;background:#fef3c7;display:inline-block;padding:1px 10px;border-radius:4px;margin:2px 0 4px">📌 整体认读音节 · 直接读整体</div>` : ''}
        <div class="bl-component-btn">
          ${componentButtonsHTML(d.i, d.f)}
        </div>

        ${yuHint(d.i, d.f)}

        <div class="bl-tone-grid" id="blToneGrid">
          ${toneCardsHTML(d.s, d.i, d.f)}
        </div>

        ${toneCharRowHTML(d.s)}

        <div class="bl-btns">
          <button class="bl-btn bl-btn-next" id="blNextBtn">➡️ 换一个</button>
        </div>
        <div class="bl-hint">点击声调卡片 → ${isZT ? '直接播放整体' : '三步拼读'}</div>
      </div>
    `;

    bindModes(container);
    bindToneCards(container, ()=>currentData.i, ()=>currentData.f, ()=>currentData.s);
    bindComponentBtns(container, currentData.i, currentData.f);

    container.querySelector('#blNextBtn').addEventListener('click', function(){
      if(currentAudio) currentAudio.pause();
      pickRandom();
      const nd = currentData;
      const isZ = ZHENG_TI.has(nd.s);
      container.querySelector('.bl-sub').textContent = isZ ? '整体认读音节，直接播放' : '选择声调，三步拼读';
      container.querySelector('.bl-formula').innerHTML = formulaHTML(nd.i, nd.f);
      const ztBadge = container.querySelector('.bl-zt-badge');
      if(ztBadge){
        if(isZ) ztBadge.style.display='inline-block';
        else ztBadge.style.display='none';
      }
      container.querySelector('.bl-component-btn').innerHTML = componentButtonsHTML(nd.i, nd.f);
      const hintDiv = container.querySelector('.bl-yu-hint');
      if(hintDiv) hintDiv.outerHTML = yuHint(nd.i, nd.f);
      container.querySelector('.bl-hint').textContent = isZ ? '点击声调卡片 → 直接播放整体' : '点击声调卡片 → 三步拼读';
      container.querySelector('#blToneGrid').innerHTML = toneCardsHTML(nd.s, nd.i, nd.f);
      let cr = container.querySelector('.bl-tone-char-row');
      if(cr) cr.outerHTML = toneCharRowHTML(nd.s);
      else container.querySelector('#blToneGrid').insertAdjacentHTML('afterend', toneCharRowHTML(nd.s));
      // 清除上一次点击留下的词区
      const oldWords = container.querySelector('.bl-tone-words');
      if(oldWords) oldWords.remove();
      bindToneCards(container, ()=>currentData.i, ()=>currentData.f, ()=>currentData.s);
      bindComponentBtns(container, nd.i, nd.f);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     模式二：选择模式（两步选择）
     ═══════════════════════════════════════════════════════════════ */
  function renderSelect(container){
    const finals = getFinals(selectSM);
    const selected = findSyllable(selectSM, selectYM);

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
        <div class="bl-title" style="margin:0">🔗 拼读训练</div>
        <div class="bl-modes" style="margin:0">
          <button class="bl-mode-tab${mode==='select'?' active':''}" data-mode="select">🎯 选择模式</button>
          <button class="bl-mode-tab${mode==='random'?' active':''}" data-mode="random">🎲 随机模式</button>
        </div>
      </div>
      <div class="bl-sub" style="margin-bottom:10px">选择声母和韵母，选择声调播放</div>

      <div class="bl-sel-label">1. 选声母</div>
      <div class="bl-sel-sm" id="blSelSm">
        ${SM_LIST.map(sm=>`<button class="bl-sel-sm-btn${sm===selectSM?' active':''}" data-sm="${sm}">${sm}</button>`).join('')}
      </div>
      <div class="bl-sel-label">2. 选韵母（灰色=该声母无此组合）</div>
      ${YM_CATS.filter(c=>c.name!=='三拼音节').map(cat=>`
        <div class="bl-sel-ym" style="margin-bottom:5px">
          <span class="bl-ym-cat" style="color:${cat.fg};background:${cat.bg}">${cat.name}</span>
          ${cat.list.map(ym=>{
            const valid = finals.includes(ym);
            return `<button class="bl-sel-ym-btn${ym===selectYM?' active':''}${!valid?' disabled':''}" data-ym="${ym}"${!valid?' disabled':''}>${dn(ym)}</button>`;
          }).join('')}
        </div>
      `).join('')}
      ${(()=>{
        const sanpin = YM_CATS.find(c=>c.name==='三拼音节');
        const sub = [
          {name:'i', list:['ia','ian','iang','iao','iong']},
          {name:'u', list:['ua','uai','uan','uang','uo']},
          {name:'ü', list:['üan']}
        ];
        return sub.map(g=>`
          <div class="bl-sel-ym" style="margin-bottom:3px">
            <span class="bl-ym-cat" style="color:#db2777;background:#fce7f3">三拼音节 · ${g.name}</span>
            ${g.list.map(ym=>{
              const valid = finals.includes(ym);
              return `<button class="bl-sel-ym-btn${ym===selectYM?' active':''}${!valid?' disabled':''}" data-ym="${ym}"${!valid?' disabled':''}>${ymLabel(ym)}</button>`;
            }).join('')}
          </div>
        `).join('');
      })()}

      <div class="bl-card">
        ${selected ? `
          <div class="bl-formula">${formulaHTML(selected.i, selected.f)}</div>
          ${ZHENG_TI.has(selected.s) ? `<div class="bl-zt-badge" style="font-size:11px;font-weight:700;color:#d97706;background:#fef3c7;display:inline-block;padding:1px 10px;border-radius:4px;margin:2px 0 4px">📌 整体认读音节 · 直接读整体</div>` : ''}
          <div class="bl-component-btn">
            ${componentButtonsHTML(selected.i, selected.f)}
          </div>
          ${yuHint(selected.i, selected.f)}
          <div class="bl-tone-grid" id="blToneGrid">
            ${toneCardsHTML(selected.s, selected.i, selected.f)}
          </div>
          ${toneCharRowHTML(selected.s)}
          <div class="bl-hint">${ZHENG_TI.has(selected.s) ? '点击声调卡片 → 直接播放整体' : '点击声调卡片 → 三步拼读'}</div>
         ` : `
          <div style="padding:10px 0;color:#94a3b8;font-size:16px">👆 选择声母和韵母</div>
        `}
      </div>
    `;

    bindModes(container);

    container.querySelector('#blSelSm').addEventListener('click', e=>{
      const btn = e.target.closest('.bl-sel-sm-btn');
      if(!btn || btn.classList.contains('active')) return;
      if(currentAudio) currentAudio.pause();
      selectSM = btn.dataset.sm; selectYM = null;
      renderSelect(container);
    });

    container.querySelectorAll('.bl-sel-ym').forEach(grid=>{
      grid.addEventListener('click', e=>{
        const btn = e.target.closest('.bl-sel-ym-btn');
        if(!btn || btn.classList.contains('disabled') || btn.classList.contains('active')) return;
        if(currentAudio) currentAudio.pause();
        selectYM = btn.dataset.ym;
        const s = findSyllable(selectSM, selectYM);
        container.querySelector('.bl-card').innerHTML = `
          <div class="bl-formula">${formulaHTML(s.i, s.f)}</div>
          ${ZHENG_TI.has(s.s) ? `<div class="bl-zt-badge" style="font-size:11px;font-weight:700;color:#d97706;background:#fef3c7;display:inline-block;padding:1px 10px;border-radius:4px;margin:2px 0 4px">📌 整体认读音节 · 直接读整体</div>` : ''}
          <div class="bl-component-btn">
            ${componentButtonsHTML(s.i, s.f)}
          </div>
          ${yuHint(s.i, s.f)}
          <div class="bl-tone-grid" id="blToneGrid">
            ${toneCardsHTML(s.s, s.i, s.f)}
          </div>
          ${toneCharRowHTML(s.s)}
          <div class="bl-hint">${ZHENG_TI.has(s.s) ? '点击声调卡片 → 直接播放整体' : '点击声调卡片 → 三步拼读'}</div>
         `;
         bindToneCards(container, ()=>selectSM, ()=>selectYM, ()=>s.s);
        bindComponentBtns(container, s.i, s.f);
        container.querySelectorAll('.bl-sel-ym-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    if(selected){
      bindToneCards(container, ()=>selectSM, ()=>selectYM, ()=>selected.s);
      bindComponentBtns(container, selected.i, selected.f);
    }
  }

  /* ─── 声母/介音/韵母单独播放 ──────────────────────────────────── */
  function bindComponentBtns(container, sm, ym){
    const btns = container.querySelectorAll('[data-play]');
    btns.forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(playing) return;
        playing = true;
        const play = btn.dataset.play;
        if(play === 'sm'){
          await playMP3(`audio/${sm}.mp3`);
        } else if(play === 'ym-medial'){
          await playMP3(`audio/${btn.dataset.medial}.mp3`);
        } else if(play === 'ym-rest'){
          await playMP3(`audio/${btn.dataset.ymRest}.mp3`);
        } else {
          await playMP3(`audio/${ym.replace('ü','v')}.mp3`);
        }
        playing = false;
      });
    });
  }

  /* ─── 主模式切换 ─────────────────────────────────────────── */
  function bindModes(container){
    container.querySelector('.bl-modes').addEventListener('click', e=>{
      const btn = e.target.closest('.bl-mode-tab');
      if(!btn) return;
      mode = btn.dataset.mode;
      if(mode === 'random') pickRandom();
      renderPage(container);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     注册
     ═══════════════════════════════════════════════════════════════ */
  registerModule('blending', {
    render: render,
    cleanup: function(){
      if(currentAudio){ currentAudio.pause(); currentAudio=null }
    }
  });

})();
