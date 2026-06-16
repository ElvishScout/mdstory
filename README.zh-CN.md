[English](README.md) | **中文**

# MdStory

基于 Markdown 和 Handlebars 的互动小说脚本格式。

在线演示：<https://mdstory.elvish.cc>

## 特性

- 无缝集成 Markdown、Handlebars 和 JavaScript。
- 易于使用的 API，同时支持 Web 和命令行应用。

## 文件格式

### 元数据

故事文件头部可包含 YAML 格式的元数据，用于定义故事的基本信息和全局配置。

### 章节

故事文件通过一级标题划分为章节。标题的 `id` 属性作为章节的唯一标识符。如果省略，标题内容将用作章节 id。

章节内容支持 Handlebars 模板语言。渲染时，globals 和 assets 中的属性会添加到模板上下文中，供模板直接访问。

### 助手

MdStory 包含以下内置 Handlebars 助手：

#### `{{input type name=default}}`

创建指定类型（`string`、`number` 或 `boolean`）的输入字段，并将值赋给全局变量。

#### `{{set name=value}}`

将值赋给全局变量。

#### `{{#nav target}}`

创建跳转到其他章节的导航入口。

#### `{{linebreak [n]}}`

插入 `n` 个空行（默认为 `1`）。

#### `{{asset name}}`

获取资源文件的 URL。

#### `{{mime name}}`

获取资源文件的 MIME 类型。

### JavaScript 集成

可使用 `<script>` 标签引入 JavaScript。一级标题之前的脚本为全局脚本，章节内的脚本为章节脚本。脚本作为 ES 模块通过动态 `import()` 执行，使用 `export default` 导出钩子对象。

### 样式表

可使用 `<style>` 标签引入 CSS，解析时会提取到 `stylesheet` 属性中。

## 示例

示例故事文件见 [examples](./examples/)。

## API

完整的 API 文档及 TypeScript 类型定义请参阅源码：

- **类型定义**：`Variable`、`InputType`、`Scope`、`Asset`、`Metadata`、`StoryHooks`、`ChapterHooks`、`ChapterInit`、`StoryInit` — 定义于 [src/core/definitions.ts](./src/core/definitions.ts)
- **渲染相关**：`Renderer`、`RenderOptions`、`RenderResult`、`ChapterOptions` — 定义于 [src/core/chapter.ts](./src/core/chapter.ts)
- **类**：`Chapter`、`Story` — 定义于 [src/core/chapter.ts](./src/core/chapter.ts) 和 [src/core/story.ts](./src/core/story.ts)
- **函数**：`parseStorySource` — 定义于 [src/core/parser.ts](./src/core/parser.ts)
