**English** | [中文](README.zh-CN.md) | [Writing Guide](WRITING_GUIDE.zh-CN.md)

# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Installation

```bash
npm install @elvishscout/mdstory
```

Or run directly:

```bash
npx mdstory play my-story.md
```

## Quick Start

An MdStory file is a Markdown document with three heading levels — `#` story, `##` chapter, `###` scene:

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

Save as `story.md` and run:

```bash
npx mdstory play story.md
```

## Guide

### Story Structure

| Level | Heading     | Purpose                                        |
| ----- | ----------- | ---------------------------------------------- |
| `#`   | Story title | Optional. Holds story-level `<script>` hooks.  |
| `##`  | Chapter     | Groups scenes. Has its own hooks and `locals`. |
| `###` | Scene       | A renderable unit with a Handlebars template.  |

**Frontmatter** — YAML at the top of the file sets static metadata and initial globals:

```yaml
---
title: My Story
globals:
  name: Alice
---
```

If no `#` heading is present, the story title comes from metadata `title`, or is empty. Scenes before any `##` are grouped into an implicit default chapter.

**Story & chapter templates** — content between `#` and the first `##`/`###` renders once at story start. Content between `##` and its first `###` renders once when entering that chapter.

```markdown
# The Dungeon

_You open a dusty tome..._

## Chapter One {#ch1}

_The air grows cold as you descend._

### The Entrance {#entrance}

You stand before a massive iron door.
```

### Navigation

Use `{{#nav target}}label{{/nav}}` to move between scenes:

```markdown
{{#nav "forest"}} Go back to the forest {{/nav}} ← same chapter
{{#nav "chap2.cave"}} Enter the cave {{/nav}} ← cross-chapter
{{#nav "chap2"}} Go to Chapter 2 {{/nav}} ← chapter entry scene
{{#nav null}} The end {{/nav}} ← end story
```

### Input & Variables

`input` does not pause the story where it appears. When the reader leaves the scene, all inputs are submitted together with the chosen navigation target.

Inputs write to chapter `locals` by default. Prefix the variable name with `$` to write to `globals`:

```markdown
{{input "string"  name="Alice"}} ← local text input
{{input "number"  age=30}} ← local number input
{{input "boolean" brave=true}} ← local checkbox
{{input "string"  $name="Alice"}} ← global text input
```

Reference variables in templates with `{{name}}`.

### Conditionals

Use `{{#if}}` for branching:

```markdown
{{#if hasKey}}
You unlock the door.
{{else}}
The door is locked.
{{/if}}
```

- **Globals** — persist across the whole story. Set via frontmatter, `$`-prefixed inputs, or hook side effects.
- **Locals** — reset and re-computed each time a chapter is entered. Set via `locals()`.
- **View values** — computed on each scene render. Set via `view()`. Read-only display helpers.

### Hooks

Hooks are JavaScript functions exported from `<script>` tags. Multiple `<script>` tags per scope are merged — later exports take precedence for same-named hooks.

| Scope   | Hook      | Signature                       | Purpose                           |
| ------- | --------- | ------------------------------- | --------------------------------- |
| Story   | `globals` | `()`                            | Return initial global variables   |
| Story   | `onStart` | `({ globals })`                 | Side effect when story begins     |
| Chapter | `locals`  | `({ globals })`                 | Return chapter-local variables    |
| Chapter | `onEnter` | `({ globals, locals })`         | Side effect when entering chapter |
| Chapter | `onLeave` | `({ globals, locals, target })` | Side effect when leaving chapter  |
| Scene   | `view`    | `({ globals, locals })`         | Return render-only values         |
| Scene   | `onEnter` | `({ globals, locals })`         | Side effect when entering scene   |
| Scene   | `onLeave` | `({ globals, locals, target })` | Side effect when leaving scene    |

Hooks with return values support both sync and `async`. `globals()` receives no arguments. `view()` receives the current scopes; its return value is only used for the current render.

**Example** — chapter locals with a counter:

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

This is your {{attempt}}th attempt.
```

**Example** — scene view hook for conditional display:

```markdown
### Treasure Chest {#chest}

<script>
  export default {
    view({ globals }) {
      const opened = globals.chestOpened || false;
      return { alreadyOpened: opened, coins: opened ? 0 : 50 };
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

### Assets & Styles

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

Add CSS with a `<style>` tag under the story heading:

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

### File Includes

Use `!include("target")` to splice another Markdown source before parsing:

```markdown
!include("./chapter-1.md")
!include("/stories/common.md")
!include("https://example.com/shared.md")
```

Includes are resolved relative to the file that contains them. For custom include loading, pass `base` or `resolveInclude` to `fromPath()`, `fromSource()`, or `parseStorySource()`.

### Line Breaks

```markdown
{{linebreak}} ← one blank line
{{linebreak 3}} ← three blank lines
```

Produces `<br>` in both terminal and HTML output.

## CLI

```bash
# Play a story in the terminal
npx mdstory play my-story.md

# Play with debug output
npx mdstory play my-story.md --debug

# Build a standalone HTML file and open in browser
npx mdstory build my-story.md

# Build to a specific output path
npx mdstory build my-story.md -o dist/story.html

# Build without opening browser
npx mdstory build my-story.md --no-open

# Build with debug output in browser console
npx mdstory build my-story.md --debug

# Install MdStory writing skills to coding agents
npx mdstory skills
```

## More Resources

- [Examples](./examples/) — full working stories
- [Writing Guide](WRITING_GUIDE.zh-CN.md) — in-depth authoring reference
- [Online Demo](https://mdstory.elvish.cc)
