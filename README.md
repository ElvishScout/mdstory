**English** | [中文](README.zh-CN.md) | [Writing Guide](WRITING_GUIDE.zh-CN.md)

# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Quick Start

A MdStory file is a Markdown document with three levels of headings:

```markdown
---
title: My Story
globals:
  name: Alice
---

# My Story

<script>
  export default {
    globals() {
      return { gold: 100 };
    },
  };
</script>

## Chapter One {#chap1}

### A Dark Forest {#forest}

You wake up in a dark forest. Your name is {{name}} and you have {{gold}} gold.

{{input "string" $weapon="stick"}}

{{#nav "chap2.cave"}}Walk forward{{/nav}}
```

### Structure

| Level | Heading     | Purpose                                                          |
| ----- | ----------- | ---------------------------------------------------------------- |
| `#`   | Story title | Optional. `<script>` before chapters/scenes exports story hooks. |
| `##`  | Chapter     | Groups scenes. Has its own hooks and `locals`.                   |
| `###` | Scene       | Renderable unit with a Handlebars template.                      |

If no `#` heading is present, the story title comes from metadata `title`, or is empty.
Scenes placed before any `##` are grouped into an implicit default chapter.

Content between the `#` heading and the first `##`/`###` is the **story template** — it is rendered once at the beginning of the story. Content between a `##` heading and its first `###` is the **chapter template** — it is rendered once when entering that chapter. Both support the same Handlebars syntax and helpers as scenes.

```markdown
# The Dungeon

*You open a dusty tome...*

## Chapter One {#ch1}

*The air grows cold as you descend.*

### The Entrance {#entrance}

You stand before a massive iron door.
```

### Navigation

Use `{{#nav target}}label{{/nav}}` to let the reader move between scenes:

```markdown
{{#nav "forest"}} Go back to the forest {{/nav}} ← same chapter
{{#nav "chap2.cave"}} Enter the cave (other chapter){{/nav}} ← cross-chapter
{{#nav "chap2"}} Go to chapter 2 {{/nav}} ← chapter entry scene
{{#nav null}} The end {{/nav}} ← end story
```

### Input

Let the reader provide values. `input` does not pause the story where it appears; when the reader leaves the current scene, all inputs in that scene are submitted together with the selected navigation target.

Inputs write to chapter `locals` by default. Prefix the variable name with `$` to write to `globals`.

```markdown
{{input "string"  name="Alice"}} ← local text input
{{input "number"  age=30}} ← local number input
{{input "boolean" brave=true}} ← local checkbox
{{input "string"  $name="Alice"}} ← global text input
```

Use global values later anywhere in the story:

```markdown
Your name is {{name}}.
```

### Logic & Variables

Handlebars `{{#if}}` works with boolean globals and locals:

```markdown
{{#if hasKey}}
You unlock the door.
{{else}}
The door is locked.
{{/if}}
```

Globals persist across the whole story. Chapter `locals` are reset and re-computed each time the chapter is entered. Scene `view()` provides render-only values for the current scene.

### Images & Resources

Reference assets defined in YAML metadata:

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

```markdown
![]({asset "map"})
{{asset "bgm"}} → outputs the URL
{{mime "bgm"}} → outputs "audio/mpeg"
```

### Stylesheets

Include CSS via `<style>` tags under the story heading:

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

### Include

Use `!include("target")` to splice another Markdown source before parsing:

```markdown
!include("./chapter-1.md")
!include("/stories/common.md")
!include("https://example.com/shared.md")
```

Use `fromPath(pathOrUrl)` to load an entry story and its includes through one path or URL. In Node, relative entry paths are resolved from `cwd`, absolute paths load from the file system, and URLs load over the network. In browsers, relative entry paths resolve from the current page URL, absolute paths resolve from the current origin, and URLs stay unchanged. Includes follow the same rule relative to the file or URL that contains the `!include`. Pass `base` or `resolveInclude` to `fromPath()`, `fromSource()`, or the lower-level `parseStorySource()` when you need custom include loading. You can also use `fromParsed()` to construct a story from an already-parsed structure.

### Hooks

