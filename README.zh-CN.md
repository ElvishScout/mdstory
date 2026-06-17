[English](README.md) | **中文** | [写作规范](WRITING_GUIDE.zh-CN.md)

# MdStory

基于 Markdown 和 Handlebars 的互动小说脚本格式。

在线演示：<https://mdstory.elvish.cc>

## 快速开始

MdStory 文件是一个 Markdown 文档，使用三级标题结构：

```markdown
---
title: 我的故事
globals:
  name: 小明
---

# 我的故事

<script>
  export default {
    globals() {
      return { 金币: 100 };
    },
  };
</script>

## 第一章 {#chap1}

### 黑暗森林 {#forest}

你在一个黑暗的森林中醒来。你的名字是 {{name}}，你有 {{金币}} 枚金币。

{{input "string" 武器="木棍"}}

{{#nav "chap2.cave"}}向前走{{/nav}}
```

### 文档结构

| 层级 | 标题 | 作用 |
|------|------|------|
| `#` | 故事标题 | 全文唯一。`<script>` 输出故事级钩子。 |
| `##` | 章节 | 将场景分组。可拥有自己的钩子和 `locals`。 |
| `###` | 场景 | 可渲染单元，包含 Handlebars 模板。 |

任何 `##` 之前的 `###` 会自动归入一个隐式默认章节。

### 导航

用 `{{#nav target}}标签{{/nav}}` 让读者在不同场景间移动：

```markdown
{{#nav "forest"}}     回到森林（同一章节）        {{/nav}}
{{#nav "chap2.cave"}} 进入洞穴（跨章节）          {{/nav}}
{{#nav "chap2"}}      前往第二章                  {{/nav}}
{{#nav null}}         故事结束                    {{/nav}}
```

### 输入

让读者提供值，这些值会作为全局变量持久化。`input` 不会在出现的位置暂停故事；读者离开当前场景时，场景里的所有输入会和选择的导航目标一并提交。

```markdown
{{input "string"  名字="小明"}}   ← 文本输入，默认"小明"
{{input "number"  年龄=30}}       ← 数字输入
{{input "boolean" 勇敢=true}}     ← 复选框
```

在故事中任意位置使用这些值：

```markdown
你的名字是 {{名字}}，今年 {{年龄}} 岁。
{{#if 勇敢}}你感到充满勇气。{{/if}}
```

### 逻辑与变量

用 `{{#if}}` 实现分支：

```markdown
{{#if 有钥匙}}
你打开了门。
{{else}}
门锁着。
{{/if}}
```

全局变量（globals）在整个故事中持久存在。章节局部变量（`locals`）在每次进入章节时重置并重新计算。场景 `view()` 提供当前场景本次渲染使用的临时值。

### 图片与资源

引用 YAML 元数据中定义的资源：

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

```markdown
![]({asset "map"})
{{asset "bgm"}}  → 输出 URL
{{mime "bgm"}}   → 输出 "audio/mpeg"
```

### 样式表

在故事标题下用 `<style>` 标签引入 CSS：

```html
<style>
  .clue { color: #ffd700; }
</style>
```

### 钩子

钩子是在特定时机执行的 JavaScript 函数，从 `<script>` 标签中导出。
每个 story、chapter 或 scene 作用域最多只能包含一个 `<script>` 标签。

| 层级 | 位置 | 钩子 | 作用 |
|------|------|------|------|
| Story | `#` 下 | `globals()` | 返回初始全局变量 |
| | | `onStart({ globals })` | 故事开始时的副作用 |
| Chapter | `##` 下 | `locals({ globals })` | 返回章节局部变量 |
| | | `onEnter({ globals, locals })` | 进入章节时的副作用 |
| | | `onLeave({ globals, locals, updates, target })` | 离开章节时的副作用，包括故事结束 |
| Scene | `###` 下 | `view({ globals, locals })` | 返回场景本次渲染使用的临时值 |
| | | `onEnter({ globals, locals })` | 进入场景时的副作用 |
| | | `onLeave({ globals, locals, updates, target })` | 离开场景时的副作用 |

有返回值的钩子支持同步和 `async`。`globals()` 不接收参数。`view()` 接收当前运行时作用域，但返回值只用于当前这次渲染。

### 空行

```markdown
{{linebreak}}     ← 一个空行
{{linebreak 3}}   ← 三个空行
```

### 分支场景示例

```markdown
### 十字路口 {#crossroads}

眼前出现了岔路。你选择哪条？

{{#nav "chap1.forest"}}🌲 走进森林{{/nav}}
{{#nav "chap1.mountain"}}⛰️ 爬上山顶{{/nav}}
```

## 示例

完整故事见 [examples/](./examples/)。

### 带章节变量和分支的场景

```markdown
## 地下城 {#dungeon}

<script>
  let attempts = 0;
  export default {
    locals() {
      attempts++;
      return { 第几次: attempts };
    },
  };
</script>

### 第一间房 {#room}

你进入了地下城。这是你第 {{第几次}} 次尝试。

{{input "boolean" 准备好了=false}}

{{#if 准备好了}}
前方出现了岔路。
{{#nav "dungeon.left"}}向左走{{/nav}}
{{#nav "dungeon.right"}}向右走{{/nav}}
{{else}}
你还没准备好。
{{#nav "dungeon.room"}}深呼吸{{/nav}}
{{/if}}
```

### 带 View 钩子的场景

```markdown
### 宝箱 {#chest}

<script>
  export default {
    view({ globals }) {
      const opened = globals.已开过 || false;
      return {
        已空: opened,
        金币数: opened ? 0 : 50,
      };
    },
    onLeave({ globals }) {
      globals.已开过 = true;
    },
  };
</script>

{{#if 已空}}
宝箱是空的。
{{else}}
你找到了 {{金币数}} 枚金币！
{{/if}}
```

### 跨章节导航

```markdown
### 出口 {#escape}

{{#nav "dungeon.room"}}返回地下城{{/nav}}
{{#nav "overworld.village"}}逃往村庄{{/nav}}
{{#nav null}}放弃{{/nav}}
```

### 完整小故事

```markdown
---
title: 岔路口
---

# 岔路口

### 十字路口 {#start}

一个陌生人朝你走来。

{{input "string" name="旅人"}}

{{#nav "forest.path"}}走进森林{{/nav}}
{{#nav "river.bridge"}}过桥{{/nav}}

## 森林 {#forest}

### 密林深处 {#path}

你在古树间穿行，{{旅人}}。

森林低语着你的名字。

{{#nav "start"}}原路返回{{/nav}}
{{#nav null}}在此长眠{{/nav}}

## 河流 {#river}

### 老桥 {#bridge}

木桥在你脚下吱嘎作响，{{旅人}}。

对岸有一点光亮。

{{#nav "start"}}往回走{{/nav}}
{{#nav null}}走向光明{{/nav}}
```

- `simple.md` — 基础分支
- `rickroll.md` — 单场景循环动画
- `abyss.md` — 科幻心理惊悚，多分支
- `time-loop.md` — 侦探时间循环，多章节多场景

## CLI

在终端中运行故事：

```bash
npm run cli examples/simple.md
npm run cli examples/time-loop.md -- --debug   # 显示每场景的 globals/locals
```
