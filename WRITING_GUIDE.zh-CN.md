# MdStory 写作规范与 Hooks Best Practice

本文面向 MdStory 作者，说明一篇 `.md` 故事应如何组织，以及什么时候使用 `data()` 和生命周期 hooks。

## 基本原则

MdStory 文件是一篇 Markdown 文档。Section 是故事的基本单元——文件本身是根 Section，标题层级（`#` `##` `###` …）产生嵌套子 Section。

推荐遵守三条规则：

- 用标题表达层级结构。
- 用 Handlebars 表达渲染逻辑：`{{name}}`、`{{#if flag}}...{{/if}}`。
- 用 hooks 管理状态：变量初始化放在 `data()`，副作用放在 `onEnter()` / `onLeave()`。

## 文档结构

```markdown
---
title: 我的故事
scope:
  name: 旅人
  flags: {}
---

# 我的故事

## 第一章 {#chapter1}

### 开始 {#start}

你好，{{name}}。
```

每个文件是一个 Section，标题产生嵌套——`#` 是根的直接子节点，`##` 是 `#` 的子节点，以此类推。

推荐为 Section 显式写 id，例如 `{#start}`。标题文字可能会调整，id 应保持稳定，方便导航引用。同一个父 Section 下 id 不能重复；不同父 Section 下可以相同。

Section 标题到第一个子标题之间的内容是它的**模板**。

**进入**：跳转到某个深层子 Section 时，沿路径从外向内（根 → 中层 → 目标）依次渲染模板。每个 Section 进入时 scope 重置、`data()` 执行、`onEnter()` 执行。祖先模板中的 `{{#nav}}` 可以在此拦截跳转，将导航改到完全不同的位置。

**同分支内跳转**：如果当前已在某个分支内部（如 `a.b.c` → `a.b.d`），共同前缀 `a` 和 `a.b` 不会重复进入——只进入新的 `a.b.d`。离开的 Section 从内向外触发 `onLeave`。若跳转到父 Section（如 `a.b.c` → `a.b`），会依次离开 `c` 和 `b`，然后重新进入 `b`（scope 重置 + `data()` + `onEnter()`）。

**跨分支跳转**：从 `a.b.c` 跳到 `x.y.z` 时，离开路径从内向外（`a.b.c` → `a.b` → `a`）依次 `onLeave`，新路径从外向内（`x` → `x.y` → `x.y.z`）依次 `onEnter`。注意 `a` 会触发 `onLeave`。这也是"离开当前分支"的唯一方式。

## 模板语法

使用 Handlebars 语法与故事状态交互。

### 变量插值

```markdown
你的名字是 {{name}}，当前金币 {{gold}}。
```

三花括号输出原始 HTML，仅在需要渲染 HTML 标签时使用。注意：变量值来自读者输入时可能存在 XSS 风险。

```markdown
{{{richDescription}}}
```

### 条件渲染

```markdown
{{#if hasKey}}
你打开了门。
{{else if hasLockpick}}
你用工具撬开了门。
{{else}}
门锁着。
{{/if}}
```

### 列表渲染

```markdown
你的背包里有：
{{#each inventory}}

- {{this}}
  {{/each}}
```

### 内置助手

| 助手                 | 用途         |
| -------------------- | ------------ |
| `{{#nav target}}`    | 导航链接     |
| `{{input type ...}}` | 读者输入字段 |
| `{{linebreak N}}`    | 插入空行     |

## Include 规范

用 `!include("target")` 把其他 Markdown 文件插入到当前位置，再作为一个完整故事解析：

```markdown
!include("./chapters/intro.md")
!include("/shared/prologue.md")
!include("https://example.com/stories/ending.md")
```

被 include 文件里的 `!include` 相对于被 include 的文件所在位置解析，不是最外层主文件。

## 导航规范

使用 `{{#nav target}}标签{{/nav}}` 连接 Section：

```markdown
{{#nav "path"}} 同父 Section 下的子节点 {{/nav}}
{{#nav "forest.path"}} 多段路径 {{/nav}}
{{#nav null}} 结束故事 {{/nav}}
```

