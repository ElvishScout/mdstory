[English](README.md) | **中文** | [写作规范](WRITING_GUIDE.zh-CN.md)

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
  scope() {
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

# 带调试输出游玩
mdstory play my-story.md --debug

# 生成独立 HTML 文件并在浏览器中打开
mdstory build my-story.md

# 构建到指定输出路径
mdstory build my-story.md -o dist/story.html

# 构建但不自动打开浏览器
mdstory build my-story.md --no-open

# 构建并在浏览器控制台输出调试信息
mdstory build my-story.md --debug

# 使用指定模板构建（从 templates/ 目录查找）
mdstory build my-story.md --template default

# 使用自定义模板文件构建
mdstory build my-story.md --template ./my-theme/dist/index.html

# 传递模板选项（可重复，支持点号分隔的嵌套键）
mdstory build my-story.md -O debug=true -O theme.color=dark

# 将 MdStory 写作 skill 安装到 coding agent
mdstory skills

# 安装到指定 agent（非交互模式）
mdstory skills --agent claude
mdstory skills --agent claude --agent codex

# 安装到自定义目录
mdstory skills --dir ./my-skills

# 跳过确认提示
mdstory skills --agent claude --yes
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

**首次进入**：从外部跳转到深层 Section 时，沿路径未进入过的祖先从外向内（根 → 中层 → 目标）依次渲染模板。祖先模板中的 `{{#nav}}` 可在此拦截跳转。

**离开**：`onLeave` 从内向外（最深层 → 祖先）依次触发。

**同分支内跳转**：已在某分支内部时（如 `a.b.c` → `a.b.d`），共同前缀不重进，只进新的 `a.b.d`。

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

多段路径（含 `.`）解析时按绝对路径→相对当前→向上查找祖先的顺序匹配。

### 输入与变量

`input` 不会暂停故事；离开 Section 时所有输入与导航目标一并提交。变量自动写入拥有该 key 的最近 scope 层：

```markdown
{{input "string" name="小明"}}
{{input "number" age=30}}
{{input "boolean" brave=true}}
```

模板中用 `{{name}}` 引用变量。

### 钩子

钩子是从 `<script>` 标签导出的 JavaScript 函数。所有 Section 共享同一套钩子：

| Hook      | 签名                  | 用途                     |
| --------- | --------------------- | ------------------------ |
| `scope`   | `({ scope })`         | 返回当前 Section 的变量  |
| `onEnter` | `({ scope })`         | 进入时的副作用           |
| `onLeave` | `({ scope, target })` | 离开时的副作用           |
| `view`    | `({ scope })`         | 返回当次渲染的临时覆盖值 |

`scope` 参数是一个 Proxy——读取时沿层级向上查找最近的 key；写入时修改拥有该 key 的那一层。`scope.flags.x = true`、`scope.health = 50` 都能正确持久化。

**示例**：

```markdown
## 地下城 {#dungeon}

<script>
export default {
  scope() {
    return { difficulty: 3 };
  },
  onEnter({ scope }) {
    scope.flags.entered = true;
  },
};
</script>

### 宝箱 {#chest}

<script>
export default {
  view({ scope }) {
    const opened = scope.chestOpened || false;
    return { alreadyOpened: opened, coins: opened ? 0 : 50 };
  },
  onLeave({ scope }) {
    scope.chestOpened = true;
  },
};
</script>

{{#if alreadyOpened}}
宝箱是空的。
{{else}}
你找到了 {{coins}} 枚金币！
{{/if}}
```

### 样式

`<style>` 标签归属于所在 Section：

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

### 文件引入

```markdown
!include("./chapter-1.md")
!include("https://example.com/shared.md")
```

引入路径相对于包含它的文件解析。

### 空行

```markdown
{{linebreak}}
{{linebreak 3}}
```

## 更多资源

- [Examples](./examples/) — 完整故事示例
- [写作规范](WRITING_GUIDE.zh-CN.md) — 深入写作参考
- [在线演示](https://mdstory.elvish.cc)
