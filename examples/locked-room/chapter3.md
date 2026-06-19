## 第三章：盘问疑犯 {#chapter3}

<script>
  export default {
    locals({ globals }) {
      const flags = globals.flags || {};
      return {
        interrogatedZhao: !!flags.interrogatedZhao,
        interrogatedWife: !!flags.interrogatedWife,
        interrogatedButler: !!flags.interrogatedButler,
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter3Entered = true;
    },
  };
</script>

### 赵铭远 {#interrogate-zhao}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.interrogatedZhao = true;
    },
  };
</script>

你把赵铭远请进了偏厅。他没有推辞，大剌剌地在一张太师椅上坐下，翘起二郎腿，从西装内袋里掏出一包香烟，抽出一根点上。火柴的光在暗处亮了一瞬，照亮了他紧绷的下颌线。

他吸了一口烟，烟雾在昏黄的灯光下缓缓升腾、散开。你注意到他的西装袖口——右手的袖扣确确实实少了一枚。琥珀色的扣子不见了，只剩下一截空着的扣眼。

"赵先生和陈先生的合伙关系有多久了？"

"快十年了。"赵铭远吐出一口烟，"我和他是老相识。这十年我们赚过钱，也赔过钱——做生意嘛，总有起落。但他最近……"他顿了一下，把烟灰弹进烟灰缸里，"他最近有些不太对劲。"

"什么意思？"

赵铭远看了你一眼。那一眼里有某种复杂的东西——警觉、权衡、还有一丝不易察觉的紧张。

"他背着我在做一些我不知道的生意。我是最近才发现的——账目上有几笔大额支出，去向不明。我问过他，他含糊其辞，没有正面回答。"他顿了顿，"我怀疑他在跟日本人做生意。"

"为什么这么猜？"

"上个月我在他书房里看到一封信，信封上印着大阪的邮戳。后来我问了问行里的人，听说最近有日本商人在青城山一带活动——专门收老货。出的价钱很高，不问来路。"

"你和陈先生今晚七点半左右在书房里谈过话？"

赵铭远的眉毛微微挑起。"……阿莲告诉你的？"他哼了一声，"对，是谈过。我问他账上那几笔钱去哪了，他说是正常投资，叫我别管。"

"你们吵架了？"

"算不上吵架。"他把烟掐灭在烟灰缸里，用力过猛，烟灰溅了出来。"我只是告诉他——如果他在搞什么见不得人的勾当，别把我拖下水。"

"你离开书房之后去了哪里？"

"楼下客厅。我倒了一杯酒，坐在壁炉前面。"他笑了笑，但那笑容很冷，"陈太太可以作证——我下楼的时候她已经在客厅了。之后我就一直没离开过。"

"你有没有再去过书房？"

"没有。"

他的回答很干脆，干脆得像是早就准备好了。

你注意到他下意识地摸了摸自己的右袖口——那个缺了扣子的位置。当他意识到你在看他的手时，他迅速把手放了下来，换了个姿势。

