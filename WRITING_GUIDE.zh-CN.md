# MdStory 写作规范与 Hooks Best Practice

本文面向 MdStory 作者，说明一篇 `.md` 故事应如何组织，以及什么时候使用 `globals()`、`locals()`、`view()` 和生命周期 hooks。

## 基本原则

MdStory 文件首先是一篇 Markdown 文档，其次才是一段可执行脚本。优先把故事文本、选择和变量表达清楚，只在需要状态、分支或副作用时使用 `<script>`。

推荐遵守三条规则：

- 用标题表达结构：`#` 是可选的故事标题，`##` 是章节，`###` 是场景。
- 用 Handlebars 表达渲染逻辑：`{{name}}`、`{{#if flag}}...{{/if}}`。
- 用 hooks 管理状态：数据初始化放在 `globals()` / `locals()`，场景渲染补充值放在 `view()`，副作用放在 `onStart()` / `onEnter()` / `onLeave()`。

## 文档结构

一篇故事可以有一个 `#` 标题：

```markdown
---
title: 我的故事
globals:
  name: 旅人
---

# 我的故事

## 第一章 {#chapter1}

### 开始 {#start}

你好，{{name}}。
```

推荐为章节和场景显式写 id，例如 `{#start}`。标题文字可能会调整，id 应保持稳定，方便导航引用。

`#` 标题可以省略。省略时，故事标题使用 metadata 里的 `title`；如果 metadata 也没有设置，则 `story.title` 为空。无论是否有 `#`，第一个 `##` 或 `###` 之前的 `<script>` 都属于 story 级 hooks。

`###` 场景可以出现在第一个 `##` 之前，这些场景会进入隐式默认章节。短篇故事可以这样写；长篇故事建议显式使用章节。

### 故事与章节模板

`#` 标题到第一个 `##`/`###` 之间的内容属于**故事模板**，会在故事开始时渲染一次。`##` 标题到第一个 `###` 之间的内容属于**章节模板**，会在每次进入该章节时渲染一次。两者都支持 Handlebars 语法和内置助手函数（`{{input}}`、`{{#nav}}`、`{{asset}}`、`{{linebreak}}` 等）。

```markdown
# 地下城

*你翻开一本落满灰尘的古书，书页间夹着一张泛黄的地图……*

## 第一章：入口 {#ch1}

*你推开锈迹斑斑的铁门，冷风从地底深处涌上来。*

### 长廊 {#corridor}

眼前是一条幽暗的走道，火把在墙上明灭不定。
```

故事模板适合放开场叙述、旁白或全局提示。章节模板适合放章节导语、氛围描写或每次进入章节都要重复的内容。模板内容是可选的——不写则不会渲染额外内容。

## Include 规范

可以用 `!include("target")` 把其他 Markdown 文件插入到当前位置，再作为一个完整故事解析：

```markdown
!include("./chapters/intro.md")
!include("/shared/prologue.md")
!include("https://example.com/stories/ending.md")
```

`!include` 的目标可以是：

- URL，例如 `https://example.com/chapter.md`。
- 绝对路径，例如 `/stories/chapter.md`。
- 相对路径，例如 `./chapter.md`。

相对路径应按“写出这条 `!include` 的文件”来理解。也就是说，被 include 的文件里如果继续 include `./next.md`，它应相对于被 include 的文件所在位置，而不是最外层主文件。

## 导航规范

使用 `{{#nav target}}标签{{/nav}}` 连接场景：

```markdown
{{#nav "forest"}}回到森林{{/nav}}
{{#nav "chapter2.cave"}}进入洞穴{{/nav}}
{{#nav "chapter2"}}前往第二章入口{{/nav}}
{{#nav null}}结束故事{{/nav}}
```

`target` 有四种常用写法：

| 写法 | 含义 | 示例 |
|------|------|------|
| `scene` | 跳到当前章节内的场景 | `"forest"` |
| `chapter.scene` | 跳到指定章节内的指定场景 | `"chapter2.cave"` |
| `chapter` | 跳到指定章节的入口场景 | `"chapter2"` |
| `null` | 结束故事 | `null` |

当 `target` 不带点号时，运行时会先在当前章节查找同名场景；找不到时再在所有章节中查找同名场景；最后才把它当作章节 id 查找入口场景。

因此推荐：

