# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Features

- Seamless intergration of Markdown, Handlebars and JavaScript.
- Ease-to-use API, for both Web and command line applications.

## File Format

### Metadata

The story file header may include YAML-formatted [Metadata](#type-metadata). Metadata defines the basic information and global configuration of the story.

### Chapters

Story files are divided into chapters by level-one headings. The `id` attribute of the heading serves as the unique identifier (`id`) for the chapter. If omitted, the heading content is used as the chapter `id` instead.

Handlebars template language is supported in the chapter content. During rendering, properties in `globals` and `assets` are added to the context for direct access by the template.

### Helpers

MdStory includes built-in Handlebars helpers for creating interactive components or various functionalities:

#### `{{input type name=default}}`

Creates an input of type `type` and assigns the input value (by default `default`) to a global variable named `name`. Supported input types include: `string`, `number`, `boolean`, and `object` (represented in a JSON string).

In HTML rendering mode, it generates a corresponding `<input>` element.

#### `{{set name=value}}`

Assigns the value `value` to a global variable named `name`.

#### `{{#nav target}}`

Creates an entry to navigate to another chapter identified by `target`.

In HTML rendering mode, it generates a corresponding `<button type="submit">` element.

#### `{{linebreak [n]}}`

Inserts `n` blank lines, where `n` defaults to `1`.

#### `{{asset name}}`

Retrieves the URL of a resource file named `name`. Basically it acts the same way as `{{name}}` except that it supports resource names with special characters.

#### `{{mime name}}`

Retrieves the MIME type of a resource file named `name`.

### JavaScript Scripts

JavaScript may be included into the story file using the `<script>` tag. Scripts before any level-one headings are considered global scripts, while those within chapters are considered chapter scripts. Only one `<script>` tag is allowed at the beginning of the story and in each chapter.

Scripts are evaluated during runtime using the `Function()` constructor, therefore you may use top-level `return` statements to return objects of type [StoryHooks](#type-storyhooks) or [ChapterHooks](#type-chapterhooks).

### Stylesheets

CSS stylesheets may be included using the `<style>` tag, they will be extracted and gathered into the `stylesheet` property of [StoryBody](#type-storybody) during parsing.

## Examples

Here are some [examples](./examples/) of story files.

## API

### `type Value`

The type of variables in MdStory, basically all types allowed in JSON, including primitive values (`string`, `number`, `boolean`, `null`) and nested `array`s and `object`s. Functions and `undefined` are not supported.

### `type Scope`

An object of variable values by their names, used to store global variables or input fields.

### `type Asset`

A referenceable resource file.

#### Properties

- `url`: The URL of the resource.
- `mime (optional)`: The MIME type of the resource.

### `type Metadata`

The Metadata of the story.

#### Properties

- `title (optional)`: The story title.
- `author (optional)`: The author's name.
- `email (optional)`: The author's email address.
- `globals (optional)`: An object of type [Scope](#type-scope) containing initial values of global variables.
- `assets (optional)`: An object of resource names and [Asset](#type-asset) objects, containing all assets used in the story.

### `type ChapterBody`

The structured representation of chapter content.

#### Properties

- `title`: The chapter title.
- `template`: The Handlebars template for rendering.
- `script`: The JavaScript script for the chapter.

### `type StoryBody`

The structured representation of story content.

#### Properties

- `metadata`: The story [Metadata](#type-metadata).
- `chapters`: An object of [ChapterBody](#type-chapterbody) objects by their `id`s.
- `entry`: The `id` of the entry chapter of the story, which may be `null`.
- `script`: The global JavaScript script of the story.
- `stylesheet`: The global stylesheet of the story.

### `type StoryHooks`

Defines the global lifecycle hooks of the story.

#### Properties

- `onStart (optional)`: Called when the story starts.
  - Parameters:
    - `globals`: The initial values of global variables.
  - Return value: Updated `globals` or `void`.

### `type ChapterHooks`

Defines the lifecycle hooks of a chapter.

#### Properties

- `onEnter (optional)`: Called when entering a chapter.
  - Parameters:
    - `globals`: Current global variables.
  - Return value: Updated `globals` or `void`, effective only during the lifecycle of current chapter.
- `onLeave (optional)`: Called when leaving a chapter.
  - Parameters:
    - `globals`: Current global variables.
    - `fields`: Input fields from current chapter.
  - Return value: Updated `globals` or `void`.
- `onNavigate (optional)`: Called during chapter navigation.
  - Parameters:
    - `target` : `id` of target chapter.
    - `globals`: Current global variables.
    - `fields`: Input fields from current chapter.
  - Return value: Updated `target` or `void`.

### `type Renderer`

Defines the renderer interface for generating outputs in different formats.

#### Methods

- `input({ name, type, value }) (optional)`: Generates the rendering result of an input field.

  - Parameters:
    - `name`: The name of the variable.
    - `type`: The type of the variable.
    - `value`: The default value of the variable.
  - Return value: The rendered input field.

- `nav({ target, children }) (optional)`: Generates the rendering result of chapter navigation.
  - Parameters:
    - `target`: The `id` of the target chapter.
    - `children`: The text content of the navigation button.
  - Return value: The rendered navigation button.

### `type RenderOptions`

Defines rendering options.

#### Properties

- `format`: The rendering format, which may be `"markdown"`, `"html"`, or a custom [Renderer](#type-renderer).
- `html (optional)`: Whether to parse Markdown into HTML, defaults to `false`.

### `type RenderResult`

The rendering result, containing the rendered text and extracted fields.

#### Properties

- `text`: The rendered text content.
- `inputs`: An array of input fields, each containing:
  - `name`: The name of the variable.
  - `type`: The type of the variable.
  - `value`: The default value of the variable.
- `sets`: An array of set fields, each containing:
  - `name`: The name of the variable.
  - `type`: The type of the variable.
  - `value`: The value of the variable.
- `navs`: An array of navigation fields, each containing:
  - `text`: The text content of the navigation button.
  - `target`: The `id` of the target chapter.

### `type ChapterOptions`

Defines the initialization options of a chapter.

#### Properties

- `id`: The unique identifier of the chapter.
- `title`: The title of the chapter.
- `template`: The Handlebars template for rendering.
- `hooks`: An object of type [ChapterHooks](#type-chapterhooks).

### `class Chapter`

Defines a chapter.

#### Properties

- `id`: The unique identifier of the chapter.
- `title`: The title of the chapter.
- `template`: The Handlebars template for rendering.
- `hooks`: Chapter hooks of type [ChapterHooks](#type-chapterhooks).

#### Methods

- `constructor(options)`: Initializes the chapter instance.
  - Parameters:
    - `options`: The chapter options of type [ChapterOptions](#type-chapteroptions).
- `render(scope, assets, options)`: Renders the story content.
  - Parameters:
    - `scope`: The rendering context.
    - `assets`: The story assets.
    - `options`: The rendering options of type [RenderOptions](#type-renderoptions).
  - Return value: The rendering result of type [RenderResult](#type-renderresult).

### `type StoryPrompt`

Defines the prompt function of the story, used to handle user input.

#### Parameters

- `props`: An object containing the current chapter and rendering result.
  - `chapter`: Current chapter.
  - `text`: The rendered chapter content.
  - `inputs`, `sets`, `navs`: Fields from the rendering result.

#### Return value

- A `Promise` resolving to one of the following forms:
  - `{ target, updates }`: The `id` of the target chapter and updated global variables.
  - `FormData`: Contains the form data of user input.

### `class StoryBase`

Defines the base class of the story, containing the core logic of the story.

#### Properties

- `metadata`: Story [Metadata](#type-metadata).
- `globals`: Global variables.
- `chapters`: An object of chapters by their `id`s.
- `entry`: The entry chapter of the story.
- `hooks`: An object of type [StoryHooks](#type-storyhooks).
- `stylesheet`: The global stylesheet of the story.
- `assets`: An object of asset files by their alias names.

#### Methods

- `constructor({ metadata, chapters, entry, script, stylesheet })`: Initializes the story instance.
- `play(prompt, options)`: Starts playing the story.
  - Parameters:
    - `prompt`: A function of type [StoryPrompt](#type-storyprompt).
    - `options`: An object of type [RenderOptions](#type-renderoptions).

### `function parseStoryContent`

Parses the story content in Markdown format.

#### Parameters

- `content`: The story content in Markdown format.

#### Return value

- An object of type [StoryBody](#type-storybody).

### `class Story`

Inherits from [StoryBase](#class-storybase), creating a story instance from the story content in Markdown format.

#### Methods

- `constructor(content: string)`: Initializes the story instance.
