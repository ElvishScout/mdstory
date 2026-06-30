## 第三章：真相 {#chapter3}

<script>
  export default {
    locals({ globals }) {
      return {
        commanderName: globals.commanderName || "指挥官",
        currentKnowledge: globals.knowledge || 0,
        currentMorale: globals.crewMorale || 80,
        boardedShip: !!(globals.flags || {}).boardedShip,
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter3Entered = true;
    },
  };
</script>

_第三章 · 两百年后的答案_

### 舰内探索 {#alien-interior}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.exploredShip = true;
    },
    view({ globals, locals }) {
      return {
        commanderName: locals.commanderName,
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
        boardedShip: locals.boardedShip,
      };
    },
  };
</script>

你走进了外星飞船的内部。头盔上的探照灯光柱在黑暗中切开了一道狭窄的通道。

走廊不是为人类建造的。天花板很低——你必须微微弯腰才能通过。墙壁上布满了复杂的纹路，摸上去不是金属的冷硬感，而是一种半有机的温暖——像是骨头，又像是木材。你的靴子踩在地面上，发出沉闷的回声。

<span class="alien">一具遗骸靠在墙上。不是人类，但接近——身高大约相当于一个高个子的人类，身体结构是直的，两条手臂，两条腿。它的手指——有六根——手里攥着一个东西。</span>

