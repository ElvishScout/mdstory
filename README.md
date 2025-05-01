# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Features

- Seamless integration of Markdown, Handlebars and JavaScript.
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

Creates an input of type `type` and assigns the input value (by default `default`) to a global variable named `name`. Supported input types include: `string`, `number`, `boolean`, and `object` (represented as a JSON string).

In HTML rendering mode, it generates a corresponding `<input>` element.

#### `{{set name=value}}`

Assigns the value `value` to a global variable named `name`.

#### `{{#nav target}}`

Creates an entry to navigate to another chapter identified by `target`.

In HTML rendering mode, it generates a corresponding `<button type="submit">` element.

#### `{{linebreak [n]}}`

Inserts `n` blank lines, where `n` defaults to `1`.

#### `{{asset name}}`

Retrieves the URL of a resource file named `name`. Basically it works the same as `{{name}}` except that it supports resource names with special characters.

#### `{{mime name}}`

Retrieves the MIME type of a resource file named `name`.

### JavaScript Integration

JavaScript may be included into the story source using the `<script>` tag. Scripts before any level-one headings are considered global scripts, while those within chapters are considered chapter scripts. Only one `<script>` tag is allowed at the beginning of the story and in each chapter.

Scripts are evaluated during runtime using the `Function()` constructor, therefore you may use top-level `return` statements to return objects of type [StoryHooks](#type-storyhooks) or [ChapterHooks](#type-chapterhooks).

### Stylesheets

CSS stylesheets may be included using the `<style>` tag, which are extracted and gathered into the `stylesheet` property of [StoryBody](#type-storybody) during parsing.

## Examples

Here are some [examples](./examples/) of story files.

## API

### `type Value`

```typescript
type JsonPrimitive = number | string | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonArray | JsonObject;
type Value = JsonValue;
```

The type of variables in MdStory, basically all types allowed in JSON, including primitive values (`string`, `number`, `boolean`, `null`) and nested `array`s and `object`s. Functions and `undefined` are not supported.

### `type ValueType`

```typescript
type ValueType = "string" | "number" | "boolean" | "object";
```

The type indicator for input fields.

### `type Scope`

```typescript
type Scope = JsonObject;
```

An object of variable values by their names, used to store global variables or input fields.

### `type Asset`

```typescript
type Asset = { url: string; mime?: string };
```

A referenceable resource file.

#### Properties

- `url`: The URL of the resource.
- `mime (optional)`: The MIME type of the resource.

### `type Metadata`

```typescript
type Metadata = {
  title?: string;
  author?: string;
  email?: string;
  assets?: Record<string, Asset>;
};
```

The Metadata of the story.

#### Properties

- `title (optional)`: The story title.
- `author (optional)`: The author's name.
- `email (optional)`: The author's email address.
- `globals (optional)`: A [Scope](#type-scope) containing initial values of global variables.
- `assets (optional)`: An object of all [Asset](#type-asset) objects used in the story by their names.

### `type ChapterBody`

```typescript
type ChapterBody = {
  title: string;
  template: string;
  script: string;
};
```

The structured representation of chapter content.

#### Properties

- `title`: The chapter title.
- `template`: The Handlebars template for rendering.
- `script`: The JavaScript script for the chapter.

### `type StoryBody`

```typescript
type StoryBody = {
  metadata: Metadata;
  chapters: Record<string, ChapterBody>;
  entry: string | null;
  script: string;
  stylesheet: string;
};
```

The structured representation of story content.

#### Properties

- `metadata`: The story [Metadata](#type-metadata).
- `chapters`: An object of [ChapterBody](#type-chapterbody) objects by their `id`s.
- `entry`: The `id` of the entry chapter of the story, which may be `null`.
- `script`: The global JavaScript script of the story.
- `stylesheet`: The global stylesheet of the story.

### `type StoryHooks`

```typescript
type StoryHooks = {
  onStart?: (globals: Scope) => Scope | void;
};
```

Defines the global lifecycle hooks of the story.

#### Methods

- `onStart (optional)`: Called when the story starts.
  - Parameters:
    - `globals`: A [Scope](#type-scope) of initial global variables.
  - Return value:
    - Updated [Scope](#type-scope) of global variables or `void`.

### `type ChapterHooks`

```typescript
type ChapterHooks = {
  onEnter?: (globals: Scope) => Scope | void;
  onLeave?: (globals: Scope, fields: Scope) => Scope | void;
  onNavigate?: (target: string | null, globals: Scope, fields: Scope) => string | null;
};
```

Defines the lifecycle hooks of a chapter.

#### Methods

- `onEnter (optional)`: Called when entering a chapter.
  - Parameters:
    - `globals`: A [Scope](#type-scope) of current global variables.
  - Return value:
    - Updated [Scope](#type-scope) of global variables or `void`. Such update only applies to the current lifecycle of the chapter.
- `onLeave (optional)`: Called when leaving a chapter.
  - Parameters:
    - `globals`: A [Scope](#type-scope) of current global variables.
    - `fields`: A [Scope](#type-scope) of input fields from current chapter.
  - Return value:
    - Updated [Scope](#type-scope) of global variables or `void`.
- `onNavigate (optional)`: Called during chapter navigation.
  - Parameters:
    - `target` : `id` of the target chapter.
    - `globals`: A [Scope](#type-scope) of current global variables.
    - `fields`: A [Scope](#type-scope) of input fields from current chapter.
  - Return value:
    - Updated `target` or `void`.

### `type Renderer`

```typescript
type Renderer = {
  input?: (options: { name: string; type: ValueType; value: Value }) => string;
  nav?: (options: { target: string; children: string }) => string;
};
```

Defines the renderer interface for generating outputs in different formats.

#### Methods

- `input (optional)`: Generates the rendering result of an input field.
  - Parameters:
    - `name`: The name of the variable.
    - `type`: The [ValueType](#type-valuetype) of the variable.
    - `value`: The default [Value](#type-value) of the variable.
  - Return value:
    - The rendered input field.

- `nav (optional)`: Generates the rendering result of chapter navigation.
  - Parameters:
    - `target`: The `id` of the target chapter.
    - `children`: The text content of the navigation button.
  - Return value:
    - The rendered navigation button.

### `type RenderOptions`

```typescript
type RenderOptions = {
  format: "markdown" | "html" | Renderer;
  html?: boolean;
};
```

Defines rendering options.

#### Properties

- `format`: The rendering format, which may be `"markdown"`, `"html"`, or a custom [Renderer](#type-renderer).
- `html (optional)`: Whether to parse Markdown into HTML, defaults to `false`.

### `type RenderResult`

```typescript
type RenderResult = {
  text: string;
  inputs: { name: string; type: ValueType; value: Value }[];
  navs: { text: string; target: string | null }[];
};
```

The rendering result, containing the rendered text and extracted fields.

#### Properties

- `text`: The rendered text content.
- `inputs`: An array of input fields, each containing:
  - `name`: The name of the variable.
  - `type`: The [ValueType](#type-valuetype) of the variable.
  - `value`: The default [Value](#type-value) of the variable.
- `navs`: An array of navigation fields, each containing:
  - `text`: The text content of the navigation button.
  - `target`: The `id` of the target chapter.

### `type ChapterOptions`

```typescript
type ChapterOptions = {
  id: string;
  title: string;
  template: string;
  hooks: ChapterHooks;
};
```

Defines the initialization options of a chapter.

#### Properties

- `id`: The unique identifier of the chapter.
- `title`: The title of the chapter.
- `template`: The Handlebars template for rendering.
- `hooks`: An object of type [ChapterHooks](#type-chapterhooks).

### `class Chapter`

```typescript
class Chapter {
  id: string;
  title: string;
  template: string;
  hooks: ChapterHooks;

  constructor(options: ChapterOptions);
  render(scope: Scope, assets: Record<string, Asset>, options: RenderOptions): string;
}
```

Defines a chapter.

#### Properties

- `id`: The unique identifier of the chapter.
- `title`: The title of the chapter.
- `template`: The Handlebars template for rendering.
- `hooks`: Chapter hooks of type [ChapterHooks](#type-chapterhooks).

#### Methods

- `constructor`: Initializes the chapter instance.
  - Parameters:
    - `options`: An object of type [ChapterOptions](#type-chapteroptions).
- `render`: Renders the chapter content.
  - Parameters:
    - `scope`: An object of type [Scope](#type-scope) for template rendering.
    - `assets`: An object of [Asset](#type-asset) objects by their names.
    - `options`: An object of type [RenderOptions](#type-renderoptions).
  - Return value:
    - An object of type [RenderResult](#type-renderresult).

### `type StoryPrompt`

```typescript
type StoryPrompt = (props: { chapter: Chapter } & RenderResult) => Promise<{ target: string | null; updates: Scope } | FormData>;
```

Defines the prompt function of the story, used to handle user input.

#### Parameters

- `props`: An object containing the current chapter and rendering result.
  - `chapter`: Current [Chapter](#class-chapter).
  - `text`: The rendered chapter content.
  - `inputs`, `navs`: Fields from [RenderResult](#type-renderresult).

#### Return value

- A `Promise` resolving to one of the following forms:
  - `{ target, updates }`: The `id` of the target chapter and updated [Scope](#type-scope) of global variables.
  - `FormData`: Contains the form data of user input, typically from a Web app.

### `class StoryBase`

```typescript
class StoryBase {
  metadata: Metadata;
  globals: Scope;
  chapters: Record<string, Chapter>;
  entry: Chapter | null;
  hooks: StoryHooks;
  stylesheet: string;
  assets: Record<string, Asset>;

  constructor(storyBody: StoryBody);
  play(prompt: StoryPrompt, options: RenderOptions): Promise<void>;
}
```

Defines the base class of the story, containing the core logic of the story.

#### Properties

- `metadata`: Story [Metadata](#type-metadata).
- `globals`: A [Scope](#type-scope) of global variables.
- `chapters`: An object of [Chapter](#class-chapter) objects by their `id`s.
- `entry`: The entry [Chapter](#class-chapter) of the story.
- `hooks`: An object of type [StoryHooks](#type-storyhooks).
- `stylesheet`: The global stylesheet of the story.
- `assets`: An object of [Asset](#type-asset) objects by their names.

#### Methods

- `constructor`: Initializes the story instance.
- `play`: Starts playing the story.
  - Parameters:
    - `prompt`: A function of type [StoryPrompt](#type-storyprompt).
    - `options`: An object of type [RenderOptions](#type-renderoptions).
  - Return value:
    - A `Promise` resolving to `void`.

### `function parseStorySource`

```typescript
function parseStorySource(source: string): StoryBody;
```

Parses the story source in Markdown format.

#### Parameters

- `source`: The story source in Markdown format.

#### Return value

- An object of type [StoryBody](#type-storybody).

### `class Story`

```typescript
class Story extends StoryBase {
  constructor(source: string);
}
```

Inherits from [StoryBase](#class-storybase), creating a story instance from the story source in Markdown format.

#### Methods

- `constructor`: Initializes the story instance.
  - Parameters:
    - `source`: The story source in Markdown format.
