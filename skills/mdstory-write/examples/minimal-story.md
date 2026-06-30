---
title: 岔路口
globals:
  name: 旅人
---

# 岔路口

<script>
  export default {
    globals() {
      return { gold: 50 };
    },
  };
</script>

<style>
  .choice { color: #4a90d9; }
</style>

### 十字路口 {#start}

一个陌生人朝你走来。

“你好，我叫 {{input "string" $name="旅人"}}。”

你有 {{gold}} 枚金币。

{{#nav "forest.path"}}走进森林{{/nav}}
{{#nav "river.bridge"}}过桥{{/nav}}

## 森林 {#forest}

<script>
  export default {
    locals({ globals }) {
      return { hasGold: globals.gold >= 30 };
    },
  };
</script>

### 密林深处 {#path}

你在古树间穿行，{{name}}。

森林低语着你的名字。

{{#if hasGold}}
你听到树洞里有动静。
{{/if}}

{{#nav "start"}}原路返回{{/nav}}
{{#nav null}}在此长眠{{/nav}}

## 河流 {#river}

### 老桥 {#bridge}

木桥在你脚下吱嘎作响，{{name}}。

对岸有一点光亮。

{{#nav "start"}}往回走{{/nav}}
{{#nav null}}走向光明{{/nav}}
