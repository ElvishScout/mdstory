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

## 文档结构

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

| 层级  | 标题     | 作用                                            |
| ----- | -------- | ----------------------------------------------- |
| `#`   | 故事标题 | 可选。章节/场景之前的 `<script>` 输出故事级钩子 |
| `##`  | 章节     | 将场景分组。可拥有自己的钩子和 `locals`         |
| `###` | 场景     | 可渲染单元，包含 Handlebars 模板                |

- 没有 `#` 标题时，故事标题使用 metadata 中的 `title`；都没有则为空。
- 任何 `##` 之前的 `###` 自动归入隐式默认章节。

## 写作规范

详细的写作规范、模板语法、Hooks 最佳实践、状态分层、导航/输入/Script/Include 规范、命名约定、进阶功能（资源/样式/空行）、常见反模式和推荐模板，请参考：

@!WRITING_GUIDE_PATH

## 参考示例

skill 目录下包含可直接阅读的参考示例：

| 文件                        | 说明                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------- |
| `examples/minimal-story.md` | 单文件完整故事，含 frontmatter、`#`/`##`/`###` 结构、`input`、`#nav`、`#if` 条件、chapter 级 `locals()` |
| `examples/multi-ending.md`  | 多结局故事，展示背包系统、好感度条件判断、`view()` 控制结局可见性                                       |
| `examples/multi-file/`      | 多文件拆分结构，展示 `story.md` + `!include` + 分章节文件                                               |
