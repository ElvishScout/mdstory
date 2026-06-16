---
title: "时间循环侦探"
author: MdStory
globals:
  探员代号: "侦探"
  已收集线索: "[]"
assets:
  badge: "https://img.icons8.com/fluency/48/police-badge.png"
  report: { url: "https://example.com/report.pdf", mime: "application/pdf", alt: "案件报告" }
---

# {{探员代号}}的时间循环

<script>
  export default {
    globals() {
      return { 时间循环次数: 0 };
    },
    onStart({ globals }) {
      globals.已收集线索 = "[]";
    },
  };
</script>

<style>
  .clue { color: #ffd700; }
  .loop { text-shadow: 0 0 10px #00ffff; }
</style>

### 探员报到 {#intro}

==新西敏市警局，2067年。==

你推开警局大门，阳光透过旋转门折射出刺眼的光芒。你的工牌上写着编号。

{{{input "number" 编号=42}}}

{{{input "string" 探员代号="侦探"}}}

你深吸一口气，走进这个熟悉的早晨。

等等——为什么你心里会浮现"熟悉"这个词？今天是你调任==重案组==的第一天。

"新来的？" 一个低沉的声音从身后传来。你转身，看到一位白发警官上下打量着你。


{{#nav "case.arrival"}}跟上他{{/nav}}

## 案件 {#case}

### 到达现场 {#arrival}

<script>
  export default {
    data({ globals }) {
      globals.时间循环次数 = (globals.时间循环次数 || 0) + 1;
    },
  };
</script>

{{{linebreak 2}}}

**第 {{时间循环次数}} 次抵达现场。**

{{{linebreak}}}

白发警官带你穿过走廊，来到一间审讯室。墙上贴满了照片和文件，中央的桌子上放着一份敞开的档案。

"我是==马库斯探长==。"他递给你一杯咖啡。"这是你的第一个案子。昨晚，格兰特大厦的顶层公寓发生了一起命案。死者是==阿尔德里奇工业==的CEO，==维克多·阿尔德里奇==。"

他盯着你的眼睛。

"你看起来不像第一次来。你以前处理过==凶杀案==吗？"

{{{input "boolean" 有经验=false}}}

{{#nav "arrival_cont"}}继续{{/nav}}

### {#arrival_cont}

<script>
  export default {
    data({ globals }) {
      const clues = JSON.parse(globals.已收集线索 || "[]");
      return {
        已有法医: clues.includes("法医"),
        已有证人: clues.includes("证人"),
        已有异常: clues.includes("异常"),
      };
    },
  };
</script>

{{#if 有经验}}
"很好。"马库斯点点头。"那我们就直接开始。"
{{else}}
"别担心。"他拍拍你的肩膀。"谁都有第一次。"
{{/if}}

{{linebreak}}

{{#if 已有法医}}✅ 法医报告已完成{{linebreak}}{{/if}}
{{#if 已有证人}}✅ 证人笔录已完成{{linebreak}}{{/if}}
{{#if 已有异常}}✅ 异常记录已完成{{linebreak}}{{/if}}

{{#nav "case.forensic"}}🔍 法医报告（物证）{{/nav}}
{{#nav "case.witness"}}👤 证人笔录（人证）{{/nav}}
{{#nav "case.anomaly"}}🌀 异常记录（疑点）{{/nav}}

### 法医报告 {#forensic}

<script>
  export default {
    data({ globals }) {
      const clues = JSON.parse(globals.已收集线索 || "[]");
      if (!clues.includes("法医")) {
        clues.push("法医");
      }
      globals.已收集线索 = JSON.stringify(clues);
      return { 新线索: clues.length };
    },
  };
</script>

你翻开法医报告。纸张边缘微微泛黄，像是被翻阅过很多次。

==死亡时间：== 昨晚 22:47 ± 3 分钟。
==死因：== 钝器击打后脑，导致颅内出血。
==凶器推测：== 一座重约 2.3kg 的青铜雕像——在壁炉架上发现，已被清理过指纹。

你注意到报告中有一处用红笔圈出的异常：

==「死者右手紧握一张纸条，上面用血写着一个数字：{{时间循环次数}}。」==

你的心跳漏了一拍。这个数字——就是你此刻正在想的数字。

这是巧合吗？


✦ 你获得了 [{{新线索}}/3] 条线索。

{{#nav "case.arrival"}}🔙 返回审讯室{{/nav}}
{{#nav "loop.reset"}}🌀 时间开始扭曲……{{/nav}}

### 证人笔录 {#witness}

<script>
  export default {
    data({ globals }) {
      const clues = JSON.parse(globals.已收集线索 || "[]");
      if (!clues.includes("证人")) {
        clues.push("证人");
      }
      globals.已收集线索 = JSON.stringify(clues);
      return { 新线索: clues.length };
    },
  };
</script>

马库斯递给你一份笔录。==昨夜值班的保安，陈国栋（男，58岁，任职12年）的证词：==

==「我什么都没听到。什么都没看到。那层楼的监控在晚上8点就'恰好'坏了。你问我有没有可疑的人？有——每天都有人进出那栋楼。」

「但有一件事很奇怪。」== 他犹豫了一下。 ==「昨晚11点左右，我听到顶楼传来一声——不是尖叫，更像是一阵——笑声。很短，很轻。然后一切归于寂静。」==

你合上笔录。命案现场的笑声？


✦ 你获得了 [{{新线索}}/3] 条线索。

{{#nav "case.arrival"}}🔙 返回审讯室{{/nav}}
{{#nav "loop.reset"}}🌀 时间开始扭曲……{{/nav}}

### 异常记录 {#anomaly}

<script>
  export default {
    data({ globals }) {
      const clues = JSON.parse(globals.已收集线索 || "[]");
      if (!clues.includes("异常")) {
        clues.push("异常");
      }
      globals.已收集线索 = JSON.stringify(clues);
      return { 新线索: clues.length };
    },
  };
</script>

在档案袋的最底层，你发现了一份被标注为==「绝密——仅限局长查阅」==的文件。文件封面没有标题，只有一行手写的编号：

==「ECHO-9 / 时间异常事件 / 第 {{时间循环次数}} 次记录」==

你翻开文件，里面只有一页纸，上面印着：

==时间循环备忘录==

1. 当时间循环被触发，所有参与者的记忆将被保留在潜意识层，表现为既视感。
2. 循环的触发条件未知，但每次循环的持续时间约为2小时。
3. 打破循环的唯一方法：在循环中找到"锚点"。
4. 锚点的定义：一个在每次循环中恒定不变的事实。

==文件的底部用铅笔写着几个字，字迹很新：==

==「别相信马库斯。」==

你的手微微颤抖。


✦ 你获得了 [{{新线索}}/3] 条线索。

{{#nav "case.arrival"}}🔙 返回审讯室{{/nav}}
{{#nav "loop.reset"}}🌀 时间开始扭曲……{{/nav}}

## 时间循环 {#loop}

<script>
  let 觉醒次数 = 0;

  export default {
    locals({ globals }) {
      觉醒次数++;
      const clues = JSON.parse(globals.已收集线索 || "[]");
      return {
        觉醒次数,
        已有法医: clues.includes("法医"),
        已有证人: clues.includes("证人"),
        已有异常: clues.includes("异常"),
      };
    },
    onLeave({ globals, locals, updates, target }) {
      globals.时间循环次数 = (globals.时间循环次数 || 0) + 1;
    },
  };
</script>

### 重置 {#reset}

==嗡——==

一阵低沉的轰鸣声从四面八方涌来。你的视野开始扭曲——墙壁上的照片在飞旋，天花板和地板交换了位置。

然后——

你站在警局门口。阳光透过旋转门折射出刺眼的光芒。你的手还握着咖啡杯——但咖啡是满的，温热的。

==你又回到了起点。==

✦✦✦ 第 {{时间循环次数}} 次循环 ✦✦✦

你的潜意识深处有 {{觉醒次数}} 个记忆碎片在闪烁。

{{#if 已有法医}}
✅ 你记得：死者手中纸条上的数字是 {{时间循环次数}}。
{{/if}}
{{#if 已有证人}}
✅ 你记得：保安听到了笑声。
{{/if}}
{{#if 已有异常}}
✅ 你记得：文件上写着"别相信马库斯"。
{{/if}}

你需要收集足够的线索，才能打破这个循环。每次循环你只能调查一个方向。

{{#nav "case.forensic"}}🔍 再次查看法医报告{{/nav}}
{{#nav "case.witness"}}👤 再次询问证人{{/nav}}
{{#nav "case.anomaly"}}🌀 再次研究异常记录{{/nav}}
{{#nav "endgame.truth"}}⚡ 直面真相{{/nav}}

## 终局 {#endgame}

<script>
  export default {
    locals({ globals }) {
      const clues = JSON.parse(globals.已收集线索 || "[]");
      const count = clues.length;
      return {
        证据数: count,
        足够定罪: count >= 3,
      };
    },
  };
</script>

### 真相 {#truth}

{{#if 足够定罪}}

三组证据在你脑海中形成了一个完整的圆。你终于明白了。

==凶手不是别人。== 每次你问"谁杀了维克多·阿尔德里奇"，你都在问错问题。真正的问题是—— =="谁创造了这个时间循环？"==

{{#if 已有法医}}
纸条上的数字——那根本不是死者的留言。那是循环计数器。这个时间锚点在提醒你：你在这个循环里已经困了很久了。
{{/if}}

{{#if 已有证人}}
保安听到的笑声——那不是凶手的笑声。那是你的笑声——或者说另一个版本的你的笑声。在这个循环的某个版本里，你曾经来过这里。
{{/if}}

{{#if 已有异常}}
"别相信马库斯。" 你终于明白了那句话的意思。警局里的每一个人——马库斯、保安——他们都在这个循环里。但他们不记得。你才是唯一一个在积累记忆的人。你是这个循环的锚点。
{{/if}}

你睁开眼睛，走向审讯室的镜子。你看着镜中的自己——

在镜面的另一边，另一个你正微笑着。

==「你终于到了这一步。」== 镜中的你说。==「现在，选择你的结局。」==

{{#nav "endgame.awakening"}}✨ 接受真相，打破循环{{/nav}}
{{#nav "endgame.abyss"}}🌀 留在循环中，继续探索{{/nav}}

{{else}}

证据不足。你只有 {{证据数}}/3 条线索。

地板开始震动。时间又要重置了。

{{#nav "loop.reset"}}🌀 再试一次{{/nav}}

{{/if}}

### 觉醒 {#awakening}

你伸出手，触碰镜面。

镜面泛起涟漪，像水面一样扩散开来。整个世界在你的指尖下碎裂成无数碎片——然后，一切静止了。

你站在格兰特大厦的楼顶。清晨的阳光刚刚越过地平线，把整座城市染成金色。风吹过你的头发。一切都很安静。

一个人站在天台边缘。是==维克多·阿尔德里奇==——他还活着。

他看着你，微笑着说：

==「第 {{时间循环次数}} 次了。你终于成功了。」==

他告诉你真相：==阿尔德里奇工业==在你身上进行了一项秘密实验——时间感知增强。他们已经成功让你的意识在时间线中跳跃。今天的经历不是偶然，而是你的潜意识在觉醒。

"你不是被困在循环里。"他说。 ==「你是在学会飞翔。」==

远处传来警笛声——那是这个循环结束的声音。但这一次，你知道该怎么做。

你闭上眼睛。然后你展开了意识。

✦✦✦ 真结局——意识觉醒 ✦✦✦

{{{linebreak 2}}}

✦ 特性验证清单：
- ✔ YAML 元数据（title、author、globals、assets）
- ✔ 故事钩子（globals、onStart）
- ✔ 章节钩子（locals、onEnter、onLeave）
- ✔ 场景钩子（data）
- ✔ 高亮标记（==text==）
- ✔ CSS 样式表（style）
- ✔ 资源引用（asset、mime）
- ✔ 跨章节导航（chapter.scene）
- ✔ 默认章节（h3 before h2）
- ✔ Handlebars 标题渲染
- ✔ 故事循环与多结局
- ✔ 探员编号 #{{编号}}
- ✔ 探员代号：{{探员代号}}
- ✔ 资源 URL：{{asset "badge"}}
- ✔ 资源 MIME：{{mime "report"}}

感谢游玩。

{{#nav null}}结束故事{{/nav}}

### 深渊 {#abyss}

你后退了一步。

不。你还没有准备好。

镜中的你露出了理解的微笑。

==「没关系。我们下次再见。」==

世界开始扭曲。你又回到了警局门口。

但这一次，你在口袋里发现了一张纸条。纸条上是你的笔迹：

==「线索已经够了。下次，相信自己。」==

✦✦✦ 待续结局 ✦✦✦

{{#nav "intro"}}🔁 重新开始{{/nav}}
