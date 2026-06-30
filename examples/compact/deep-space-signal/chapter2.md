## 第二章：废弃舰 {#chapter2}

<script>
  export default {
    locals({ globals }) {
      return {
        commanderName: globals.commanderName || "指挥官",
        currentKnowledge: globals.knowledge || 0,
        currentMorale: globals.crewMorale || 80,
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter2Entered = true;
    },
  };
</script>

_第二章 · 黑暗中的残骸_

### 抵达 {#arrival}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.arrivedAtK427 = true;
    },
    view({ globals, locals }) {
      return {
        commanderName: locals.commanderName,
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
        highKnowledge: (globals.knowledge || 0) >= 2,
      };
    },
  };
</script>

曙光号结束了跃迁。舰桥主屏幕上，K-427 星系的景象缓缓浮现。

一颗白矮星悬挂在视野中央——暗白色的、死气沉沉的，像是宇宙中一颗熄灭的炭块。它的周围，三颗岩石行星排成一列，表面覆盖着亿万年的冰层和陨石坑。什么都没有。

除了——

"指挥官，光学传感器捕捉到了目标。"

主屏幕放大了 K-427 第三颗行星的轨道区域。在行星的阴影里，一个轮廓缓缓浮现——那是一艘飞船。不是人类造的。它的外形像一枚拉长的水滴，外壳是暗灰色的，没有任何可见的引擎喷口或舷窗。它的长度——根据曙光号的测距仪——大约是 4.7 公里。

<span class="alien">一艘外星飞船。在黑暗中漂浮了不知道多少年。</span>

"它不是被废弃的，"陈敏的声音有些发紧，"它外壳温度是 3.2 开尔文——几乎接近绝对零度。但它内部有能源信号。很微弱，但确实存在。"

{{#if highKnowledge}}
<span class="clue">根据之前对信号的分析，这就是那个信号源。它在这里——在一颗死星旁边——持续发送了至少两百年的信号。信号说"不要来"。但发出信号的那个文明，似乎早就已经不在了。</span>
{{/if}}

情报等级：{{knowledge}} | 船员士气：{{crewMorale}}

{{#nav "chapter2.derelict"}}接近外星飞船，进行近距离扫描{{/nav}}

### 外星残骸 {#derelict}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
    },
    view({ globals }) {
      return {
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
        hasArmoryAccess: (globals.inventory || []).includes("武装小队"),
      };
    },
  };
</script>

曙光号以最慢的推进速度靠近那艘外星飞船。随着距离的缩短，更多细节出现在屏幕上。

"它的外壳上——有损伤。"

陈敏把光学图像放大了十倍。外星飞船的外壳不是光滑的——上面布满了密密麻麻的凹痕和裂纹。不是陨石撞击——陨石坑应该是圆形的。这些痕迹是线性的，像是被某种能量武器反复轰击过。

"初步分析表明，这些损伤至少有两百年历史了，和这个星系被标记为'无生命'的时间段吻合。这艘飞船——经历过一场战斗。"

罗伊插话了："指挥官，还有一个更重要的发现。飞船的后半段有一道裂口——宽度大约六米。裂口边缘的金属有熔化后重新凝固的痕迹。那不是武器造成的，是内部爆炸。有人——或者有东西——从飞船内部破坏了自己的船。"

<span class="clue">情报 +1（当前：{{knowledge}}）</span>

"它是自己来到这里的，"你说，"也许是逃到这里，也许是被命令来到这里——然后它就待在这里，发出了两百年的信号。"

{{#nav "chapter2.boarding"}}准备登舰小队{{/nav}}
{{#nav "chapter2.remote-scan"}}不登舰，用远程探测器深入扫描{{/nav}}

### 登舰准备 {#boarding}

<script>
  export default {
    onEnter({ globals }) {
      const inv = globals.inventory || [];
      if (!inv.includes("登舰小队")) {
        inv.push("登舰小队");
      }
      globals.inventory = inv;
      globals.flags.boardedShip = true;
    },
    view({ globals, locals }) {
      return {
        commanderName: locals.commanderName,
        crewMorale: globals.crewMorale || 80,
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

你做出了决定——派出登舰小队。

一支六人小队在机库里集合。两名工程师、一名科学官、两名安全人员，还有你自己。每个人都在检查自己的装备——氧气瓶、通信器、武器。没有人在说话。

外星飞船的裂口就在前面——漆黑一片，像是巨兽的嘴巴。

你在通信频道里对留在舰桥上的陈敏说："如果两个小时内我们没有回报，你就带着曙光号离开这里。不要等我们。"

"明白，"陈敏的声音停顿了一下，"指挥官——注意安全。"

你戴上头盔，最后一个踏上了外星飞船的外壳。靴子的磁力锁牢牢吸附在金属表面上，每一步都发出沉闷的撞击声。

裂口就在面前。你打开头盔上的探照灯，光柱照进了飞船内部——墙壁、走廊、黑暗——以及一具靠在走廊墙上的、早已干枯的躯体。不是人类。但看起来——太像了。

<span class="alien">舰内有一股沉寂了两百年的气味。像是灰烬，又像是枯叶。</span>

{{#nav "chapter3.alien-interior"}}走进外星飞船{{/nav}}

### 远程扫描 {#remote-scan}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.remoteScanOnly = true;
    },
    view({ globals }) {
      return {
        knowledge: globals.knowledge || 0,
        crewMorale: globals.crewMorale || 80,
      };
    },
  };
</script>

你决定不冒险登舰。曙光号释放了六个探测球——它们漂浮着穿过外星飞船外壳的裂口，进入了飞船内部。

探测球传回的画面令人不安。

飞船内部的结构和人类飞船完全不同——走廊不是直线的，而是螺旋形的，像是模仿某种生物的血管。墙壁上有奇怪的凸起和沟槽，可能是照明系统，也可能是一种完全不基于光的感知界面。

"探测球三号在走廊尽头发现了一具遗骸。"罗伊把画面投射到主屏幕上。

半人形——两条手臂，一条腿（或者是三条腿中的一条），身体上覆盖着早已磨损的织物。遗骸旁边的墙壁上有一组符号——探测球的 AI 正在尝试解码。

<span class="clue">情报 +1（当前：{{knowledge}}）</span>

"探测球五号发现了飞船的核心区域。那里有一股残余的能量信号——和两百年前的信号频率完全匹配。指挥官，我们的 AI 估计能在三天内完成对所有数据的初步分析。但要知道更多——还是需要人进去。"

{{#nav "chapter3.remote-analysis"}}继续远程分析，等待 AI 结果{{/nav}}
{{#nav "chapter3.alien-interior"}}改变主意，派出登舰小队{{/nav}}