多段路径（含 `.`）解析顺序：从根的绝对路径 → 相对于当前 Section → 沿祖先向上查找。

推荐：

- 跨分支跳转写完整路径。
- 结束故事写 `null`。

### 隐式导航规则

以下行为由引擎自动处理，不依赖模板中的 `{{#nav}}`：

**无 nav 的自动前进**：如果 Section 模板中没有 `{{#nav}}`（或没有任何可点击的导航），引擎自动沿深度优先序前进到下一个 Section。如果是最后一个 Section，则故事结束。这使纯展示型 Section 可以"直通"而不需要手动写导航。

**重入当前 Section**：如果导航目标解析后等于当前所在 Section（例如显式写了 `{{#nav}}` 指向自己），引擎会先执行 `onLeave` 退回到父 Section，再重新进入当前 Section（scope 重置 → `data()` → `onEnter()`）。这是一种"刷新当前场景"的语义。

**故事结束**：在模板中写 `{{#nav null}}` 结束故事。引擎从当前 Section 向外逐级触发 `onLeave`，最后触发 root 的 `onLeave`。`onLeave` 的 `target` 参数为 `null` 时表示故事结束。

## Script 规范

每个 Section 允许写多个 `<script>` 标签。多个脚本的 hook 导出会被合并，同名 hook 后面的覆盖前面的。

```markdown
### 宝箱 {#chest}

<script>
export default {
  data({ scope }) {
    return { opened: false };
  },
  onLeave({ scope }) {
    scope.chestOpened = true;
  },
};
</script>
```

## Hook 速查

每个 Section 的 `<script>` 可以导出以下三种 hook：

| Hook      | 时机                      | 推荐用途                |
| --------- | ------------------------- | ----------------------- |
| `data`    | 每次进入 Section 时       | 初始化该 Section 的变量 |
| `onEnter` | `data()` 执行完毕后       | 修改状态、副作用        |
| `onLeave` | 离开 Section 或故事结束时 | 结算状态、根据目标更新  |

> **每次进入都会重置**：Section 的 scope 在每次进入时会被清空，然后重新执行 `data()` → `onEnter()`。这意味着离开后再回到同一个 Section，之前的局部状态不会保留。需要跨进入持久化的状态应写在祖先 Section 的 scope 里。

`scope` 参数是一个 Proxy——读取时沿层级向上查找最近的 key；写入时修改拥有该 key 的那一层。

- `scope.flags.x = true` → 找到 root scope 里的 `flags`，写回，持久化 ✓
- `scope.health = 50` → 找到最近一层有 `health` 的 scope，写回，持久化 ✓

因此不再需要区分"全局变量"和"局部变量"——变量在哪一层定义，修改就在哪一层生效。

root Section 例外：其 scope 来自 frontmatter 且永不清空，适合存放全局状态。

所有 hook 都可以是同步或 `async` 函数。

### Scope 层级规则

每个 Section 拥有自己的一层 scope，从根到叶逐层级联。子 Section 可以覆盖祖先的同名变量（shadowing）。

**读取**（`scope.key`）：从当前 Section 往根方向查找，返回第一个存在的值。

**写入**（`scope.key = value`）：从当前 Section 往根方向查找 key——找到了就写入那一层，找不到就写入当前 Section 自己的层。

**`data()` 的返回值**：始终 merge 到**当前 Section** 的 scope 层，不会影响祖先。这意味着即使祖先已定义同名 key，返回值也会在当前层覆盖它。

**`{{input}}` 提交**：规则同写入——找到拥有该 key 的最近层并写入。

| 操作                     | 目标 key 已存在于祖先  | 目标 key 不存在 |
| ------------------------ | ---------------------- | --------------- |
| `data()` 返回 `{ k: v }` | 写入当前层（覆盖祖先） | 写入当前层      |
| `scope.k = v`            | 写入**祖先**层         | 写入当前层      |
| `{{input}}` 提交 `k`     | 写入**祖先**层         | 写入当前层      |

