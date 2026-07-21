# MdStory 写作指南

本文面向 MdStory 作者，说明如何组织一篇 `.md` 故事、如何管理状态与导航，以及常见陷阱。

## 1. 核心概念

一篇 MdStory 就是一个 Markdown 文件。三种核心概念共同驱动故事：

- **Section**：故事的结构单元。文件本身是根 Section，`#` / `##` / `###` 等标题按层级产生嵌套子 Section。每个 Section 包含一段**模板**（标题到下一同级/子级标题之间的 Markdown 内容），用于渲染场景。
- **scope**：变量存储空间。每个 Section 有一层 scope，多层 scope 按路径级联，形成读取与写入规则。
- **hook**：每个 Section 的 `<script>` 标签中导出的 JavaScript 函数，用于初始化状态、触发副作用。

推荐把故事拆成清晰的层级：

```markdown
# 第一章

## 森林 {#forest}

### 入口 {#entrance}

场景文本……
```

## 2. 文档结构

### 2.1 Frontmatter

文件顶部的 YAML 块设置元数据和根 Section 的初始 scope：

```yaml
---
title: 我的故事
scope:
  name: 旅人
  flags: {}
---
```

- `title`：故事标题。
- `scope`：根 Section 的初始变量，适合放全局状态。
- `assets`：声明图片、音频等资源，模板中通过 `{key.url}` 引用。

### 2.2 Section 层级

| 标题    | 层级 | 关系              |
| ------- | ---- | ----------------- |
| 文件    | 根   | 整个文档          |
| `#`     | 1    | 根的子 Section    |
| `##`    | 2    | `#` 的子 Section  |
| `###`   | 3    | `##` 的子 Section |
| `####+` | 4+   | 以此类推          |

**推荐为每个 Section 显式写 id**，例如 `{#forest}`。标题文字可能修改，id 应保持稳定，否则导航会失效。同一个父 Section 下 id 不能重复，不同父 Section 下可以相同。

Section 标题到第一个子标题之间的内容就是该 Section 的**模板**。

## 3. 作用域与状态

### 3.1 scope 的层级

每个 Section 拥有一层 scope。从根到当前 Section 的 scope 形成一条链：

```
root scope → chapter scope → section scope
```

读取 `scope.key` 时，从当前 Section 向上查找，返回第一个存在的值。

写入 `scope.key = value` 时，同样向上查找；如果某层已经拥有这个 key，就修改那一层；如果没有，则写入当前 Section 自己的层。

```js
// root scope 已有 flags: {}
scope.flags.started = true; // 修改 root scope
scope.localCount = 1; // 写入当前 Section 的 scope
```

### 3.2 scope 的写入规则

| 操作                           | key 已存在于祖先       | key 不存在 |
| ------------------------------ | ---------------------- | ---------- |
| `scope.key = value`            | 修改祖先层             | 写入当前层 |
| `{{input}}` 提交 `key`         | 修改祖先层             | 写入当前层 |
| `data()` 返回 `{ key: value }` | 写入当前层（覆盖祖先） | 写入当前层 |

注意 `data()` 的行为与直接写 `scope` 不同：`data()` 的返回值永远 merge 到**当前 Section 的 scope**，即使祖先已经定义了同名 key。

### 3.3 三个 hook 的分工

每个 Section 的 `<script>` 可以导出三种 hook：

| Hook      | 触发时机                          | 用途                         |
| --------- | --------------------------------- | ---------------------------- |
| `data`    | 每次进入 Section 时，scope 重置后 | 初始化该 Section 的变量      |
| `onEnter` | `data()` 执行完毕后               | 进入场景时的副作用、状态更新 |
| `onLeave` | 离开 Section 或故事结束时         | 结算状态、根据目标做分支     |

每次进入 Section 时，该 Section 的 scope 会被清空，然后重新执行 `data()` → `onEnter()`。离开后再回到同一个 Section，之前的局部状态不会保留。需要跨多次进入持久化的状态，应放在祖先 Section 或根 scope 中。

```markdown
## 地下城 {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter({ scope }) {
    scope.flags.entered = true;  // 修改 root scope 中的 flags
  },
  onLeave({ scope, target }) {
    if (target === "dungeon.exit") {
      scope.flags.cleared = true;
    }
  },
};
</script>
```

## 4. 导航

### 4.1 显式导航

使用 `{{#nav target}}标签{{/nav}}`：

```markdown
{{#nav "path"}}同父下的子节点{{/nav}}
{{#nav "forest.path"}}多段路径{{/nav}}
{{#nav null}}结束故事{{/nav}}
```

多段路径解析顺序：

1. 从根开始的绝对路径。
2. 相对于当前 Section 的路径。
3. 沿祖先向上查找。

推荐跨分支跳转写完整路径，结束故事写 `null` 或 `""`。

### 4.2 隐式导航

