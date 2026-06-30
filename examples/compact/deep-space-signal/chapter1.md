## 第一章：信号 {#chapter1}

<script>
  export default {
    locals({ globals }) {
      return {
        moraleOk: (globals.crewMorale || 80) >= 50,
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter1Entered = true;
    },
  };
</script>

_第一章 · 深空中的呼唤_

### 舰桥 {#bridge}

<script>
  export default {
    view({ globals, locals }) {
      return {
        moraleOk: locals.moraleOk || false,
        crewMorale: globals.crewMorale || 80,
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

曙光号的舰桥笼罩在恒星投影仪投出的淡蓝色光芒中。十二个操作台呈弧形排列在你面前，每一个屏幕上都滚动着密密麻麻的数据。主屏幕上，K-427 星系的星图正在缓缓旋转——一颗死去的白矮星，三颗冰冷的岩石行星，以及一个微弱的、脉动的信号源标记。

你的大副陈敏转过身来。

"指挥官，信号的嵌套加密已经解开了第二层。信号的内容……"她顿了一下，把数据投到了主屏幕上。

主屏幕闪烁了一下，然后显示出一行清晰的文字——不是外星文字，是标准联邦通用语：

<span class="alien">"不要来。"</span>

"这段信息被封装在信号的第三层嵌套中，使用的加密算法比我们目前最先进的军事级加密还要复杂。按照这个技术水平——发出这个信号的文明，至少领先我们五百年。"

舰桥安静了几秒钟。只有仪器运转的微弱嗡鸣。

"但有趣的是，"陈敏继续说，"这段话用的是我们的语言。就好像——他们知道我们会收到。"

陈敏等着你的命令。她用的是你名字的全称——在舰桥日志上，每一行的末尾都需要一个签名。

{{input "string" $commanderName="指挥官"}}

<span class="clue">你盯着主屏幕上的文字。一个领先人类五百年的文明，用人类的语言向人类发出警告——不要来。这到底是警告，还是邀请？</span>

{{#if moraleOk}}
你环顾舰桥。船员们虽然紧张，但目光坚定。他们相信你能做出正确的判断。
{{else}}
舰桥上的气氛有些压抑。你能感觉到船员们的不安——他们希望你能做出安全的决定。
{{/if}}

船员士气：{{crewMorale}} | 情报等级：{{knowledge}}

{{#nav "chapter1.analysis"}}下令分析信号的更多细节{{/nav}}
{{#nav "chapter1.course-set"}}直接设定航向，驶往 K-427{{/nav}}

### 信号分析 {#analysis}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.analyzedSignal = true;
    },
    view({ globals }) {
      return {
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

你把科学官罗伊叫了过来。他花了三个小时对信号做了完整的频谱分析。

"指挥官，有三件事需要注意。"

罗伊把三组数据推送到你的终端上。

"第一——信号源不是一个固定的发射器。根据多普勒频移分析，信号源正在运动——速度约为光速的 0.03%。它在 K-427 星系内部沿着一条精确的轨道运行。不是自然天体，是一个航天器。"

"第二——信号的重复周期是 7 分 13 秒。但我们分析了信号的时间戳——它不是在重复。每一段信号都是实时生成的。也就是说——那个信号源现在就在 K-427 星系内部工作着。"

"第三——"罗伊的声音压低了一些，"我们解开第三层加密之后发现，'不要来'不是唯一的文本。后面还有一段话——被一种我们完全无法识别的算法加密了。曙光号的量子计算机可能需要几个月才能解开。但如果我们靠得更近——也许可以。"

<span class="clue">情报 +1（当前：{{knowledge}}）</span>

"所以你的建议是？"你问。

罗伊犹豫了一下。"我的建议是——接近 K-427，但不能直接闯入。我们应该在星系边缘先停一下，用被动传感器做一次完整的扫描。这样既能获取更多数据，又不会暴露自己。"

<span class="system">[科学团队建议：谨慎接近]</span>

{{#nav "chapter1.course-set"}}回到舰桥，制定航向计划{{/nav}}

### 航向设定 {#course-set}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.courseSet = true;
    },
    view({ globals }) {
      return {
        knowledge: globals.knowledge || 0,
        highKnowledge: (globals.knowledge || 0) >= 1,
        crewMorale: globals.crewMorale || 80,
      };
    },
    onLeave({ globals }) {
      globals.flags.chapter1Complete = true;
    },
  };
</script>

曙光号的导航台上，K-427 星系的立体星图悬浮在空气中。三条可选航线用不同的颜色标了出来。

**航线 A（蓝色）**：直接跃迁到 K-427 星系内部。最快——大约 18 个小时就能抵达。但跃迁过程中的能量波动几乎一定会被信号源探测到。

**航线 B（橙色）**：跃迁到 K-427 星系外围 0.3 光年处，然后以亚光速缓慢接近。需要 72 小时，但被动传感器可以在接近过程中持续收集数据。

**航线 C（红色）**：先跃迁到邻近的 K-425 星系（已知安全），然后以常规引擎跨越星际空间——耗时 120 小时，但可以做到完全不被探测。

{{#if highKnowledge}}
<span class="clue">根据科学团队的分析，信号源是一个在轨道上运行的人工航天器。被动接近——航线 B——似乎是收集情报的最佳选择。但航线 A 更快，航线 C 更安全。</span>
{{/if}}

船员士气：{{crewMorale}} | 情报等级：{{knowledge}}

{{#nav "chapter2.arrival"}}选择航线 A：直接跃迁，速战速决{{/nav}}
{{#nav "chapter2.arrival"}}选择航线 B：在外围停靠，谨慎扫描{{/nav}}
{{#nav "chapter2.arrival"}}选择航线 C：绕道 K-425，完全隐蔽{{/nav}}