- 同章跳转可以只写场景 id，例如 `"forest"`。
- 跨章跳转优先写完整的 `chapter.scene`，例如 `"chapter2.cave"`。
- 如果只是进入某个章节的第一个场景，写章节 id，例如 `"chapter2"`。
- 结束故事写 `null`。这会触发当前场景 `onLeave()` 和当前章节 `onLeave()`。

长篇故事里，不建议依赖“全局同名场景查找”。如果目标不在当前章节，就写完整的 `chapter.scene`，这样标题和章节结构调整后更容易维护。

## Script 规范

每个 story、chapter 或 scene 作用域允许写多个 `<script>` 标签。多个脚本的 hook 导出会被 `Object.assign` 合并，同名 hook 后面的覆盖前面的。

```markdown
### 宝箱 {#chest}

<script>
  export default {
    view({ globals }) {
      return { opened: Boolean(globals.chestOpened) };
    },
  };
</script>

<script>
  export default {
    onLeave({ globals }) {
      globals.chestOpened = true;
    },
  };
</script>
```

## Hook 速查

| 层级 | Hook | 时机 | 推荐用途 |
|------|------|------|----------|
| Story | `globals()` | `play()` 开始时，`onStart()` 之前 | 返回动态初始全局变量 |
| Story | `onStart({ globals })` | 故事开始时 | 初始化外部状态、修正全局状态、记录启动事件 |
| Chapter | `locals({ globals })` | 每次进入章节时，`onEnter()` 之前 | 返回本次进入章节的局部变量 |
| Chapter | `onEnter({ globals, locals })` | 每次进入章节时 | 修改状态、记录进入章节 |
| Chapter | `onLeave({ globals, locals, target })` | 离开章节或故事结束时 | 结算章节状态、记录目标 |
| Scene | `onEnter({ globals, locals })` | 每次进入场景时，`view()` 之前 | 修改状态、发放物品、记录访问 |
| Scene | `view({ globals, locals })` | 场景渲染前 | 返回只用于本次渲染的临时值 |
| Scene | `onLeave({ globals, locals, target })` | 读者提交输入并离开场景后 | 根据当前状态或目标更新状态 |

所有 hook 都可以是同步函数或 `async` 函数。`globals()` 不接收参数。

## 状态分层

### globals

`globals` 是整个故事共享的持久状态。

适合放：

- 读者输入：姓名、职业、开关选项。
- 跨章节状态：金币、背包、线索、成就。
- 影响结局的长期选择。

不适合放：

- 只在一个章节里使用的展示变量。
- 只用于当前场景渲染的一次性计算值。

### locals

`locals` 属于当前章节。每次进入章节时会重置，然后执行 `locals({ globals })` 重新计算。

适合放：

- 章节内反复使用的派生值。
- 本次进入章节的计数、难度、临时开关。
- 从 `globals` 派生出的章节视角状态。

示例：

```markdown
## 地下城 {#dungeon}

<script>
  let attempts = 0;

  export default {
    locals({ globals }) {
      attempts++;
      return {
        attempt: attempts,
        hasKey: Boolean(globals.key),
      };
    },
  };
</script>
```

### view

`view()` 返回场景本次渲染使用的临时值。它的返回值会覆盖同名 `globals` / `locals` 参与模板渲染，但不会写回状态。

适合放：

- 只在当前场景显示的派生值。
- 格式化后的文本。
- 根据当前状态计算出的按钮可见性、提示文案、数值展示。

示例：

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
你找到了 {{coins}} 枚金币。
{{/if}}
```

## 推荐写法

### 初始值：静态放 frontmatter，动态放 globals()

静态初始值优先写 YAML frontmatter：

```yaml
---
globals:
  name: 旅人
  gold: 0
---
```

需要运行时计算时使用 `globals()`：

```html
<script>
  export default {
    globals() {
      return {
        seed: Math.floor(Math.random() * 10000),
      };
    },
  };
</script>
```

`globals()` 应只负责返回初始值。需要修改最终全局状态或执行副作用时，用 `onStart({ globals })`。

### 副作用写在 onEnter / onLeave

如果进入场景会获得线索，应写在 `onEnter()`：

```html
<script>
  export default {
    onEnter({ globals }) {
      const clues = new Set(globals.clues ?? []);
      clues.add("letter");
      globals.clues = [...clues];
    },
    view({ globals }) {
      return { clueCount: (globals.clues ?? []).length };
    },
  };
