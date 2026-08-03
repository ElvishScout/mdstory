[English](README.md) | **中文**

# MdStory

基于 Markdown 和 Handlebars 的互动小说脚本格式。

在线演示：<https://mdstory.elvish.cc>

## 安装

```bash
npm install @elvishscout/mdstory
```

如需全局使用 `mdstory` 命令：

```bash
npm install -g @elvishscout/mdstory
```

## 快速开始

MdStory 文件是一个 Markdown 文档。每个文件是一个 Section，标题层级（`#` `##` `###` …）产生嵌套子 Section，支持无限层级：

```markdown
---
title: 岔路口
scope:
  name: 旅人
---

# 岔路口

<script>
export default {
  data() {
    return { gold: 10 };
  },
};
</script>

## 森林 {#forest}

### 密林深处 {#path}

一个陌生人朝你走来。

{{input "string" name="旅人"}}

{{#nav "river.bridge"}}过桥{{/nav}}
{{#nav "forest.path"}}走进森林{{/nav}}

## 河流 {#river}

### 老桥 {#bridge}

木桥在你脚下吱嘎作响，{{name}}。

{{#nav "forest.path"}}往回走{{/nav}}
{{#nav null}}走向光明{{/nav}}
```

保存为 `story.md`，运行：

```bash
mdstory play story.md
```

或构建为独立 HTML 文件：

```bash
mdstory build story.md
```

## CLI

```bash
# 在终端中交互式游玩故事
mdstory play my-story.md

# 可选参数：--debug
mdstory play my-story.md --debug

# 生成独立 HTML 文件并在浏览器中打开
mdstory build my-story.md

# 可选参数：-o <path>、-t <name|path>、-O <key=value>、--no-open、--debug
mdstory build my-story.md -o dist/story.html -t default -O debug=true --no-open

# 以树状图打印故事的章节结构
mdstory overview my-story.md

# 可选参数：--words、--ids、-d <n>
mdstory overview my-story.md --words --ids -d 2

# 将 MdStory 写作 skill 安装到 coding agent
mdstory skills

# 可选参数：-a <name>（指定 agent）、-d <path>（自定义安装目录）、-y（跳过确认）
mdstory skills -a claude
mdstory skills -d ./my-skills
```

## Skills

安装 skill 后，在 coding agent 中使用 `/mdstory-write` 创建互动故事：

```
/mdstory-write 写一个发生在废弃空间站上的悬疑故事。玩家发现船员失踪的线索。包含多层嵌套结构和多个结局。
```

agent 会设计故事结构、逐章编写、执行检查清单，并交付完整可玩的故事。

## 指南

### Section 结构

MdStory 中一切皆是 **Section**——文件本身是根 Section，标题层级产生嵌套：

| 标题    | 层级 | 关系              |
| ------- | ---- | ----------------- |
| 文件    | 根   | 整个文档          |
| `#`     | 1    | 根的子 Section    |
| `##`    | 2    | `#` 的子 Section  |
| `###`   | 3    | `##` 的子 Section |
| `####+` | 4+   | 以此类推          |

**进入**：跳转到深层 Section 时，沿路径从外向内（根 → 中层 → 目标）依次渲染模板。每个 Section 进入时 scope 重置、`data()` 执行、`onEnter()` 执行。祖先模板中的 `{{#nav}}` 可在此拦截跳转。

**离开**：`onLeave` 从内向外（最深层 → 祖先）依次触发，随后引擎从共同祖先向外进入目标。

**同分支内跳转**：已在某分支内部时（如 `a.b.c` → `a.b.d`），共同前缀不重进，只进新的 `a.b.d`。跳转到当前 Section 会先离开再重进（"刷新"当前场景）。

**Frontmatter** — 文件顶部的 YAML 块，设置元数据和根 Section 初始 scope：

```yaml
---
title: 我的故事
scope:
  name: 小明
  flags: {}
---
```

**显式 id**：推荐为 Section 写显式 id，避免改名导致导航失效：

```markdown
## 森林 {#forest}

### 密林深处 {#path}
```

同一个父 Section 下 id 不能重复，不同父 Section 下可以相同。

### 导航

用 `{{#nav target}}标签{{/nav}}` 在 Section 间移动：

```markdown
{{#nav "path"}} 同父下的子节点 {{/nav}}
{{#nav "forest.path"}} 多段路径 {{/nav}}
{{#nav null}} 结束故事 {{/nav}}
```

多段路径（含 `.`）解析时按绝对路径→相对当前→向上查找祖先的顺序匹配。`null` 或 `""` 结束故事。

