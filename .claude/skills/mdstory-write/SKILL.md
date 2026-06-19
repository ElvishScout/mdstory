---
name: mdstory-write
description: Write interactive fiction using the MdStory format — Markdown + Handlebars with branching narratives, variables, and script hooks. Covers story structure, chapters, scenes, navigation, inputs, variables, hooks, includes, and best practices with reference to examples.
---

# MdStory 写作技能

MdStory 是基于 Markdown 和 Handlebars 的互动小说脚本格式。本技能指导你使用 MdStory 格式创作互动故事（写在 `.md` 文件中）。

开始写作前先阅读本 skill 目录下的参考示例（`examples/`）以理解格式。

## 快速参考

一次对话中的工作流：
1. **明确故事设定** — 主题、风格、分支结构复杂度
2. **设计故事结构** — 章节划分、关键分支点、结局数量
3. **编写主入口文件** — 包含 metadata、story 级 hooks、`!include` 引入各章节
4. **编写章节和场景** — 每个场景是 `###` 标题下的一个可渲染单元
5. **测试与调整** — 检查 nav 链接是否正确、变量是否贯通

## 核心概念

### 文档结构

```
┌─ metadata (YAML frontmatter)
│   title, globals 静态初始值, assets
│
├─ # 故事标题 (可选)
│   ├─ <style> CSS 样式
│   └─ <script> story 级 hooks
│       globals(), onStart()
│
├─ ## 章节 — 场景的分组单位
│   ├─ <script> chapter 级 hooks
│   │   locals(), onEnter(), onLeave()
│   └─
│       ├─ ### 场景 — 可渲染单元
│       │   ├─ <script> scene 级 hooks
│       │   │   view(), onEnter(), onLeave()
│       │   └─ Handlebars 模板内容
│       │
│       └─ ### 场景 ...
│
└─ ## 章节 ...
```

## 层级规则

| 层级 | 标题 | 作用 |
|------|------|------|
| `#` | 故事标题 | 可选。章节/场景之前的 `<script>` 输出故事级钩子 |
| `##` | 章节 | 将场景分组。可拥有自己的钩子和 `locals` |
| `###` | 场景 | 可渲染单元，包含 Handlebars 模板 |

- 没有 `#` 标题时，故事标题使用 metadata 中的 `title`；都没有则为空。
- 任何 `##` 之前的 `###` 自动归入隐式默认章节。

## 分步写作指南

### 第 1 步：创建主文件

创建 `story.md`，包含 YAML frontmatter 和入口结构：

```markdown
---
title: 我的故事
globals:
  name: 旅人
  inventory: []
  flags: {}
---

# 我的故事

<script>
  export default {
    globals() {
      return {
        inventory: [],
        flags: {},
      };
    },
  };
</script>

!include("./chapter1.md")
!include("./chapter2.md")
!include("./endings.md")
```

- frontmatter 放**静态**初始值，`globals()` 放**需要运行时计算**的初始值
- 多章节时用 `!include()` 拆分文件

### 第 2 步：编写章节和场景

每个章节是一个 `##` 标题文件：

```markdown
## 第一章：入学 {#chapter1}

<script>
  export default {
    locals({ globals }) {
      return {
        hasKey: Boolean(globals.keys?.includes("door_key")),
        dayCount: 1,
      };
    },
    onEnter({ globals }) {
      globals.flags = globals.flags || {};
      globals.flags.chapter1Started = true;
    },
  };
</script>

### 校门口 {#gate}

清晨的阳光洒在校门口。

　　“早上好，新同学，你叫什么名字？”一个戴袖章的学生干部迎上来。

　　“我叫 {{input "string" $name="旅人"}}。”你答道。

{{#nav "chapter1.classroom"}}走进教室{{/nav}}
{{#nav "chapter1.courtyard"}}先去庭院看看{{/nav}}

### 教室 {#classroom}

你走进教室，找到一个靠窗的位置坐下。

你的名字是 {{name}}。

{{#nav "chapter1.teacher"}}等待上课{{/nav}}
```

#### 章节 id 规范

- 为章节和场景写显式 id：`{#chapter1}`、`{#gate}`
- id 使用英文短横线命名（如 `first-meeting`），保持稳定
- 标题文字可以调整，id 不应改变

#### 导航规则

