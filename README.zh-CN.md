[English](README.md) | **中文** | [写作规范](WRITING_GUIDE.zh-CN.md)

# MdStory

基于 Markdown 和 Handlebars 的互动小说脚本格式。

在线演示：<https://mdstory.elvish.cc>

## 安装

```bash
npm install @elvishscout/mdstory
```

或直接运行：

```bash
npx mdstory play my-story.md
```

## 快速开始

MdStory 文件是一个 Markdown 文档，使用三级标题结构——`#` 故事、`##` 章节、`###` 场景：

```markdown
---
title: 岔路口
---

# 岔路口

### 十字路口 {#start}

一个陌生人朝你走来。

{{input "string" $name="旅人"}}

{{#nav "forest.path"}}走进森林{{/nav}}
{{#nav "river.bridge"}}过桥{{/nav}}

## 森林 {#forest}

### 密林深处 {#path}

你在古树间穿行，{{name}}。

森林低语着你的名字。

{{#nav "start"}}原路返回{{/nav}}
{{#nav null}}在此长眠{{/nav}}

## 河流 {#river}

### 老桥 {#bridge}

木桥在你脚下吱嘎作响，{{name}}。

对岸有一点光亮。

{{#nav "start"}}往回走{{/nav}}
{{#nav null}}走向光明{{/nav}}
```

保存为 `story.md`，运行：

```bash
npx mdstory play story.md
```

## 指南

### 故事结构

| 层级  | 标题     | 作用                                    |
| ----- | -------- | --------------------------------------- |
| `#`   | 故事标题 | 可选。放置故事级 `<script>` 钩子。      |
| `##`  | 章节     | 将场景分组。拥有自己的钩子和 `locals`。 |
| `###` | 场景     | 可渲染单元，包含 Handlebars 模板。      |

**Frontmatter** — 文件顶部的 YAML 块，设置静态元数据和初始全局变量：

```yaml
---
title: 我的故事
globals:
  name: 小明
---
```

如果没有 `#` 标题，故事标题取自 metadata 的 `title`；若都未设置则为空。任何 `##` 之前的 `###` 归入隐式默认章节。

**故事模板和章节模板** — `#` 到第一个 `##`/`###` 之间的内容在故事开始时渲染一次。`##` 到第一个 `###` 之间的内容在进入该章节时渲染一次：

```markdown
# 地下城

_你翻开一本落满灰尘的古书……_

## 第一章 {#ch1}

_空气随着你深入而愈发寒冷。_

### 入口 {#entrance}

你站在一扇巨大的铁门前。
```

### 导航

用 `{{#nav target}}标签{{/nav}}` 在场景间移动：

```markdown
{{#nav "forest"}} 回到森林{{/nav}} ← 同一章节
{{#nav "chap2.cave"}} 进入洞穴{{/nav}} ← 跨章节
{{#nav "chap2"}} 前往第二章{{/nav}} ← 章节入口场景
{{#nav null}} 故事结束{{/nav}} ← 结束故事
```

### 输入与变量

`input` 不会在出现的位置暂停故事；读者离开场景时，场景内的所有输入与导航目标一并提交。

输入默认写入章节 `locals`。变量名前加 `$` 写入 `globals`：

```markdown
{{input "string"  name="小明"}} ← 局部文本输入
{{input "number"  age=30}} ← 局部数字输入
{{input "boolean" brave=true}} ← 局部复选框
{{input "string"  $name="小明"}} ← 全局文本输入
```

在模板中用 `{{name}}` 引用变量。

### 条件与分支

用 `{{#if}}` 实现分支：

```markdown
{{#if hasKey}}
你打开了门。
{{else}}
门锁着。
{{/if}}
```

- **Globals** — 整个故事周期持久。通过 frontmatter、`$` 前缀 input、或钩子副作用设置。
- **Locals** — 每次进入章节时重置。通过 `locals()` 返回。
- **View 值** — 每次渲染场景时计算。通过 `view()` 返回，只读。

### 钩子

钩子是从 `<script>` 标签导出的 JavaScript 函数。每个作用域支持多个 `<script>`——同名钩子后者覆盖前者。

| 作用域  | 钩子      | 签名                            | 用途                 |
| ------- | --------- | ------------------------------- | -------------------- |
| Story   | `globals` | `()`                            | 返回初始全局变量     |
| Story   | `onStart` | `({ globals })`                 | 故事开始时的副作用   |
| Chapter | `locals`  | `({ globals })`                 | 返回章节局部变量     |
| Chapter | `onEnter` | `({ globals, locals })`         | 进入章节时的副作用   |
| Chapter | `onLeave` | `({ globals, locals, target })` | 离开章节时的副作用   |
| Scene   | `view`    | `({ globals, locals })`         | 返回本次渲染的临时值 |
| Scene   | `onEnter` | `({ globals, locals })`         | 进入场景时的副作用   |
| Scene   | `onLeave` | `({ globals, locals, target })` | 离开场景时的副作用   |

有返回值的钩子支持同步和 `async`。`globals()` 不接收参数。`view()` 的返回值仅用于当前渲染。

**示例** — 章节 locals 计数器：

```markdown
## 地下城 {#dungeon}

<script>
  let attempts = 0;
  export default {
    locals() {
      attempts++;
      return { attempt: attempts };
    },
  };
</script>

### 第一间房 {#room}

这是你第 {{attempt}} 次尝试。
```

**示例** — 场景 view 钩子条件显示：

```markdown
### 宝箱 {#chest}

<script>
  export default {
    view({ globals }) {
      const opened = globals.chestOpened || false;
      return { alreadyOpened: opened, coins: opened ? 0 : 50 };
    },
    onLeave({ globals }) {
      globals.chestOpened = true;
    },
  };
</script>

{{#if alreadyOpened}}
宝箱是空的。
{{else}}
你找到了 {{coins}} 枚金币！
{{/if}}
```

### 资源与样式

引用 YAML 元数据中定义的资源：

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

```markdown
![]({asset "map"})
{{asset "bgm"}} → 输出 URL
{{mime "bgm"}} → 输出 "audio/mpeg"
```

在故事标题下用 `<style>` 标签引入 CSS：

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

### 文件引入

用 `!include("target")` 在解析前插入另一段 Markdown 源码：

```markdown
!include("./chapter-1.md")
!include("/stories/common.md")
!include("https://example.com/shared.md")
```

引入路径相对于包含它的文件解析。需要自定义加载行为时，向 `fromPath()`、`fromSource()` 或 `parseStorySource()` 传入 `base` 或 `resolveInclude`。

### 空行

```markdown
{{linebreak}} ← 一个空行
{{linebreak 3}} ← 三个空行
```

在终端和 HTML 输出中均产生 `<br>` 换行。

## CLI

```bash
# 在终端中交互式游玩故事
npx mdstory play my-story.md

# 带调试输出游玩
npx mdstory play my-story.md --debug

# 生成独立 HTML 文件并在浏览器中打开
npx mdstory build my-story.md

# 构建到指定输出路径
npx mdstory build my-story.md -o dist/story.html

# 构建但不自动打开浏览器
npx mdstory build my-story.md --no-open

# 构建并在浏览器控制台输出调试信息
npx mdstory build my-story.md --debug

# 将 MdStory 写作技能安装到编码智能体
npx mdstory skills
```

## 更多资源

- [Examples](./examples/) — 完整故事示例
- [写作规范](WRITING_GUIDE.zh-CN.md) — 深入写作参考
- [在线演示](https://mdstory.elvish.cc)