</script>
```

如果离开场景后才结算状态，应写在 `onLeave()`：

```html
<script>
  export default {
    onLeave({ globals, locals, target }) {
      if (locals.acceptedQuest && target === "village.gate") {
        globals.questStarted = true;
      }
    },
  };
</script>
```

### view() 不要承担状态写入职责

`view()` 的主要职责是生成渲染模型。可以读取 `globals` 和 `locals`，但不建议在里面修改状态。

推荐：

```js
view({ globals }) {
  return { hpText: `${globals.hp}/100` };
}
```

不推荐：

```js
view({ globals }) {
  globals.visits = (globals.visits ?? 0) + 1;
  return { visits: globals.visits };
}
```

上面的访问计数应放到 `onEnter()`。

### locals() 返回章节状态，不做章节副作用

`locals()` 适合返回章节局部变量。需要记录进入章节、修改全局状态或调用外部 API 时，用 `onEnter()`。

```js
export default {
  locals({ globals }) {
    return {
      danger: globals.level > 3,
    };
  },
  onEnter({ globals }) {
    globals.visitedDungeon = true;
  },
}
```

## 命名规范

推荐使用简短稳定的英文 id：

```markdown
## 森林 {#forest}

### 古井 {#well}
```

变量名可以使用中文或英文，但同一篇故事中应保持一致。面向代码维护时，英文变量更容易和 JavaScript 生态配合；面向作者写作时，中文变量可读性更好。

推荐：

```markdown
{{#if hasKey}}
你打开了门。
{{/if}}
```

或：

```markdown
{{#if 有钥匙}}
你打开了门。
{{/if}}
```

避免在同一篇故事中混用 `hasKey`、`有钥匙`、`key` 表示同一件事。

## 输入规范

`{{input}}` 用来在当前场景声明输入字段。它不会在出现的位置暂停故事，也不会逐个提交；读者离开当前场景时，当前场景里的所有输入会和选择的 `nav target` 一并提交。

输入默认写入当前章节的 `locals`。如果变量名前加 `$`，则写入 `globals`，并在写入时去掉 `$` 前缀。

```markdown
{{input "string" name="旅人"}}      ← 写入 locals.name
{{input "number" age=18}}          ← 写入 locals.age
{{input "boolean" brave=false}}    ← 写入 locals.brave
{{input "string" $name="旅人"}}     ← 写入 globals.name
```

推荐：

- 输入名使用稳定变量名。
- 默认值和类型匹配。
- 同一场景里避免多个输入写入同一个变量名。
- 需要跨章节或跨场景长期保留的输入使用 `$` 前缀。
- 只服务于当前章节流程的输入保持默认 locals。

一次场景提交的顺序是：

1. 读者填写当前场景里的所有 `input`。
2. 读者选择一个 `nav`，提交目标 `target`。
3. 运行时根据变量名前缀把输入写入 `locals` 或 `globals`。
4. 当前场景的 `onLeave({ globals, locals, target })` 执行。
5. 如果发生章节切换，当前章节的 `onLeave({ globals, locals, target })` 执行。

因此 `onLeave()` 可以直接从 `locals` 或 `globals` 读取最新输入：

```js
onLeave({ globals, locals }) {
  if (locals.name) {
    globals.nameConfirmed = true;
  }
}
```

## 常见反模式

### 在 view() 里改 globals

这会让“渲染一次”变成“推进状态一次”，调试时很难判断状态为何变化。把状态变化移到 `onEnter()` 或 `onLeave()`。

### 把所有变量都放进 globals

`globals` 应保存跨故事流程需要的状态。章节内临时值用 `locals()`，场景渲染值用 `view()`。

### 依赖标题文字作为 id

如果不显式写 `{#id}`，标题文字会被用作 id。标题一改，导航就可能失效。长篇故事应显式写 id。

### 重复使用含义不同的变量名

例如 `state`、`flag`、`count` 在不同场景含义不同，后期很难维护。使用更具体的名字，如 `chestOpened`、`loopCount`、`clueCount`。

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
      return {
        rich: globals.gold >= 10,
      };
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
      return {
        greeting: locals.rich ? "你看起来很从容。" : "你需要更多资源。",
      };
    },
    onLeave({ globals, target }) {
      globals.lastTarget = target;
    },
  };
</script>

你好，{{name}}。{{greeting}}

{{#nav null}}结束{{/nav}}
```
