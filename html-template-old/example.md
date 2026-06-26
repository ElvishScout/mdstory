---
title: 勇者与龙
globals:
  flags: {}
  inventory: []
  reputation: 0
---

# 勇者与龙

<script>
  export default {
    globals() {
      return { inventory: [], flags: {}, reputation: 0 };
    },
  };
</script>

## 王城 {#castle}

### 国王召见 {#throne}

国王端坐在王座上，面容憔悴。

“魔龙抓走了公主。我需要一位勇士。”

他看向你。

“告诉我，勇者——你叫什么名字？”

{{input "string" $heroName="无名"}}

{{#nav "castle.decision"}}上前一步{{/nav}}

### {#decision}

<script>
  export default {
    view({ globals }) {
      return { heroName: globals.heroName || "勇士" };
    },
  };
</script>

“很好，{{heroName}}。”国王点了点头，“你愿意去救公主吗？”

{{#nav "castle.armory"}}接受任务{{/nav}}
{{#nav "castle.refuse"}}拒绝，转身离开{{/nav}}

### 拒绝 {#refuse}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.refusedQuest = true;
      globals.reputation = (globals.reputation || 0) - 1;
    },
  };
</script>

“也罢。”国王失望地低下头。

你走出王宫。但一路上，人们议论纷纷——那个临阵脱逃的勇士。

{{#nav "castle.changed-mind"}}你后悔了{{/nav}}

### 后悔 {#changed-mind}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.refusedQuest = false;
      globals.reputation = (globals.reputation || 0) + 1;
    },
  };
</script>

你回到王宫。“我想通了。我去。”

国王露出了微笑。

{{#nav "castle.armory"}}去武器库{{/nav}}

### 武器库 {#armory}

<script>
  export default {
    onEnter({ globals }) {
      if (!globals.inventory.includes("铁剑")) {
        globals.inventory.push("铁剑");
      }
    },
  };
</script>

你在武器库中挑选装备。

“带这把铁剑去吧。”铁匠说，“虽然不是神兵利器，但山路上的山贼不好对付。”

获得物品：**铁剑**

{{#nav "castle.tavern"}}出发前去酒馆坐坐{{/nav}}
{{#nav "mountain.pass"}}直接出发{{/nav}}

### 酒馆 {#tavern}

<script>
  export default {
    onEnter({ globals }) {
      globals.reputation = (globals.reputation || 0) + 1;
    },
  };
</script>

“听说你要去救公主？”酒馆老板擦着杯子，“有胆量。这壶酒算我请的。”

消息传开后，镇民们对你刮目相看。

声望 +1

{{#nav "mountain.pass"}}出发{{/nav}}

## 龙山山脉 {#mountain}

### 山隘 {#pass}

<script>
  export default {
    view({ globals }) {
      return {
        hasSword: globals.inventory?.includes("铁剑"),
        rep: globals.reputation || 0,
        hasRep: (globals.reputation || 0) >= 1,
      };
    },
  };
</script>

山路陡峭。你在云雾中穿行了一整天。

{{#if hasSword}}
铁剑在腰间沉甸甸的，给你安全感。
{{else}}
你赤手空拳，每一步都提心吊胆。
{{/if}}

{{#if hasRep}}
山路上遇到一队商人。“你就是那个勇者？”他们给了你干粮和水。
{{else}}
山路上空无一人。你饿着肚子走了两天。
{{/if}}

{{#nav "mountain.hermit"}}前方有个山洞{{/nav}}

### 隐士 {#hermit}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.metHermit = true;
    },
  };
</script>

山洞里住着一位隐士。

“年轻人，你要去屠龙？”他打量着你。

{{#nav "mountain.hermit-help"}}请求指点{{/nav}}
{{#nav "mountain.hermit-leave"}}婉拒，继续上路{{/nav}}

### 隐士的指点 {#hermit-help}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.hermitAdvice = true;
      globals.reputation = (globals.reputation || 0) + 1;
      if (!globals.inventory.includes("龙鳞草")) {
        globals.inventory.push("龙鳞草");
      }
    },
  };
</script>

“龙焰炽热，但龙的眼睛是唯一的弱点。”隐士给了你一株草药，“这是龙鳞草，涂抹在武器上可以暂时刺穿龙鳞。”

获得物品：**龙鳞草**

{{#nav "mountain.summit"}}前往山顶{{/nav}}

### 婉拒隐士 {#hermit-leave}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.hermitAdvice = false;
    },
  };
</script>

“也罢。”隐士退回洞中。

你独自走向山顶。

{{#nav "mountain.summit"}}前往山顶{{/nav}}

### 龙穴入口 {#summit}

<script>
  export default {
    view({ globals }) {
      return {
        hasSword: globals.inventory?.includes("铁剑"),
        hasHerb: globals.inventory?.includes("龙鳞草"),
        hasRep: (globals.reputation || 0) >= 3,
        canTrueEnding: globals.inventory?.includes("铁剑") && globals.inventory?.includes("龙鳞草"),
        canGoodEnding: (globals.reputation || 0) >= 2,
      };
    },
  };
</script>

龙穴就在前方。洞中传来低沉的呼吸声，每一次呼吸都带着硫磺的热风。

{{#if canTrueEnding}}
你左手握剑，剑刃上涂着龙鳞草；右手握拳，心中充满勇气。
{{#nav "ending.true"}}用涂了草药的剑刺向龙眼{{/nav}}
{{/if}}

{{#if canGoodEnding}}
你虽然没有万全准备，但一路积攒的声望让你信心十足。
{{#nav "ending.good"}}凭着意志和声望说服村民一同作战{{/nav}}
{{/if}}

{{#nav "ending.bad"}}不管了，直接冲进去{{/nav}}

## 结局 {#ending}

### 真结局：龙骑士 {#true}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "true";
    },
    view({ globals }) {
      return { heroName: globals.heroName || "勇者" };
    },
  };
</script>

你冲入龙穴。巨龙张开嘴，烈焰扑面而来——但你更快。

涂了龙鳞草的剑刃刺穿了巨龙的眼睑，直入大脑。巨龙轰然倒地。

公主从角落中走出，安然无恙。

“谢谢你，{{heroName}}。”

后来，人们叫你“龙骑士”。不是因为你杀了龙——而是因为你理解了龙的弱点，也理解了自己的力量。

{{#nav null}}故事结束{{/nav}}

### 好结局：团结之力 {#good}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "good";
    },
    view({ globals }) {
      return { heroName: globals.heroName || "勇者" };
    },
  };
</script>

你站在龙穴前，深吸一口气，然后举起了你手中的火把。

身后，山脚下的村民们举着火把回应。他们——你一路上帮助过的人、和你说过话的人、听说过你故事的人——全部来了。

巨龙被火光和人声惊动，最终选择飞走。

公主得救了。

“你不只是一个人。”公主说，“这就是你比龙更强大的原因。”

{{#nav null}}故事结束{{/nav}}

### 坏结局：烈焰 {#bad}

<script>
  export default {
    onEnter({ globals }) {
      globals.flags.ending = "bad";
    },
  };
</script>

你冲了进去。

龙焰将你吞没。

{{#nav null}}故事结束{{/nav}}