{{#if boardedShip}}
你蹲下来，小心翼翼地掰开那只已经干枯了不知道多少年的手指。它的手心里攥着一个球体——拳头大小，表面是镂空的金属丝编织成的网，网的中心有一点微光在脉动。微光的节奏和那个信号是一样的——7 分 13 秒。这个球体不是一个容器——它就是信号源本身。或者至少是信号源的一个组成部分。

"指挥官，"你的通信频道里传来了罗伊的声音，"我分析了这个东西的能量特征。这是——一个记忆存储体。它储存的不是数据，是记忆。这个人在死之前把自己的记忆转录到了这个东西里。"

你低头看了看遗骸。它死的时候靠在墙上，手里攥着自己的记忆，用最后的力气把它留了下来。留给谁？不是留给自己的同类——否则它不会用人类的语言发出信号。它是留给人类的。留给你。
{{else}}
探测球传回了高分辨率图像——遗骸手里攥着一个球体，拳头大小，内部有微弱的脉冲。罗伊分析后认为那是一个记忆存储装置。但探测球无法读取出记忆的内容——只能确认一件事：那个球体是两百年前的最后一个意识留下的。

"指挥官，那里面储存的不是数据。是一个人的一生。它留在这里——是为了让后来的人看到。"
{{/if}}

<span class="clue">情报 +1（当前：{{knowledge}}）</span>

{{#nav "chapter3.revelation"}}继续深入飞船核心{{/nav}}

### 远程分析 {#remote-analysis}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
    },
    view({ globals }) {
      return {
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
      };
    },
  };
</script>

探测球在飞船核心区域附近徘徊了整整六个小时。收集到的数据量庞大到可怕——曙光号的 AI 在全力运转下也只能完成初步解析。

"指挥官，我们破译了船内的一些文本。"罗伊把翻译结果推送到了主屏幕上。

这艘船的名字，根据 AI 的翻译，叫"最后之望"。它属于一个自称"守夜人"的文明——这个文明在数千年前就已经察觉到了宇宙中某种危险的存在。

"不是战争，"罗伊的声音有些颤抖，"是一种现象。他们称之为'静默'。一种在星系间传播的东西——不是辐射、不是粒子——它会让所有智慧生命在接触到它的瞬间失去意识。不是死亡——是停止。思想停止、文明停止、一切停止。"

外星飞船在两百年前追踪到了一股"静默"脉冲——它正在朝着人类殖民星域的方向前进。按照现在的速度，大约在两百年后会到达。

<span class="warning">"就是现在，指挥官。"</span>

{{#nav "chapter3.revelation"}}在舰桥上召开紧急会议{{/nav}}

### 核心发现 {#revelation}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.reachedCore = true;
    },
    view({ globals, locals }) {
      return {
        commanderName: locals.commanderName,
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
        boardedShip: locals.boardedShip,
        highKnowledge: (globals.knowledge || 0) >= 3,
      };
    },
  };
</script>

{{#if boardedShip}}
你走到了外星飞船的核心舱。舱门已经半开着——从裂开的门缝里，你能看到内部柔和的蓝光。

核心舱很小——大约相当于曙光号舰桥的一半。墙壁上覆盖着一层半透明的物质，那种蓝光就是从这层物质里散发出来的，缓慢地、有节奏地明灭着。明灭的节奏和信号一致——这个舱室就是信号源。

舱室中央站着一个——形体。不是遗骸。是活着的。或者至少不能叫死去。

一个外星人——个子很高，身体呈现出一种病态的灰白色——被一排管道和线缆连接在船舱的墙壁上。它的眼睛闭着，胸口微微起伏——几乎察觉不到，但确实在动。它在这里——在活着和死去之间——维持信号运转，整整两百年。

你走到它面前。它没有反应。

罗伊在通信频道里说："指挥官——这艘飞船的能源系统还有 3% 的残余能量。这些能量全部被输送到这个舱室以维持它的生命。但它撑不了太久了——也许几个月，也许几周。"

<span class="alien">它在这里，孤零零地在一个死去的星系里，用一具身体、一颗心和一艘残破的飞船，朝着人类的方向持续发送了整整两个世纪的警告。</span>

{{else}}
曙光号的 AI 完成了对探测球数据的深度分析。

核心发现令人震惊：外星飞船的核心舱里，有一套完整的生命维持系统——已经运转了至少两百年。维持的对象是一个外星个体——它已经死了——但它的神经系统被连接在飞船的通信设备上，在死后依然按照预先设定的程序生成信号。

这艘飞船不是被遗弃的。它的最后一位船员用了自己的全部来维持这个警告——哪怕死去以后。

信号的内容已被完全破译。它是一个警告——关于一种正在逼近人类殖民星域的现象，外星文明称它为"静默"。它能让所有智慧生命停止思考。而外星飞船的船员用了两百年前的最后一刻——选择了向人类发出警告，而不是拯救自己。

<span class="alien">"不要来"不是为了保护他们。是为了保护我们。</span>
{{/if}}

<span class="clue">情报 +1（当前：{{knowledge}}）</span>

{{#nav "chapter3.decision"}}做出最终决定{{/nav}}

### 最终抉择 {#decision}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.madeFinalDecision = true;
    },
    view({ globals, locals }) {
      const boarded = !!(globals.flags || {}).boardedShip;
      const knowledge = globals.knowledge || 0;
      return {
        commanderName: locals.commanderName,
        knowledge,
        crewMorale: globals.crewMorale || 80,
        boardedShip: boarded,
        canTrueEnding: knowledge >= 4 && boarded,
        canGoodEnding: knowledge >= 2,
      };
    },
    onLeave({ globals }) {
      globals.flags.chapter3Complete = true;
    },
  };
</script>

你所知道的一切汇总如下：

- 一个叫"守夜人"的外星文明在数千年前发现了一种名为"静默"的宇宙现象。
- "静默"能让所有智慧生命停止思考——意识停滞、文明终结。
- 两百年前，一艘守夜人的飞船在追踪"静默"的过程中——发现它正朝着人类殖民区域前进。
- 飞船的最后一位船员——用自己残余的生命和死后被接续的身体——向人类发送了持续两百年的警告。
- 按照罗伊的计算——"静默"将在不久之后到达人类星域。

但现在你有了选择。守夜人的数据库里可能储存着对抗"静默"的方法——如果你愿意花时间破译的话。或者你也可以把数据带回联邦，让整个文明的科学家一起解决这个问题。或者你还可以——

<span class="clue">情报等级：{{knowledge}} | 船员士气：{{crewMorale}}</span>

{{#if canTrueEnding}}
你的情报已足够理解全局。你从头到尾经历了这一切——从信号到残骸，从记忆到真相。
{{#nav "endings.true"}}留在飞船上，启动守夜人数据库{{/nav}}
{{/if}}

{{#if canGoodEnding}}
情报等级足够，你可以做出不坏的选择。
{{#nav "endings.good"}}撤回曙光号，将全部数据带回联邦{{/nav}}
{{/if}}

{{#nav "endings.bad"}}试图用曙光号的武器摧毁"静默"脉冲{{/nav}}
