**English** | [中文](README.zh-CN.md)

# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Features

- Seamless integration of Markdown, Handlebars and JavaScript.
- Easy-to-use API, for both Web and command line applications.

## File Format

### Metadata

The story file header may include YAML-formatted metadata. Metadata defines the basic information and global configuration of the story.

### Chapters

Story files are divided into chapters by level-one headings. The `id` attribute of the heading serves as the unique identifier for the chapter. If omitted, the heading content is used as the chapter id instead.

Handlebars template language is supported in the chapter content. During rendering, globals and assets are added to the context for direct access by the template.

### Helpers

MdStory includes built-in Handlebars helpers:

#### `{{input type name=default}}`

Creates an input of the given type (`string`, `number`, or `boolean`) and assigns the value to a global variable.
#### `{{#nav target}}`

Creates an entry to navigate to another chapter.

#### `{{linebreak [n]}}`

Inserts `n` blank lines (default `1`).

#### `{{asset name}}`

Retrieves the URL of a resource file.

#### `{{mime name}}`

Retrieves the MIME type of a resource file.

### JavaScript Integration

JavaScript may be included using `<script>` tags. Scripts before any level-one headings are global scripts, while those within chapters are chapter scripts. Scripts are evaluated as ES modules using dynamic `import()`, so use `export default` to export hooks.

### Stylesheets

CSS may be included using `<style>` tags, extracted into the `stylesheet` property during parsing.

## Examples

See [examples](./examples/) for sample story files.

## API

Full API documentation with TypeScript type definitions is available in the source code:

- **Types**: `Variable`, `InputType`, `Scope`, `Asset`, `Metadata`, `StoryHooks`, `ChapterHooks`, `ChapterInit`, `StoryInit` — defined in [src/core/definitions.ts](./src/core/definitions.ts)
- **Renderer**: `Renderer`, `RenderOptions`, `RenderResult`, `ChapterOptions` — defined in [src/core/chapter.ts](./src/core/chapter.ts)
- **Classes**: `Chapter`, `Story` — defined in [src/core/chapter.ts](./src/core/chapter.ts) and [src/core/story.ts](./src/core/story.ts)
- **Functions**: `parseStorySource` — defined in [src/core/parser.ts](./src/core/parser.ts)