> **注意**：`data()` 返回值的行为与直接写 `scope` 不同。当 key 已在祖先定义时，返回值在当前层覆盖祖先，而 `scope.k = v` 直接修改祖先层。为避免混淆，推荐在 `data()` 中用返回值初始化，在 `onEnter()` / `onLeave()` 中直接操作 `scope`。

## 状态分层

### data

`data()` 在每次进入 Section 时调用（scope 先被重置），接收 `{ scope }`（与 `onEnter` 相同的全量 Proxy）。推荐通过返回值初始化变量，由引擎 merge 到当前 Section 的 scope 中：

```markdown
## 地下城 {#dungeon}

<script>
export default {
  data({ scope }) {
    return { attempt: (scope.attempt || 0) + 1 };
  },
};
</script>

### 第一间房 {#room}

这是你第 {{attempt}} 次尝试。
```

## 推荐写法

### 初始值：根 Section 用 frontmatter，其他 Section 用 data()

根 Section 的静态初始值可以写在 YAML frontmatter：

```yaml
---
scope:
  name: 旅人
  gold: 0
---
```

需要运行时计算时使用 `data()`（任意 Section 均可）：

```html
<script>
  export default {
    data() {
      return { seed: Math.floor(Math.random() * 10000) };
    },
  };
</script>
```

### 副作用写在 onEnter / onLeave

进入 Section 需要获得线索，写在 `onEnter()`：

```html
<script>
  export default {
    onEnter({ scope }) {
      const clues = new Set(scope.clues ?? []);
      clues.add("letter");
      scope.clues = [...clues];
    },
  };
</script>
```

离开 Section 后结算状态，写在 `onLeave()`：

```html
<script>
  export default {
    onLeave({ scope, target }) {
      if (scope.acceptedQuest && target === "village.gate") {
        scope.questStarted = true;
      }
    },
  };
</script>
```

## 命名规范

推荐使用简短稳定的英文 id：

```markdown
## 森林 {#forest}

### 古井 {#well}
```

变量名可以使用中文或英文，但同一篇故事中应保持一致。避免混用 `hasKey`、`有钥匙`、`key` 表示同一件事。

## 输入规范

`{{input}}` 声明输入字段。离开 Section 时所有输入与导航目标一并提交。变量自动写入拥有该 key 的最近 scope 层：

```markdown
{{input "string" name="旅人"}}
{{input "number" age=18}}
{{input "boolean" brave=false}}
```

推荐：

- 输入名使用稳定变量名。
- 默认值和类型匹配。
- 同一 Section 里避免多个输入写入同一个变量名。

提交顺序：

1. 读者填写所有 `input`。
2. 读者选择一个 `nav`。
3. 运行时把输入写入对应 scope 层。
4. 当前 Section 的 `onLeave({ scope, target })` 执行。
5. 沿路径向上，离开的祖先 Section 的 `onLeave` 依次执行。

因此 `onLeave()` 可以直接读取最新输入：

```js
onLeave({ scope }) {
  if (scope.name) {
    scope.nameConfirmed = true;
  }
}
```

## 资源与样式

### 资源

在 frontmatter 中声明资源，模板中通过 `{key}` 引用：

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

```markdown
![]({map.url})
{{bgm.url}}
```

字符串形式定义时，MIME 类型根据文件扩展名自动检测。

### 样式

`<style>` 标签归属于所在 Section，作用于其模板范围：

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

## 常见反模式

### 依赖标题文字作为 id

如果不显式写 `{#id}`，标题文字会被用作 id。标题一改，导航就可能失效。应显式写 id。

### 重复使用含义不同的变量名

例如 `state`、`flag`、`count` 在不同场景含义不同，后期很难维护。使用更具体的名字。

## 推荐模板

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
    return { greeting: scope.gold >= 10 ? "你看起来很从容。" : "你需要更多资源。" };
  },
  onLeave({ scope, target }) {
    scope.flags.lastTarget = target;
  },
};
</script>

你好，{{name}}。{{greeting}}

{{#nav null}}结束{{/nav}}
```
