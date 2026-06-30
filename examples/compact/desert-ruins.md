---
title: 沙海遗踪
globals:
  inventory: []
  health: 100
  knowledge: 0
  flags: {}
---

# 沙海遗踪

<script>
  export default {
    globals() {
      return {
        inventory: [],
        health: 100,
        knowledge: 0,
        flags: {},
      };
    },
    onStart({ globals }) {
      globals.flags.storyStarted = true;
    },
  };
</script>

<style>
  .danger { color: #e74c3c; }
  .treasure { color: #f39c12; }
  .clue { color: #3498db; font-style: italic; }
  .whisper { color: #9b59b6; }
</style>

_炽风卷起漫天黄沙，将天与地搅成一片浑浊的金色。你站在最后一座绿洲的边缘，身后是驼铃和水壶，面前是一望无际的沙海。传说在沙海深处埋着一座古城——楼陀罗——古书上说它的城墙是用玉石砌成的，城门上镶嵌着七百颗夜明珠。当然，传说从来不全是真的。但你手里的那张羊皮地图是真的——至少看起来是真的。_

_上面的墨迹很旧了，有些地方已经被虫蛀出了小洞，但那条从绿洲延伸到沙漠腹地的路线仍然清晰可辨。地图的边缘写着一行小字，字迹潦草而急促：_

_"找到楼陀罗的人，可以许一个愿望。但记住——城里的东西，未必都想让你离开。"_

## 第一章：大漠边缘 {#chapter1}

<script>
  export default {
    locals({ globals }) {
      return {
        currentHealth: globals.health || 100,
        hasMap: (globals.inventory || []).includes("羊皮地图"),
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter1Entered = true;
    },
    onLeave({ globals, locals }) {
      globals.health = locals.currentHealth || globals.health;
    },
  };
</script>

_第一章标题页 · 大漠边缘_

### 绿洲镇 {#oasis-town}

<script>
  export default {
    view({ globals }) {
      return {
        hasWater: (globals.inventory || []).includes("水袋"),
      };
    },
  };
</script>

绿洲镇比你想象中要小。说是"镇"，其实只是围着两口井搭起来的十来间土坯房。镇上的人皮肤被太阳晒成深棕色，眼神里有种属于沙漠居民的警觉和安详。他们不太和外来人说话——但一个拄着拐杖的老人坐在井边，看见你手里的羊皮地图之后，主动朝你招了招手。

他自称老韩，年轻时也是穿越沙海的向导。

"你要去找楼陀罗？"他的声音像砂纸在木头上打磨，"三十年没人问过那条路了。"

你点了点头。

"你叫什么名字，年轻人？"

{{input "string" $explorerName="探险者"}}

<span class="clue">老韩打量了你一会儿。</span>

"你知道每年有多少人走进这片沙漠，就再也没有出来吗？如果你铁了心要去——"他站起来，拐杖在沙地上戳出了一个小坑，"至少让我给你点东西。下面这些装备，你可以挑两样带上。"

{{#if hasWater}}
_你腰间已经挂着水袋了。_
{{/if}}

{{#nav "chapter1.supply-choice"}}挑选装备{{/nav}}
{{#nav "chapter1.sandstorm"}}不选装备，直接出发{{/nav}}

### 准备物资 {#supply-choice}

<script>
  export default {
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        hasWater: inv.includes("水袋"),
        hasCompass: inv.includes("星盘"),
        hasRope: inv.includes("麻绳"),
        hasKnife: inv.includes("短刀"),
        picked: (globals.flags || {}).suppliesPicked || 0,
        canPick: ((globals.flags || {}).suppliesPicked || 0) < 2,
      };
    },
  };
</script>

老韩从他的旧箱子里翻出了几样东西，一一摆在你面前。

"你自己挑吧。最多两件——再多你也背不动。"

- <span class="treasure">水袋</span>：满满一袋清水。沙漠里最珍贵的东西。
- <span class="treasure">星盘</span>：铜制的古老导航仪。夜里靠星象辨别方向。
- <span class="treasure">麻绳</span>：一卷结实的粗麻绳。遗迹里总会有需要攀爬的地方。
- <span class="treasure">短刀</span>：一把旧但磨得很锋利的短刀。也许能撬开什么东西。

{{#if canPick}}
{{#if hasWater}}
{{else}}
{{#nav "chapter1.pick-water"}}选择水袋{{/nav}}
{{/if}}
{{#if hasCompass}}
{{else}}
{{#nav "chapter1.pick-compass"}}选择星盘{{/nav}}
{{/if}}
{{#if hasRope}}
{{else}}
{{#nav "chapter1.pick-rope"}}选择麻绳{{/nav}}
{{/if}}
{{#if hasKnife}}
{{else}}
{{#nav "chapter1.pick-knife"}}选择短刀{{/nav}}
{{/if}}
{{else}}
_你已经挑够两件了。_

{{#nav "chapter1.sandstorm"}}谢过老韩，走进沙漠{{/nav}}
{{/if}}

### 拿了水袋 {#pick-water}

<script>
  export default {
    onEnter({ globals }) {
      if (!globals.inventory.includes("水袋")) {
        globals.inventory.push("水袋");
      }
      globals.flags.suppliesPicked = (globals.flags.suppliesPicked || 0) + 1;
    },
    view({ globals }) {
      return { picked: globals.flags.suppliesPicked || 0 };
    },
  };
</script>

你拿起水袋。沉甸甸的，大概能撑三四天。

老韩点了点头："明智。没有水，别的都是空谈。"

已选装备：{{picked}}/2

{{#nav "chapter1.supply-choice"}}继续挑选{{/nav}}
{{#nav "chapter1.sandstorm"}}装备够了，出发{{/nav}}

### 拿了星盘 {#pick-compass}

<script>
  export default {
    onEnter({ globals }) {
      if (!globals.inventory.includes("星盘")) {
        globals.inventory.push("星盘");
      }
      globals.flags.suppliesPicked = (globals.flags.suppliesPicked || 0) + 1;
    },
    view({ globals }) {
      return { picked: globals.flags.suppliesPicked || 0 };
    },
  };
</script>

你把星盘翻过来看了看。背面刻着一圈古文字，你不认识，但铜面上刻的星图纹路清晰。

"夜里拿它对着北斗星，就不会走偏。"老韩说，"沙漠里的路不是直的——一阵沙暴就能让你偏离方向二十里。"

已选装备：{{picked}}/2

{{#nav "chapter1.supply-choice"}}继续挑选{{/nav}}
{{#nav "chapter1.sandstorm"}}装备够了，出发{{/nav}}

### 拿了麻绳 {#pick-rope}

<script>
  export default {
    onEnter({ globals }) {
      if (!globals.inventory.includes("麻绳")) {
        globals.inventory.push("麻绳");
      }
      globals.flags.suppliesPicked = (globals.flags.suppliesPicked || 0) + 1;
    },
    view({ globals }) {
      return { picked: globals.flags.suppliesPicked || 0 };
    },
  };
</script>

你把麻绳绕成一捆背在肩上。很结实，手指粗的麻线绞在一起，用力一拉纹丝不动。

"遗迹里的台阶靠不住。"老韩敲了敲拐杖，"几千年的石头，说塌就塌。有根绳子多条命。"

已选装备：{{picked}}/2

{{#nav "chapter1.supply-choice"}}继续挑选{{/nav}}
{{#nav "chapter1.sandstorm"}}装备够了，出发{{/nav}}

### 拿了短刀 {#pick-knife}

<script>
  export default {
    onEnter({ globals }) {
      if (!globals.inventory.includes("短刀")) {
        globals.inventory.push("短刀");
      }
      globals.flags.suppliesPicked = (globals.flags.suppliesPicked || 0) + 1;
    },
    view({ globals }) {
      return { picked: globals.flags.suppliesPicked || 0 };
    },
  };
</script>

你抽出短刀看了一眼。刀刃上有细密的磨痕——老韩显然用了很多年。刀柄是牛角做的，被手汗沁出了深色的包浆。

"这把刀跟了我二十年。"老韩说，"撬过石门、砍过蝎子、削过果子。给你了。"

已选装备：{{picked}}/2

{{#nav "chapter1.supply-choice"}}继续挑选{{/nav}}
{{#nav "chapter1.sandstorm"}}装备够了，出发{{/nav}}

### 沙暴 {#sandstorm}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.metSandstorm = true;
      globals.flags.chapter1Complete = true;
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasWater: inv.includes("水袋"),
        hasCompass: inv.includes("星盘"),
        hasKnife: inv.includes("短刀"),
        hasRope: inv.includes("麻绳"),
      };
    },
  };
</script>

沙漠的白天是一种折磨。太阳像一块烧红的铁饼悬在头顶，每一粒沙子都在反射热量。你走了大约六个小时，脚底隔着靴子都能感受到沙子的温度。你的影子和你的身体之间除了一小片黑色的沙地以外什么都没有。

然后你听到了声音。

那不是风声——你在沙漠里已经待得够久了，知道风是什么声音。这个声音更低沉，更持续，像远处有一千头牛在同时奔跑。你转过身，看到南边的天际线上有一道黑线正在向你的方向推移。它吞噬着天空——黑色的线不是线，是一堵墙。

<span class="danger">一堵沙墙。</span>

沙暴来了。

{{#if hasWater}}
你趴在地上，用衣服蒙住口鼻。沙暴从你身上碾过去——那种感觉像是被活埋。沙子钻进你每一道缝隙：衣领、袖口、靴子。但水袋被你紧紧压在怀里，一滴都没有洒。风暴过去后你喝了一大口水，继续往前走。
{{else}}
你趴在地上，用衣服蒙住口鼻。沙暴从你身上碾过去——那种感觉像是被活埋。沙子钻进你每一道缝隙：衣领、袖口、靴子。风暴过去之后你的喉咙像着了火，但你没有水。你的体力下降了不少。
{{/if}}

{{#if hasCompass}}
风暴过后天已经黑了。你掏出星盘，对着北斗星比了比方向。指针微微晃动，然后稳稳地指向北方——你对照了一下地图，确认自己没有偏离路线。星盘救了你的命。
{{else}}
风暴过后天已经黑了。你只能凭感觉判断方向，但沙暴已经让你完全迷失了方位。你在黑暗中走了很久，走错了两次路，多消耗了半天的体力才找回正确方向。
{{/if}}

<span class="clue">又走了一天。</span>沙丘终于开始变矮了，沙地下面开始露出石头的棱角——不是碎石头，是切割过的方石，整齐得像是什么建筑的基座。沙子覆盖了大部分，但那些石头的边缘还是能看出来。你脚下的这片沙漠在几千年前曾经是一座城。

楼陀罗。

风在石缝间穿过，发出呜呜的声响——像是什么人在远远地吹着笛子。

你在石头间走着，直到发现地面上有一个凹陷——那是一个被沙子半埋的洞口，石阶向下延伸。石阶上刻着花纹，虽然被风化得很模糊了，但依然看得出来曾经很精致。洞口两侧立着两根石柱，柱身上密密麻麻地刻满了古文字。你不认识那些字，但你的直觉告诉你——

你找到了。

{{#nav "chapter2.corridor"}}走进洞口{{/nav}}

## 第二章：地下迷宫 {#chapter2}

<script>
  export default {
    locals({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter2Entered = true;
    },
  };
</script>

_第二章 · 地下迷宫_

### 长廊 {#corridor}

<script>
  export default {
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasKnife: inv.includes("短刀"),
      };
    },
  };
</script>

石阶很长。你数了大概一百二十级，每一级上都刻着不同的符号。越往下走，空气就越凉，越潮湿——在沙漠的正下方，这让人有些恍惚。阳光在身后逐渐收缩成一个小小的光斑，最后完全消失了，只剩下黑暗。

你点燃了随身带着的火折子。火光照出一段石头长廊，宽约三步，高约两丈。墙壁上每隔几步就有一盏空的油灯座，灯座下挂着薄薄的蛛网。地面铺着方形的石砖，有些地方已经凹陷下去，缝隙中渗出一层暗色的水渍。

{{#if hasKnife}}
你拔出短刀，用刀尖在墙壁上敲了敲。声音沉闷——墙很厚，没有空腔。安全。
{{/if}}

你向前走了几十步。长廊尽头出现了第一个分叉——但更引人注意的是，在你前方不远处的地面上，有<span class="danger">几块石砖的颜色和旁边的略微不同</span>。颜色深了一点点——如果不仔细看根本看不出来。

{{#nav "chapter2.mural-hall"}}小心绕开那些地砖{{/nav}}
{{#nav "chapter2.trap-room"}}踩上去——应该没那么玄乎{{/nav}}

### 机关室 {#trap-room}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.enteredTrapRoom = true;
    },
  };
</script>

你踏上了那些石砖——

<span class="danger">咔。咔。咔。</span>

三声清脆的响声，像是有什么东西在你脚下的石砖里转了一下。你还没来得及反应，走廊两边墙壁上忽然弹出了数不清的<span class="danger">箭孔</span>——

<script>
  export default {
    view({ globals }) {
      const inv = globals.inventory || [];
      const health = globals.health || 100;
      return {
        hasRope: inv.includes("麻绳"),
        // health will be updated in onLeave based on escape method
        health,
        hasCompass: inv.includes("星盘"),
      };
    },
    onLeave({ globals }) {
      // Health reduction applied via nav choice instead
    },
  };
</script>

{{#nav "chapter2.trap-dodge"}}扑向地面躲避{{/nav}}
{{#nav "chapter2.trap-run"}}全速跑向长廊尽头{{/nav}}

### 躲避机关 {#trap-dodge}

<script>
  export default {
    onEnter({ globals }) {
      const inv = globals.inventory || [];
      if (inv.includes("麻绳")) {
        globals.health = Math.max(0, (globals.health || 100) - 5);
      } else {
        globals.health = Math.max(0, (globals.health || 100) - 20);
      }
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        hasRope: inv.includes("麻绳"),
        health: globals.health || 0,
        explorerName: globals.explorerName || "探险者",
      };
    },
  };
</script>

你猛地扑倒在地。

箭矢从你头顶呼啸而过——密集得像是暴雨打在芭蕉叶上。你趴在地上，把脸埋在手臂里，感觉气流一次次擦过你的头发。

{{#if hasRope}}
你落地的时候肩上的麻绳散开了，正好挡在了你的后背上。一支箭射偏了，钉在绳圈上，被粗糙的麻线缠住了——没有刺穿。等箭雨停了你爬起来，发现有两支箭嵌在绳索里，箭头离你的皮肤只有一寸。你解下绳子，把箭拔掉。绳子还能用。
{{else}}
一支箭擦过了你的左肩——不算重伤，但热辣辣地疼。血沿着手臂往下流，你撕下一截衣料简单包扎了一下。等你爬起来的时候，地面上插着不下五十支箭——有的箭头已经深深嵌入石砖的缝隙里，有的箭头在石头上磕弯了。你捡起一支看了看——箭头还是锋利的，几千年前锻造的箭，涂了一层防锈的油料，居然还能用。
{{/if}}

你沿着走廊往前走。机关已经触发过一轮了，接下来的几步没有警报。走廊尽头出现了一扇半开的石门。

生命值：{{health}}

{{#nav "chapter2.mural-hall"}}推开石门{{/nav}}

### 冲刺逃脱 {#trap-run}

<script>
  export default {
    onEnter({ globals }) {
      globals.health = Math.max(0, (globals.health || 100) - 30);
    },
    view({ globals }) {
      return {
        health: globals.health || 0,
        explorerName: globals.explorerName || "探险者",
      };
    },
  };
</script>

你拔腿就跑。

箭矢从两边的墙壁上飞出来——你感觉得到气流在你身边掠过，有几支几乎擦着耳根飞过去。你的靴子在旧石砖上踩出急促的回音，在黑暗的走廊里听起来像你自己的心跳被放大了十倍。

你跑到走廊尽头，扑到了一扇半开的石门后，大口喘着粗气。等你确定不会再有任何箭飞出来以后你检查了一下自己——你的腿上擦破了一大片，左臂上也划了一道口子。还好只是皮外伤。

但那几块颜色不同的石砖——它们没有给你思考的时间。

<span class="danger">生命值：{{health}}</span>

你靠在墙上缓了一会儿，然后推开了石门。

{{#nav "chapter2.mural-hall"}}进入下一个房间{{/nav}}

### 壁画厅 {#mural-hall}

<script>
  export default {
    onEnter({ globals }) {
      globals.knowledge = (globals.knowledge || 0) + 1;
      globals.flags.visitedMuralHall = true;
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasKnife: inv.includes("短刀"),
        health: globals.health || 0,
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

石门在你身后沉重地合上了。你举着火折子四下照了一圈——这是一个圆形的大厅，直径约有三十步。穹顶很高，火折子的光照不到顶，只有一层朦朦胧胧的暗影悬在上方。空气很干，有股陈旧的灰尘和石头的气味，但意外地没有腐烂的味道。好像这个房间被封存了几千年只为了等你来打开。

然后你看到了壁画。

壁画覆盖了整整一圈弧形墙壁。颜色保存得出奇地好——深红、赭石、金粉——几千年前的颜料在火光中鲜活得像是昨天才画上去的。画面上有城邦、有河流、有祭坛和星空，描绘了一个完整的文明从兴起到繁荣再到——

到最后一幅。

<span class="whisper">最后一幅壁画上画的是一片沙漠。沙漠的边缘站着一个人——画得很小，几乎是剪影——手里举着一个小小的盒子。那个人头顶上方的天空中画着一只眼睛，眼睛在流泪。泪珠是黑色的。</span>

你走近了一些，举着火折子仔细看。那只流泪的眼睛下面刻着一行古文字。字迹很浅，已经快要被磨平了——但下面刻着的第二个人的手掌轮廓还很清晰：五根手指张开按在字的下方，大小刚好和一个正常人的手掌吻合。手掌的每个指节处都画了一个小小的光点。

你知道这是什么——古籍上记载过。楼陀罗的图书馆里有一种锁叫"密文锁"，需要按画面上的提示在正确的位置按下手指才能打开。刻在画中手掌上的光点就是按钮。

{{#if hasKnife}}
你用短刀的刀背在地面上——你估计画面中的箱子对应的位置——轻轻敲了几下。声音是空的。下面有东西。
{{/if}}

知识 +1（当前：{{knowledge}}）

{{#nav "chapter2.fork"}}继续前行{{/nav}}

### 岔路口 {#fork}

<script>
  export default {
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasRope: inv.includes("麻绳"),
        knowledge: globals.knowledge || 0,
        health: globals.health || 0,
        highKnowledge: (globals.knowledge || 0) >= 2,
      };
    },
    onLeave({ globals }) {
      globals.flags.chapter2Complete = true;
    },
  };
</script>

离开壁画厅之后走廊分成了两条路。

左边那条向下倾斜得更厉害——你能感到热度从下面涌上来，空气里有硫磺和烧焦的味道。石壁上隐约映出橙色的光，像是地下有什么东西在燃烧。远处传来一种低沉的、有节奏的闷响——像是地底有一头巨兽在呼吸。

<span class="danger">生命值：{{health}} | 知识：{{knowledge}}</span>

右边那条似乎是平路。石壁上刻满了更多的古文字和图案，给人一种庄严肃穆的感觉，像是通往某种重要的场所。空气里飘着一股淡淡的檀香味——在这地下几千年的遗迹里出现——让你神经紧绷。

{{#if highKnowledge}}
<span class="clue">你认出右边石壁上的部分古文字中反复出现"祭"、"永生"、"守"三个字。这让你隐约感到——右边的路通向某种仪式场所，左边则是更原始的力量。</span>
{{/if}}

{{#nav "chapter3.left-path"}}走左边——热的、有硫磺味的路{{/nav}}
{{#nav "chapter3.right-path"}}走右边——平缓的、有檀香味的路{{/nav}}

## 第三章：遗迹核心 {#chapter3}

<script>
  export default {
    locals({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
        currentHealth: globals.health || 100,
        currentKnowledge: globals.knowledge || 0,
      };
    },
    onEnter({ globals }) {
      globals.flags.chapter3Entered = true;
    },
  };
</script>

_第三章 · 遗迹核心_

### 左路：熔火深渊 {#left-path}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.choseLeftPath = true;
      globals.knowledge = (globals.knowledge || 0) + 1;
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasWater: inv.includes("水袋"),
        health: globals.health || 0,
        knowledge: globals.knowledge || 0,
      };
    },
    onLeave({ globals }) {
      globals.flags.leftPathComplete = true;
    },
  };
</script>

你沿着向下的通道走了大约半个时辰。空气越来越热，越来越干。你每呼出一口气都能看到隐隐的蒸汽——不是因为你冷，而是因为你呼出的气比周围的空气还要凉。

通道突然豁然开朗。你走进了一个巨大的地下空间——脚下不到二十步远处，是一片<span class="danger">岩浆湖</span>。橙红色的熔岩在岩石的边界里缓慢地翻滚，偶尔冒出一个气泡，炸开时溅出几点亮红色的熔滴。热量从湖面上辐射上来，像是一只无形的手按在你的脸上。头顶的石壁上挂满了钟乳石，有些被热浪烤成了暗红色。

岩浆湖的中心——隔着大约三十步宽的熔岩——矗立着一座石台。石台上放着一个盒子。

不是金子做的，也不是宝石镶嵌的——只是一只看似普通的石盒，暗灰色的，表面粗糙。但你的本能让你觉得——这个东西很重要。它的表面没有任何接缝，看起来像是一整块石头被切成了一个盒子。但是石头不可能被切成一个中空的盒子而不在表面留下任何缝隙——除非它不是普通的石头。

<div class="whisper">石盒静静地坐在石台上，周围翻滚的岩浆像是它忠诚的护卫。</div>

{{#if hasWater}}
你看了看腰间的——出发时老韩给的水袋。还剩大半袋。你倒了一点水在手上蘸了一下往石盒的方向弹了一滴——水滴离开你手掌的一瞬间蒸发了，还没飞出一尺远就化作了看不见的蒸汽。空间里好像有一层看不见的热壁。
{{/if}}

{{#nav "chapter3.guardian"}}想办法过去取石盒{{/nav}}
{{#nav "chapter3.skip-box"}}太危险了，放弃石盒继续前进{{/nav}}

### 放弃石盒 {#skip-box}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.skippedBox = true;
    },
    view({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
        health: globals.health || 0,
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

你盯着那只石盒看了很久。它肯定很重要——但你看着脚边翻滚的岩浆和不远处的石桥，理智告诉你这一步不该走。不是所有的宝物都值得用命去换。

你从左边绕过了岩浆湖，沿着一道狭窄的岩壁小路走向了更深处。石盒留在了身后——它在你的余光里慢慢变成了一个小小的灰点，最后消失在热浪的扭曲中。

生命值：{{health}} | 知识：{{knowledge}}

{{#nav "chapter3.guardian"}}继续深入{{/nav}}

### 右路：祭祀大厅 {#right-path}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.choseRightPath = true;
      globals.knowledge = (globals.knowledge || 0) + 2;
      const inv = globals.inventory || [];
      if (inv.includes("短刀")) {
        if (!inv.includes("赤珠")) {
          inv.push("赤珠");
        }
      }
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      return {
        explorerName: globals.explorerName || "探险者",
        hasKnife: inv.includes("短刀"),
        health: globals.health || 0,
        knowledge: globals.knowledge || 0,
      };
    },
    onLeave({ globals }) {
      globals.flags.rightPathComplete = true;
    },
  };
</script>

右边的通道平缓而笔直。石壁上刻着密密麻麻的古文字——你不认识这些字，但你记得它们在壁画厅里出现过。你一边走一边用手指沿着刻痕滑动，感受千年前的石匠留下的刀痕。

通道尽头是一扇完整的大石门。门上刻着巨大的浮雕——又是一只眼睛，但这只眼睛没有流泪。它睁得很大，眼眶里是空白的，但眼眶的轮廓被刻得很深，好像在等着什么东西被放进去。眼睛下方有个凹槽——大约拳头大小、菱形的、边缘光滑——像是一个钥匙孔。

<span class="clue">你的目光落在那个凹槽上。它不是被凿出来的——边缘太光滑了。更像是被什么东西"熔"出来的，像是曾经有一颗灼热的石头被嵌在门上，后来被取走了。</span>

{{#if hasKnife}}
你用短刀的刀尖试探性地伸进凹槽——刀尖碰到了金属。里面有什么东西，圆形的，很硬。你用刀刃撬了一下——一枚暗红色的珠子顺着凹槽滚了出来，落在你手心里。珠子上有隐约的花纹，温热——不是被你的体温捂热的，而是它本身就是热的。珠子里面似乎有光在流动。
{{else}}
你伸手摸了摸凹槽——手指碰到里面有一个圆形的硬物，但你抠不出来。你的指甲不够长，也没有合适的工具。你试了几次，最后只能放弃。
{{/if}}

{{#nav "chapter3.guardian"}}推开石门{{/nav}}

### 守墓者 {#guardian}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.metGuardian = true;
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      const health = globals.health || 100;
      const knowledge = globals.knowledge || 0;
      const flags = globals.flags || {};
      return {
        explorerName: globals.explorerName || "探险者",
        hasKnife: inv.includes("短刀"),
        hasRope: inv.includes("麻绳"),
        hasWater: inv.includes("水袋"),
        hasCompass: inv.includes("星盘"),
        health,
        knowledge,
        choseRight: !!flags.choseRightPath,
        skippedBox: !!flags.skippedBox,
        highKnowledge: knowledge >= 3,
        wellEquipped: inv.length >= 3,
        hasRedPearl: inv.includes("赤珠"),
      };
    },
  };
</script>

你走进了遗迹最深处的大厅。这是一个巨大的圆形房间——比壁画厅还要大。穹顶高到看不见尽头，只有一片令人心慌的黑暗悬在头顶。房间的正中央，立着一座石像。

不是神像。是一座卫士像——一个真人两倍高的石人，身穿铠甲，双手按在一柄石剑的剑柄上，剑尖抵着地面。石像的面部没有五官，只有一个光滑的平面。但你盯着那个平面看了几秒之后你产生了一个奇怪的感觉——它是在看着你的。

石像的胸口上有一片镂空的区域——拳头大小的菱形，和你之前在石门上看到的那个凹槽一模一样。

{{#if hasRedPearl}}
你的手心发烫。那颗暗红色的珠子似乎在发光——比刚才更亮了，像是在呼应着什么。你低头看了看珠子，又看了看石像胸口的菱形凹槽——它们的大小和形状完全匹配。
{{/if}}

{{#if highKnowledge}}
<span class="clue">你想起在壁画上看到的内容——"守"代表守卫，"永生"代表祭祀把身体献给了守护者。按照你解读的壁画，这个石人守卫需要的不是武力，而是让它明白——你不是来掠夺的。你理解了——守护者不是杀入侵者的，它是守卫"某个承诺"的。</span>
{{/if}}

{{#if choseRight}}
{{#if hasRedPearl}}
你举起赤珠，走向石像。珠子的光芒在你接近石像时变亮了，像是有人在珠子内部点燃了一团火。石像没有动——当赤珠嵌入胸口的凹槽时，整个大厅响起了音乐。不是人的音乐——是石头的音乐：墙壁上的每一个凹槽、每一个刻痕都在共鸣，发出不同音高的嗡鸣声。石像表面出现了细密的裂纹——从胸口开始蔓延，像冰裂一样迅速布满全身。片刻之后，石像坍塌了，化作一堆碎石，露出了身后的通道。
{{else}}
你缓缓伸出手，按在石像胸口的菱形凹槽上。你按的不是一个按钮——你按的是一个手掌的形状：你把五指张开，对应石像暗纹的五个节点按了下去——像壁画上讲的那样。石像沉默了一瞬间。然后它表面的石头开始龟裂——裂缝从你按的五个点开始向外扩散，像是石头在蜕皮。一片片碎石剥落在你脚边粉碎。石像碎成石堆后露出了身后的通道。
{{/if}}
{{else}}
{{#if skippedBox}}
石像没有动。你绕着它走了一圈——它似乎只守在那个位置上，对从侧面绕过的你并没有反应。也许它等待的并不是你——它等待的是那个石盒。而你没有动那个石盒。你从石像身后找到了一个向下的通道。
{{else}}
石像动了。它抬起石剑，剑尖在你面前划过一道弧线停下来——和你之间的距离不到半尺。石剑带起的风把你头发吹了起来。但它没有继续攻击——它停在那里，像是在问你一个问题。石像没有五官，但你感觉得到它在看着你——在等你的回答。你沉默了几秒钟然后你把手按在了石像胸口的凹槽上——你的五指正好对应五个指节的光点。几秒钟后——石像表面出现了裂纹，它缓缓地跪了下来，露出了身后的通道。
{{/if}}
{{/if}}

{{#nav "chapter3.treasure-room"}}走进最后的房间{{/nav}}

### 宝藏室 {#treasure-room}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.reachedTreasureRoom = true;
      globals.flags.chapter3Complete = true;
    },
    view({ globals }) {
      const inv = globals.inventory || [];
      const knowledge = globals.knowledge || 0;
      const health = globals.health || 0;
      const flags = globals.flags || {};
      return {
        explorerName: globals.explorerName || "探险者",
        inventory: inv,
        knowledge,
        health,
        hasKnife: inv.includes("短刀"),
        hasWater: inv.includes("水袋"),
        hasRope: inv.includes("麻绳"),
        hasCompass: inv.includes("星盘"),
        hasRedPearl: inv.includes("赤珠"),
        choseRight: !!flags.choseRightPath,
        skippedBox: !!flags.skippedBox,
        canTrueEnding: knowledge >= 4 && inv.length >= 3,
        canGoodEnding: health >= 50 && knowledge >= 1,
      };
    },
  };
</script>

最后的房间很小。和你一路闯过来的大厅和走廊相比，这更像一间书斋——三面石墙，一张石桌，石桌上放着一卷竹简、一面铜镜、和一个巴掌大的黑色石头盒子。

竹简摊开了。上面的古文字用一种不知名的墨写就——几千年了，墨迹依然湿润。你把竹简拿近火折子——

_"给所有来到此处的人：楼陀罗在等待。它在等你提出一个愿望。一个真正的愿望——不是随口说说的那种，是你愿意穿越沙漠、面对箭雨、触摸岩浆也用不退缩的那种。想好你再开口。石盒会听完你的愿望，然后告诉你答案。石盒从不撒谎——它只会告诉你你的愿望是否可能成真。如果你听到之后依然选择许愿——石盒就会启动。一旦启动，你得到的不只是愿望——你还得承担愿望的代价。没有人能告诉你代价是什么。只有楼陀罗知道。你的愿望和它的代价——两者选一个的时候，你会怎么选？"_

石盒静静地放在桌上。它的表面光滑如镜——摸上去很凉很凉，但你把手移开之后掌心里残留着一种奇异的温热，像是在石头的深处还有一处没有熄灭的火。

你已经走到了楼陀罗的尽头。现在——

{{#each inventory}}
- 背包里有：{{this}}
{{/each}}

生命值：{{health}} | 知识：{{knowledge}}

{{#if canTrueEnding}}
你知识丰富、准备充分。你理解了楼陀罗的文字、破解了守护者的考验、也得到了遗迹中最重要的几样东西。你有资格许愿——也有资格承担愿望的代价。

{{#nav "endings.true"}}许下你的愿望{{/nav}}
{{/if}}

{{#if canGoodEnding}}
你虽然不完全理解楼陀罗的秘密——但你的意志和一路的坚持，让你走到了这里。

{{#nav "endings.good"}}向石盒许下愿望{{/nav}}
{{/if}}

{{#nav "endings.bad"}}许下一个贪婪的愿望{{/nav}}

## 结局 {#endings}

<script>
  export default {
    locals({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
      };
    },
  };
</script>

_结局_

### 真结局：楼陀罗的继承者 {#true}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "true";
    },
    view({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
        choseRight: !!(globals.flags || {}).choseRightPath,
      };
    },
  };
</script>

你把双手放在石盒上。

不是许一个关于财富、权力或永生的愿望——你在壁画厅读到的内容、你在走廊里解开的古文字、你在守护者面前学到的道理——这些都告诉你一件事：楼陀罗的人不是不懂贪婪，他们是克制了贪婪。不是因为道德高尚，而是因为他们见过贪婪把别的东西变成什么样。

<span class="whisper">"我想知道楼陀罗的故事。"你说。</span>

你说的是真心话。

石盒沉默了很长一段时间——长到你以为它坏了，或者它根本就是一个普通的石盒。但就在你要把手移开的时候——铜镜亮了。

镜面上开始出现画面。不是你的倒影——是楼陀罗。几千年前的楼陀罗：绿色河流穿城而过，白色的城墙在阳光下反光，集市上人们在交易；学者们在石板上刻字；祭司在祭坛上对着天空举起双手——

然后画面变了。沙漠开始吞噬河流。城墙开始碎裂。人们开始离开。最后一位祭司把一卷竹简放进石盒，把石盒放在桌上，然后合上了铜镜。铜镜上多了一层灰。

你知道了——整座楼陀罗就是一个人许下的愿望。一个人在几千年前站在你站着的地方对着石盒说："我希望我的城邦永远繁荣。"

石盒——或者说楼陀罗——给了它繁荣：几百年的繁荣，辉煌到无法用语言描述的繁荣。但代价是——繁荣到期之后，楼陀罗会被沙漠吞噬，什么都不剩。上一个许愿的人知道代价，他接受了代价。

你现在也知道了。

{{#if choseRight}}
你把手从石盒上移开。你没有许任何愿——你已经得到了你真正想要的：一个跨越千年的故事。你把竹简小心地卷好、铜镜用布包起来、石盒留在了原处。这是楼陀罗的——你只是它的读者。

你从遗迹的另一头找到了出口，走上了地面。沙漠上空的星星比地面上任何地方的星星都要亮。你怀里揣着那卷竹简——楼陀罗最后的礼物。
{{else}}
你把手从石盒上移开。你没有许愿——你得到了比愿望更有价值的东西：关于楼陀罗的一切。你把竹简卷好、铜镜上那层灰色的薄尘轻轻吹开——镜面映出了你的脸。几千年来，这是第一张被这面镜子映出的人脸。你把它用布包好放进怀里。

你找到了一条新的通道——它通向沙漠的另一头。当你走出遗迹的时候，天已经快要亮了。你怀里揣着楼陀罗的记忆——这是比任何愿望都珍贵的东西。
{{/if}}

<span class="clue">楼陀罗的愿望石盒还在那里——在那个不见阳光的地下深处，等着下一个愿意穿越沙漠的人。但你不是下一个了。你是它等了千年的读者。</span>

{{#nav null}}合上书{{/nav}}

### 好结局：沙海生还 {#good}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "good";
    },
    view({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
        hasWater: (globals.inventory || []).includes("水袋"),
        hasCompass: (globals.inventory || []).includes("星盘"),
        knowledge: globals.knowledge || 0,
      };
    },
  };
</script>

你把手放在石盒上。

你想了一会儿——穿过沙漠、箭雨、岩浆和石像之后——你真正想要的是什么？

你许了一个愿望。不是贪心的愿望——是一个有分寸的愿望。

石盒发出了温热的光——短暂的，柔和的，像一盏油灯被点亮了几秒钟。然后它又暗下去了。

<span class="whisper">愿望被接受了。</span>

你没有留在楼陀罗看结果。你收拾好你的东西——水袋、星盘和你一路上捡到的东西——然后从遗迹的另一头找到了出口。上到地面的时候天还没有亮，沙漠上空的星星很亮。

{{#if hasCompass}}
你拿出星盘，对着北极星——你找到了回家的路。沙漠在你身后慢慢变小，楼陀罗在你身后慢慢沉入沙海中。你知道有一天——也许是几百年后——会有另外一个人找到那里的。希望那个人和你一样，不是为了贪心才去的。
{{else}}
你凭着直觉往北走——那应该是绿洲镇的方向。沙漠的夜空很静，风很小。走了大概两天之后——你隐约看到了绿洲的灯光——一闪一闪的——在那个井边的旧土坯房之间。你活下来了。
{{/if}}

<span class="clue">你的愿望会成真的——但不是现在，也不是以你想象的方式。这世界上有些事情——它们自己知道怎么办。</span>

{{#nav null}}合上书{{/nav}}

### 坏结局：石盒的代价 {#bad}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "bad";
    },
    view({ globals }) {
      return {
        explorerName: globals.explorerName || "探险者",
      };
    },
  };
</script>

你把双手按在石盒上，许下了一个贪婪的愿望。

你许愿的时候手心里全是汗。你说得很急——你太想得到了。

石盒开始发光——强烈的、刺眼的、灼热的光。光越来越亮，越来越亮——亮到你能透过自己的眼皮看到你手心骨头的影子。

然后一切都安静了。

沙漠上的风推着沙子填平了洞口。月亮的清辉洒在沙地上——一片均匀的、没有印记的金色。石柱、石阶、石门上刻的古文字——一切都被埋在下面。你知道的那个入口，现在已经不在地图的任何地方了。

竹简还在原处。铜镜还在原处。石盒还在等——等下一个愿意穿越沙漠、面对箭雨、触碰岩浆的人。石盒从不撒谎——它只会告诉你你的愿望是否可能成真。你忘了检查这一点。你太急着许愿了。

也许——下一个找到楼陀罗的人会更谨慎。

<span class="whisper">或者不是。</span>

{{#nav null}}合上书{{/nav}}