```markdown
{{#nav "scene"}}          ← 当前章节内的场景（优先当前章节查找）
{{#nav "chapter.scene"}}  ← 指定章节内的指定场景（推荐跨章使用）
{{#nav "chapter"}}        ← 指定章节的入口场景
{{#nav null}}             ← 结束故事
```

- 同章跳转只写场景 id，跨章跳转写完整的 `chapter.scene`
- 长篇故事不依赖"全局同名场景查找"

### 第 3 步：设计分支与结局

用条件渲染和多个导航选项创建分支：

```markdown
### 岔路口 {#crossroads}

你面前有两条路。

{{#nav "forest.path"}}走进森林{{/nav}}
{{#nav "river.bridge"}}过桥{{/nav}}
```

设计多结局时，在 `view()` 中计算条件，控制结局场景的可见性：

```markdown
<script>
  export default {
    view({ globals }) {
      return {
        canTrueEnding: globals.inventory?.includes("钥匙") && globals.flags?.foundLetter,
        canGoodEnding: (globals.affection || 0) >= 3,
      };
    },
  };
</script>

{{#if canTrueEnding}}
{{#nav "ending-true"}}前往真结局{{/nav}}
{{/if}}

{{#if canGoodEnding}}
{{#nav "ending-good"}}前往好结局{{/nav}}
{{/if}}

{{#nav "ending-bad"}}就这样结束{{/nav}}
```

### 第 4 步：管理故事状态

#### 三种变量作用域

| 作用域 | 定义方式 | 生命周期 | 用途 |
|--------|----------|----------|------|
| `globals` | frontmatter + `globals()` | 整个故事持久 | 读者输入、跨章状态、背包、结局条件 |
| `locals` | `locals({ globals })` | 每次进入章节重置 | 章节内派生值、临时开关 |
| `view` | `view({ globals, locals })` | 每次场景渲染 | 格式化显示值，不写回状态 |

#### 变量命名

- 同一篇故事中保持一致（全中文或全英文）
- 使用具体名称而非泛词（`chestOpened` 而非 `flag`）
- 避免混用 `hasKey`、`有钥匙`、`key` 表示同一变量

### 第 5 步：使用输入让读者互动

> **input 不阻塞故事。** 它渲染为表单控件但不会暂停剧情推进。当前场景的所有文字和 input 会同时展示给读者，读者填写完毕后必须点击某个 `{{#nav}}` 提交并进入下一场景。
>
> 因此 **不要** 在同场景的 input 之后写对输入值做出反应的叙述或对话——读者还没提交，变量尚未写入作用域。应该在 **下一场景** 通过 `view()` 读取已提交的值再使用。

正确用法——input 嵌入叙述，输入值留到下一场景使用：

```markdown
### 问名字 {#ask}

“你叫什么名字？”

{{input "string" $heroName="无名"}}

{{#nav "scene.greet"}}继续{{/nav}}

### {#greet}

<script>
  export default {
    view({ globals }) {
      return { heroName: globals.heroName || "勇士" };
    },
  };
</script>

“欢迎你，{{heroName}}。”
```

错误用法——在同一场景内对未提交的值做反应：

```markdown
<!-- 错误：input 还没提交，heroName 尚未写入 -->
{{input "string" $heroName="无名"}}
“你好，{{heroName}}。”  <!-- heroName 此时为空 -->
```

参数说明：

| 写法 | 写入位置 | 示例 |
|------|----------|------|
| `{{input "string" name="旅人"}}` | `locals.name` | 文本框 |
| `{{input "number" age=18}}` | `locals.age` | 数字框 |
| `{{input "boolean" brave=false}}` | `locals.brave` | 复选框 |
| `{{input "string" $name="旅人"}}` | `globals.name` | 全局文本框（`$` 前缀 → 写入 globals，前缀被去掉） |

提交顺序：填写 input → 点击 nav → 写入变量 → 当前场景 `onLeave()` →（如切换章节）当前章节 `onLeave()`

### 第 6 步：使用 Hooks 管理状态和副作用