- **无 nav 自动前进**：如果 Section 模板中没有可点击的 `{{#nav}}`，引擎自动按深度优先序前进到下一个 Section；最后一个 Section 结束后故事结束。
- **重入当前 Section**：如果导航目标解析后等于当前 Section，引擎会先 `onLeave` 退到父 Section，再重新进入当前 Section。这相当于"刷新"当前场景，scope 会重置。

### 4.3 跳转时的生命周期

**同分支跳转**（`a.b.c` → `a.b.d`）：共同前缀 `a`、`a.b` 不重复进入，只进入新的 `a.b.d`。

**跨分支跳转**（`a.b.c` → `x.y.z`）：

1. 离开原路径：从内向外触发 `onLeave`（`a.b.c` → `a.b` → `a`）。
2. 进入新路径：从外向内触发 `onEnter`（`x` → `x.y` → `x.y.z`）。

## 5. 输入

`{{input}}` 声明读者输入字段。离开 Section 时，所有输入与选中的 `{{#nav}}` 一并提交。

```markdown
{{input "string" name="旅人"}}
{{input "number" age=18}}
{{input "boolean" brave=false}}
```

输入值写入规则与 `scope.key = value` 相同：找到拥有该 key 的最近 scope 层并修改；找不到则写入当前层。

提交顺序：

1. 读者填写所有 `input`。
2. 读者选择一个 `nav`。
3. 运行时把输入写入对应 scope 层。
4. 当前 Section 的 `onLeave` 执行。
5. 沿路径向上，祖先 Section 的 `onLeave` 依次执行。

因此 `onLeave()` 中可以直接读取最新输入。

## 6. 模板语法

MdStory 使用 Handlebars 作为模板引擎。

### 6.1 变量插值

```markdown
你好，{{name}}。你当前有 {{gold}} 枚金币。
```

三花括号输出原始 HTML，仅在需要渲染 HTML 标签时使用。注意读者输入的内容可能存在 XSS 风险。

```markdown
{{{richDescription}}}
```

### 6.2 条件与循环

```markdown
{{#if hasKey}}
门开了。
{{else if hasLockpick}}
你撬开了锁。
{{else}}
门紧锁着。
{{/if}}

背包里有：
{{#each inventory}}

- {{this}}
  {{/each}}
```

### 6.3 MdStory 内置助手

| 助手                          | 用途          |
| ----------------------------- | ------------- |
| `{{#nav target}}标签{{/nav}}` | 导航链接      |
| `{{input type name=default}}` | 读者输入字段  |
| `{{linebreak N}}`             | 插入 N 个空行 |

## 7. Include

用 `!include("target")` 把其他 Markdown 文件插入到当前位置：

```markdown
!include("./chapters/intro.md")
!include("/shared/prologue.md")
!include("https://example.com/stories/ending.md")
```

被 include 文件里的 `!include` 相对于被 include 文件所在位置解析，不是最外层主文件。

## 8. 资源与样式

### 8.1 资源

在 frontmatter 中声明：

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

模板中引用：

```markdown
![]({map.url})
{{bgm.url}}
```

字符串形式定义时，MIME 类型根据文件扩展名自动检测。

### 8.2 样式

`<style>` 标签归属于所在 Section，作用于其模板范围：

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

## 9. 常见反模式

### 9.1 依赖标题文字作为 id

如果不显式写 `{#id}`，标题文字会被用作 id。标题一改，导航就可能失效。应始终显式写 id。

### 9.2 变量命名不一致

同一篇故事中避免混用 `hasKey`、`有钥匙`、`key` 表示同一件事。变量名应稳定且含义明确。

### 9.3 在 `data()` 里做副作用

`data()` 只应初始化变量。读取输入、修改祖先状态、触发副作用应放在 `onEnter()` 或 `onLeave()` 中。

### 9.4 把需要持久化的状态放在子 Section

子 Section 每次进入都会重置 scope。需要跨多次进入保留的状态应放在祖先 Section 或根 scope 中。

## 10. 推荐模板

```markdown
---
title: 示例故事
scope:
  name: 旅人
---

# 示例故事

<script>
export default {
  data() {
    return { gold: 10 };
  },
  onEnter({ scope }) {
    scope.flags = { started: true };
  },
};
</script>

## 第一章 {#chapter1}

<script>
export default {
  data() {
    return { difficulty: 1 };
  },
  onEnter({ scope }) {
    scope.flags.lastChapter = "chapter1";
  },
};
</script>

### 开始 {#start}

<script>
export default {
  data({ scope }) {
    return {
      greeting: scope.gold >= 10 ? "你看起来很从容。" : "你需要更多资源。",
    };
  },
  onLeave({ scope, target }) {
    scope.flags.lastTarget = target;
  },
};
</script>

你好，{{name}}。{{greeting}}

{{#nav null}}结束{{/nav}}
```