{{#nav "chapter3.interrogate-wife"}}找陈太太谈谈{{/nav}}
{{#nav "chapter3.interrogate-butler"}}找王管家谈谈{{/nav}}
{{#nav "chapter3.conference"}}结束问话，召集所有人{{/nav}}

### 陈太太 {#interrogate-wife}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.interrogatedWife = true;
    },
  };
</script>

陈太太依然坐在客厅的沙发上。她换了个姿势——侧身靠着扶手，一只手撑着额头。壁炉的火光映在她的侧脸上，她的表情你读不太懂。像是疲惫，又像是释然。她换上了一件深色的家常旗袍，卸下了耳环和胸针，整个人看起来比之前柔和了一些，也脆弱了一些。

你坐到她对面的椅子上。

"陈太太，关于你先生去世这件事，你有什么想告诉我的吗？"

她沉默了很久。

然后她开口了，声音不大，却异常清晰："他是活该。"

这句话像一块石头落入平静的水面。

"什么意思？"

"你以为你认识一个人认识了十年，你知道他是谁。"她说着，嘴角浮起一丝苦笑。"但后来你发现你根本不认识他。他做的事情——"她摇了摇头，没有说下去。

你等了一会儿，然后换了个方向。

"你知道书房里有暗门吗？"

陈太太的表情没有变化——但她在回答之前有一个极其短暂的停顿，就像她在决定要不要承认。

"知道。"

"什么时候知道的？"

"嫁给他之后第二年就发现了。那扇暗门是他修书房的时候就有的——他跟我说是以前的房东修的，用来藏东西。"

"除了你还有谁知道？"

"老王肯定知道。赵铭远……我不确定。他来过很多次，也许他自己发现的。"

"今晚八点到八点半之间，你去了哪里？"

"我说过，我去后院透气了。"

"你看到了什么？"

陈太太抬起眼睛看着你。那个目光里有一点意外——像是在评估你问这个问题的用意。

"我看到了……有人从后院的小路离开。"她说，"方向是后山。"

"你能认出是谁吗？"

"雾太大。我只看到一个人影——穿着深色的衣服，走得很快，像是在赶时间。"

"男的女的？"

她沉默了片刻。"应该是个男人。身形不算高大，但也不是瘦弱的那种。"

你说不上来她的话里有多少可信度。但她提供的这个信息——和你在后院发现的脚印完全吻合。

"你为什么要去后院？"

"屋里太闷了。"她说，语气平淡。"我想出去透透气——就这样。"

但她的手指又开始颤抖了——和之前一模一样的动作。

{{#nav "chapter3.interrogate-zhao"}}找赵铭远谈谈{{/nav}}
{{#nav "chapter3.interrogate-butler"}}找王管家谈谈{{/nav}}
{{#nav "chapter3.conference"}}结束问话，召集所有人{{/nav}}

### 王管家 {#interrogate-butler}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.interrogatedButler = true;
      if (!globals.clues.includes("butler-testimony")) {
        globals.clues.push("butler-testimony");
      }
    },
  };
</script>

王管家在偏厅里站着——他不愿意坐下。灯光照在他花白的头发上，他微微低着头，双手交握在身前。刚才一番折腾下来，他已经不像最初那样慌乱，取而代之的是一种深沉的、近乎认命般的平静。

"王先生，你说你在陈府三十七年了。"

"是。"

"那么你对陈先生和赵先生之间的合作关系应该很了解。"

"老朽负责管账。他们的账目，老朽都经手。"

"最近账面上有没有什么异常？"

王管家沉默了一会儿。

"赵先生……一直在从账上支钱。"他说，声音很低。"说是生意周转，但支得太频繁了。三个月里支了五笔，加起来有三万多块大洋。老爷开始没说什么，后来发现了，很不高兴。"

"这件事除了你还有谁知道？"

"只有老爷和我知道。赵先生大概不知道我晓得了——老爷还没来得及跟他摊牌。"

你的脑海中拼起了一块碎片。陈怀远请他来——就是为了处理这件事？因为发现了合伙人私自挪用资金？还是因为发现了赵铭远和日本人的勾当？

"王先生，你今晚抽过烟吗？"

"老朽不抽烟。"

"那赵先生平时抽什么烟？"

"普通的老刀牌卷烟。老朽没见过他抽雪茄。"

你点了点头。书房地毯上的雪茄烟灰——说明当晚还有另一个人出现过。一个抽雪茄的人。一个和陈怀远有秘密交易的人。

"最后一个问题——你今天晚上有没有去过后院？"

王管家的表情没有变化。但他回答之前的那一瞬间迟疑，你已经注意到了。

"……没有。"

{{#nav "chapter3.interrogate-zhao"}}找赵铭远谈谈{{/nav}}
{{#nav "chapter3.interrogate-wife"}}找陈太太谈谈{{/nav}}
{{#nav "chapter3.conference"}}结束问话，召集所有人{{/nav}}

### 问话结束 {#conference}

<script>
  export default {
    view({ globals }) {
      const flags = globals.flags || {};
      const clues = globals.clues || [];
      return {
        interrogatedZhao: !!flags.interrogatedZhao,
        interrogatedWife: !!flags.interrogatedWife,
        interrogatedButler: !!flags.interrogatedButler,
        allInterrogated: !!(flags.interrogatedZhao && flags.interrogatedWife && flags.interrogatedButler),
        hasCufflink: clues.includes("cufflink"),
        hasPassage: clues.includes("hidden-passage"),
      };
    },
  };
</script>

{{#if allInterrogated}}
你和每个人都谈过了。你在偏厅里独自坐了一会儿，把所有的口供和线索摊在桌上。

现在你面临最后的决断——凶手就在这三人之中。你知道密室的手法，你知道凶器，你知道动机——但这些碎片能否拼成一个完整而无可辩驳的真相？

你站起来，走向客厅。

所有人都在那里，等着你。

{{#nav "chapter4.accusation"}}当众指认凶手{{/nav}}
{{else}}
你还没有和所有人谈完。偏厅外面，还有人在等着你。

{{#unless interrogatedZhao}}
{{#nav "chapter3.interrogate-zhao"}}找赵铭远谈谈{{/nav}}
{{/unless}}

{{#unless interrogatedWife}}
{{#nav "chapter3.interrogate-wife"}}找陈太太谈谈{{/nav}}
{{/unless}}

{{#unless interrogatedButler}}
{{#nav "chapter3.interrogate-butler"}}找王管家谈谈{{/nav}}
{{/unless}}
{{/if}}