无 `{{#nav}}` 的 Section 自动按深度优先前进到下一节。选中当前 Section 会先离开再重进（"刷新"）。

### 输入

`input` 不会暂停故事；离开 Section 时所有输入与导航目标一并提交。变量自动写入拥有该 key 的最近 scope 层：

```markdown
{{input "string" name="小明"}}
{{input "number" age=30}}
{{input "boolean" brave=true}}
```

模板中用 `{{name}}` 引用变量。

### Hook

Hook 是从 `<script>` 标签导出的 JavaScript 函数。每次进入 Section 时都会执行，Section 的分层 scope 绑定为函数的 `this`：

| Hook      | 签名                       | 时机                       |
| --------- | -------------------------- | -------------------------- |
| `data`    | `({ scope, env })`         | 每次进入时（scope 先重置） |
| `onEnter` | `({ scope, env })`         | `data()` 返回后            |
| `onLeave` | `({ scope, target, env })` | 离开 Section / 故事结束时  |

`this` 是一个包裹各 scope 层的 Proxy——读取时沿层级向上查找最近的 key；写入时修改拥有该 key 的那一层。`this.flags.x = true`、`this.health = 50` 都能正确持久化。参数中的 `scope` 与 `this` 是同一个对象，为兼容性保留——箭头函数无法接收 `this` 绑定，但可以从参数中解构 `scope`。

`env` 是宿主应用提供的对象（库 API 中来自 `PlayOptions.env`），在一次 play 循环期间被所有 hook 共享。它在每次 play 时由宿主重新提供，**不会**被 save/load 保存——不要用 `env` 保存故事状态，故事状态请放在 scope 变量中。`target` 是导航目标的点分路径，故事结束时为 `null`。

**示例**：

```markdown
## 地下城 {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter() {
    this.flags.entered = true;
  },
};
</script>

### 宝箱 {#chest}

<script>
export default {
  onLeave() {
    this.chestOpened = true;
  },
};
</script>

{{#if chestOpened}}
宝箱是空的。
{{else}}
你找到了 50 枚金币！
{{/if}}
```

## 作用域与变量

MdStory 的变量存储在 **scope** 中。每个 Section 拥有一层 scope，文件根 Section 的 scope 来自 frontmatter；子 Section 的 scope 在每次进入时由 `data()` 初始化。

从根到当前 Section 的 scope 形成层级。读取变量时沿层级向上查找最近的 key；写入时修改拥有该 key 的那一层，若找不到则写入当前 Section 自己的层。

```markdown
## 地下城 {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter() {
    // 写入当前层
    this.entered = true;
    // 向上查找并修改 root scope 中的 flags
    this.flags.dungeon = true;
  },
};
</script>
```

> **注意**：scope 中不要包含名为 `$type` 的 key。MdStory 在存档/读档时内部使用 `$type` 标记特殊类型。

## 自定义 Adapter

MdStory 通过可插拔的 adapter 渲染故事。内置的 `markdownAdapter` 与 `htmlAdapter` 已覆盖 CLI 与默认网页输出；当你使用库 API 时，可以通过 `PlayOptions` 传入自定义 `RenderAdapter`，以改变现有 helper 的渲染方式或新增 Handlebars helper。

```ts
import { fromSource, htmlAdapter, type RenderAdapter, type StoryPrompt } from "@elvishscout/mdstory";

const story = await fromSource(source);

const spoilerAdapter: RenderAdapter = {
  format: "html",
  helpers: {
    ...htmlAdapter.helpers,
    spoiler({ children }) {
      return `<span class="spoiler">${children}</span>`;
    },
  },
};

const prompt: StoryPrompt = async (props) => {
  // 渲染 props.text，收集 FormData，返回 { type: "continue", data }
};

await story.play(prompt, { adapter: spoilerAdapter });
```

每个 helper 都会收到一个 `HelperParam` 对象：

| 属性       | 类型                  | 说明                                                   |
| ---------- | --------------------- | ------------------------------------------------------ |
| `args`     | `any[]`               | 模板传入的位置参数（例如 input 类型）。                |
| `options`  | `Record<string, any>` | 模板传入的命名参数（例如 `name="Alice"`）。            |
| `children` | `string \| undefined` | block helper 的已修剪块内容；inline 时为 `undefined`。 |

在模板中使用自定义 helper 与内置 helper 一样：

```markdown
{{#spoiler}}凶手是管家。{{/spoiler}}
```

## 更多资源

- [Examples](./examples/) — 完整故事示例
- [文档](./docs/) — [写作规范](docs/WRITING_GUIDE.md) 与 [API 参考](docs/api/README.md)
- [在线演示](https://mdstory.elvish.cc)
