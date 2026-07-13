---
name: mdstory-write
description: Write interactive fiction using the MdStory format — Markdown + Handlebars with branching narratives, variables, and script hooks. Covers Section-based structure, nesting, navigation, inputs, hooks, includes, and best practices.
---

# MdStory 写作技能

MdStory 是基于 Markdown 和 Handlebars 的互动小说脚本格式。本技能指导你使用 MdStory 格式创作互动故事（写在 `.md` 文件中）。

开始写作前先阅读 @!PACKAGE_ROOT/examples/ 目录中的参考示例以理解格式。

## 快速参考

一次对话中的工作流：

1. **明确故事设定** — 主题、风格、分支结构复杂度
2. **设计故事结构** — Section 嵌套划分、关键分支点、结局数量
3. **编写主入口文件** — 包含 metadata、根 Section hooks、`!include` 引入各文件
4. **编写各 Section** — 每个标题是一个 Section，嵌套产生层级。**分文件编写时，每写完一个文件立即执行"文件级检查"**
5. **全篇终检** — 所有文件完成后，执行"全篇终检"，确认全篇一致性

## 编写后检查清单

**检查是强制步骤，不得跳过。** 每写完一个文件执行"文件级检查"，全篇完成后执行"全篇终检"。检查结果必须逐条列出，发现问题必须修复后重新检查。

### 文件级检查（每写完一个文件立即执行）

| #   | 检查项                   | 检查方法                                                                                                                                                                                 |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Section 有 id**        | 确认有导航需求的标题有显式 id（如 `## 章节名 {#ch1}`）                                                                                                                                   |
| 2   | **同父下 id 唯一**       | 同一父 Section 下的子 Section id 不重复（不同父 Section 下可以相同）                                                                                                                     |
| 3   | **文件内 nav 可达**      | 本文件内所有 `{{#nav "target"}}` 的目标在本文件或已计划的文件中存在                                                                                                                      |
| 4   | **模板变量已定义**       | 所有位置的变量都有定义——包括 `{{var}}` 插值、`{{#if var}}` 条件、`{{#each var}}` 迭代。每个变量必须在 frontmatter `scope`、`scope()`、`view()`、`assets` 或 `{{input}}` 中至少有一处定义 |
| 5   | **条件块闭合**           | 每个 `{{#if}}`/`{{#each}}` 有对应的 `{{/if}}`/`{{/each}}`，嵌套层级正确                                                                                                                  |
| 6   | **input 类型正确**       | `{{input}}` 的 type 与默认值匹配（string→字符串、number→数字、boolean→true/false）                                                                                                       |
| 7   | **view() 无副作用**      | `view()` 只返回渲染值，不修改 `scope`                                                                                                                                                    |
| 8   | **onEnter/onLeave 分离** | 进入时所需的状态修改在 `onEnter()`，离开时的结算在 `onLeave()`                                                                                                                           |
| 9   | **include 路径存在**     | 本文件内所有 `!include("...")` 引用的文件确实存在                                                                                                                                        |

### 全篇终检（所有文件完成后执行）

> 全篇终检只关注跨文件问题，不重复文件级检查已覆盖的单项。

| #   | 检查项                      | 检查方法                                                                                                                         |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **跨文件 nav 全可达**       | 遍历所有 Section 的所有 `{{#nav}}`，确认多段路径目标真实存在                                                                     |
| 2   | **变量一致性**              | 同一变量名在全篇中类型一致、语义一致；涉及嵌套对象的（如 `flags`、`inventory`）在 frontmatter 或根 Section 的 `scope()` 中初始化 |
| 3   | **所有 Section 从入口可达** | 从入口出发，沿所有 `{{#nav}}` 路径遍历，每个 Section 都能被至少一条路径到达                                                      |
| 4   | **结局可达**                | 每条故事线最终都能到达至少一个 `{{#nav null}}` 结局                                                                              |
| 5   | **无逻辑死循环**            | nav 链路中不存在无条件循环（除非循环中 `onEnter`/`onLeave` 修改状态最终能改变分支条件跳出）                                      |
| 6   | **变量初始化完整**          | frontmatter `scope` 和根 Section 的 `scope()` 返回值覆盖了全篇所有直接读取的变量。嵌套对象属性（如 `flags.xxx`）在使用前有初始值 |
| 7   | **命名规范统一**            | 全篇变量命名风格一致，id 使用简短稳定的英文                                                                                      |
| 8   | **include 链完整**          | 主入口文件的 `!include` 覆盖了所有文件，递归 include 链路完整                                                                    |

### 检查报告格式

每次检查完成后，输出如下格式的报告：

```
## 检查报告：{文件名 或 "全篇终检"}

### 通过项
- [x] 检查项描述
...

### 问题项
- [ ] 检查项描述 → 具体问题：{变量名/nav目标/场景名}
- [ ] 检查项描述 → 具体问题：...

### 修复记录
- 修复了 xxx 处的 yyy 问题
...

**结论：{文件级/全篇} 检查通过，共 N 项通过，M 项已修复。**
```

只有所有问题项都已修复且结论为"通过"后，才能继续编写下一文件（或交付故事）。

## 文档结构

```
┌─ metadata (YAML frontmatter)
│   title, scope 初始变量, assets
│
├─ 根 Section（文件本身 — 第一个标题前的内容）
│   ├─ <style> CSS 样式
│   └─ <script> 根 Section hooks
│       scope(), onEnter(), onLeave(), view()
│
├─ # 一级 Section
│   ├─ <style> 该 Section 的样式
│   ├─ <script> 该 Section 的 hooks
│   └─ ## 二级 Section
│       ├─ <script> hooks
│       └─ ### 三级 Section
│           ├─ <script> hooks
│           └─ Handlebars 模板内容
│
└─ # 一级 Section ...
```

## 层级规则

每个文件是一个 Section，标题层级产生嵌套子 Section，支持无限制层级：

| 标题    | 深度 | 关系               |
| ------- | ---- | ------------------ |
| 文件    | 根   | 整个文档           |
| `#`     | 1    | 根的直接子 Section |
| `##`    | 2    | `#` 的子 Section   |
| `###`   | 3    | `##` 的子 Section  |
| `####+` | 4+   | 以此类推           |

- 推荐为需要导航的 Section 显式写 id（如 `{#intro}`）。
- 同一父 Section 下 id 不能重复；不同父 Section 下可以相同。
- Section 的模板 = 它的标题到第一个子标题之间的内容。

**模板渲染规则**：

- **首次进入**：从外部跳转到深层 Section 时，沿途祖先从外向内（根 → 父 → 目标）依次渲染模板、执行 `onEnter`。祖先模板中的 `{{#nav}}` 可拦截跳转。
- **离开**：`onLeave` 从内向外（目标 → 父 → 根）依次触发。
- **同分支内跳转**：如 `a.b.c` → `a.b.d`，共同前缀 `a` 和 `a.b` 不重进，只进 `a.b.d`。

## 写作规范

详细的写作规范、模板语法、Hooks 最佳实践、状态分层、导航/输入/Script/Include 规范、命名约定、进阶功能（资源/样式/空行）、常见反模式和推荐模板，请参考：

@!PACKAGE_ROOT/WRITING_GUIDE.zh-CN.md