| 层级 | Hook | 时机 | 推荐用途 |
|------|------|------|----------|
| Story | `globals()` | `play()` 开始时 | 返回动态初始全局变量 |
| Story | `onStart({ globals })` | 故事开始时 | 修正全局状态、记录启动事件 |
| Chapter | `locals({ globals })` | 每次进入章节时 | 返回章节局部变量 |
| Chapter | `onEnter({ globals, locals })` | 每次进入章节时 | 修改状态、记录进入 |
| Chapter | `onLeave({ globals, locals, target })` | 离开章节或故事结束时 | 结算状态 |
| Scene | `onEnter({ globals, locals })` | 每次进入场景时 | 发放物品、记录访问 |
| Scene | `view({ globals, locals })` | 场景渲染前 | 返回本次渲染的临时值 |
| Scene | `onLeave({ globals, locals, target })` | 读者离开场景后 | 根据状态更新全局 |

#### 最佳实践

- **初始值**：静态放 frontmatter，动态放 `globals()`
- **副作用**：状态修改放在 `onEnter()` / `onLeave()`，不放在 `view()` 或 `locals()`
- **`view()` 不承担状态写入职责**：只计算展示值，不修改 globals/locals
- **`locals()` 只返回数据**：需要副作用时用 `onEnter()`
- **每个作用域最多一个 `<script>`**：多个 hook 写在同一个 `export default` 对象里

#### 示例：完整的场景 hooks

```markdown
### 宝箱 {#chest}

<script>
  export default {
    view({ globals }) {
      const opened = Boolean(globals.chestOpened);
      return {
        alreadyOpened: opened,
        coins: opened ? 0 : 50,
      };
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

所有 hook 支持同步和 `async`。

## 进阶功能

### 资源与多媒体

YAML metadata 中定义资源，模板中引用：

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

```markdown
![]({asset "map"})
{{asset "bgm"}}   → 输出 URL
{{mime "bgm"}}    → 输出 "audio/mpeg"
```

### Include（文件拆分）

```markdown
!include("./chapter1.md")
!include("/stories/common.md")
!include("https://example.com/shared.md")
```

- 相对路径基于"写出这条 `!include` 的文件"来解析
- 被 include 的文件里的 `!include` 相对于该文件自身位置

### 条件渲染（Handlebars）

```markdown
{{#if hasKey}}
你打开了门。
{{else}}
门锁着。
{{/if}}
```

### 图片

```markdown
![]({asset "map"})
```

### 样式

```html
<style>
  .clue { color: #ffd700; }
</style>
```

### 空行

```markdown
{{linebreak}}     ← 一个空行
{{linebreak 3}}   ← 三个空行
```

## 推荐模板

```markdown
---
title: 示例故事
globals:
  name: 旅人
---

# 示例故事

<script>
  export default {
    globals() {
      return { gold: 10 };
    },
    onStart({ globals }) {
      globals.started = true;
    },
  };
</script>

## 第一章 {#chapter1}

<script>
  export default {
    locals({ globals }) {
      return { rich: globals.gold >= 10 };
    },
    onEnter({ globals }) {
      globals.lastChapter = "chapter1";
    },
  };
</script>

### 开始 {#start}

<script>
  export default {
    view({ globals, locals }) {
      return { greeting: locals.rich ? "你看起来很从容。" : "你需要更多资源。" };
    },
    onLeave({ globals, target }) {
      globals.lastTarget = target;
    },
  };
</script>

你好，{{name}}。{{greeting}}

{{#nav null}}结束{{/nav}}
```

## 参考示例

skill 目录下包含可直接阅读的参考示例：

| 文件 | 说明 |
|------|------|
| `examples/minimal-story.md` | 单文件完整故事，含 frontmatter、`#`/`##`/`###` 结构、`input`、`#nav`、`#if` 条件、chapter 级 `locals()` |
| `examples/multi-ending.md` | 多结局故事，展示背包系统、好感度条件判断、`view()` 控制结局可见性 |
| `examples/multi-file/` | 多文件拆分结构，展示 `story.md` + `!include` + 分章节文件 |

## 常见反模式

| 反模式 | 正确做法 |
|--------|----------|
| 在 `view()` 中修改 `globals` | 移到 `onEnter()` 或 `onLeave()` |
| 在 input 同场景内立即使用其变量 | 写到下一场景，通过 `view()` 读取已提交的值 |
| 把所有变量都放进 `globals` | 章节内用 `locals()`，场景渲染用 `view()` |
| 一个作用域写多个 `<script>` | 所有 hook 写在同一个 `export default` 中 |
| 依赖标题文字作为 id | 显式写 `{#id}` |
| 重复使用含义不同的变量名 | 使用具体名称如 `chestOpened`、`loopCount` |