Hooks are JavaScript functions that run at specific points. Export them from `<script>` tags.
Each story, chapter, or scene scope supports one or more `<script>` tags — their exports are merged together, with later scripts taking precedence for the same hook.

| Level   | Position    | Hook                                   | Purpose                                                   |
| ------- | ----------- | -------------------------------------- | --------------------------------------------------------- |
| Story   | Under `#`   | `globals()`                            | Return initial global variables                           |
|         |             | `onStart({ globals })`                 | Side effect when story begins                             |
| Chapter | Under `##`  | `locals({ globals })`                  | Return chapter-local variables                            |
|         |             | `onEnter({ globals, locals })`         | Side effect when entering the chapter                     |
|         |             | `onLeave({ globals, locals, target })` | Side effect when leaving the chapter, including story end |
| Scene   | Under `###` | `view({ globals, locals })`            | Return render-only values for the scene                   |
|         |             | `onEnter({ globals, locals })`         | Side effect on scene enter                                |
|         |             | `onLeave({ globals, locals, target })` | Side effect on scene exit                                 |

Hooks with return values support both sync and `async`. `globals()` receives no arguments. `view()` receives the current runtime scopes, but its return value is only used for the current render.

### Line Breaks

```markdown
{{linebreak}} ← one blank line
{{linebreak 3}} ← three blank lines
```

Line breaks are renderer-aware: `\n` in Markdown output, `<br>` in HTML output.

### CLI

```bash
# Play a story interactively in the terminal
npx mdstory play my-story.md

# Play with debug output
npx mdstory play my-story.md --debug

# Build a standalone HTML file and open in browser
npx mdstory build my-story.md

# Build to a specific output path
npx mdstory build my-story.md -o dist/story.html

# Build without opening the browser
npx mdstory build my-story.md --no-open

# Build with debug output in the browser console
npx mdstory build my-story.md --debug
```

### Example: Branching Scene

```markdown
### Crossroads {#crossroads}

A fork in the road. Which way?

{{#nav "chap1.forest"}}🌲 Into the woods{{/nav}}
{{#nav "chap1.mountain"}}⛰️ Up the mountain{{/nav}}
```

## Examples

Full working stories in [examples/](./examples/).

### Chapter with Locals and Branching

```markdown
## The Dungeon {#dungeon}

<script>
  let attempts = 0;
  export default {
    locals() {
      attempts++;
      return { attempt: attempts };
    },
  };
</script>

### First Room {#room}

You enter the dungeon. This is your {{attempt}}th attempt.

{{input "boolean" ready=false}}

{{#if ready}}
The passage splits in two.
{{#nav "dungeon.left"}}Go left{{/nav}}
{{#nav "dungeon.right"}}Go right{{/nav}}
{{else}}
You're not ready yet.
{{#nav "dungeon.room"}}Take a breath{{/nav}}
{{/if}}
```

### Scene with View Hook

```markdown
### Treasure Chest {#chest}

<script>
  export default {
    view({ globals }) {
      const opened = globals.chestOpened || false;
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
The chest is empty.
{{else}}
You found {{coins}} gold pieces!
{{/if}}
```

### Cross-Chapter Navigation

```markdown
### Escape {#escape}

{{#nav "dungeon.room"}}Go back inside{{/nav}}
{{#nav "overworld.village"}}Run to the village{{/nav}}
{{#nav null}}Give up{{/nav}}
```

### Full Story: Simple Choice

```markdown
---
title: The Crossing
---

# The Crossing

### Crossroads {#start}

A stranger approaches you.

{{input "string" $name="traveler"}}

{{#nav "forest.path"}}Enter the forest{{/nav}}
{{#nav "river.bridge"}}Cross the bridge{{/nav}}

## Forest {#forest}

### Deep Woods {#path}

You walk among ancient trees, {{name}}.

The forest whispers your name.

{{#nav "start"}}Turn back{{/nav}}
{{#nav null}}Rest here forever{{/nav}}

## River {#river}

### Old Bridge {#bridge}

The wooden bridge creaks under your weight, {{name}}.

On the far side, you see a light.

{{#nav "start"}}Go back{{/nav}}
{{#nav null}}Cross into the light{{/nav}}
```
