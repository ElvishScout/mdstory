**English** | [中文](README.zh-CN.md) | [Writing Guide](WRITING_GUIDE.zh-CN.md)

# MdStory

An interactive fiction scripting format based on Markdown and Handlebars.

Online demo: <https://mdstory.elvish.cc>

## Installation

```bash
npm install @elvishscout/mdstory
```

To use `mdstory` globally:

```bash
npm install -g @elvishscout/mdstory
```

## Quick Start

An MdStory file is a Markdown document. Each file is a Section; heading levels (`#` `##` `###` …) produce nested child Sections with unlimited depth:

```markdown
---
title: The Crossing
scope:
  name: traveler
---

# The Crossing

<script>
export default {
  data() {
    return { gold: 10 };
  },
};
</script>

## Forest {#forest}

### Deep Woods {#path}

A stranger approaches you.

{{input "string" name="traveler"}}

{{#nav "river.bridge"}}Cross the bridge{{/nav}}
{{#nav "forest.path"}}Enter the forest{{/nav}}

## River {#river}

### Old Bridge {#bridge}

The wooden bridge creaks under your weight, {{name}}.

{{#nav "forest.path"}}Go back{{/nav}}
{{#nav null}}Cross into the light{{/nav}}
```

Save as `story.md` and run:

```bash
mdstory play story.md
```

Or build a standalone HTML file:

```bash
mdstory build story.md
```

## CLI

```bash
# Play a story interactively in the terminal
mdstory play my-story.md

# Options: --debug
mdstory play my-story.md --debug

# Build a standalone HTML file and open in browser
mdstory build my-story.md

# Options: -o <path>, -t <name|path>, -O <key=value>, --no-open, --debug
mdstory build my-story.md -o dist/story.html -t default -O debug=true --no-open

# Print a tree view of a story's section structure
mdstory overview my-story.md

# Options: --words, --ids, -d <n>
mdstory overview my-story.md --words --ids -d 2

# Install MdStory writing skills to coding agents
mdstory skills

# Options: -a <name> (target agent), -d <path> (custom install dir), -y (skip prompt)
mdstory skills -a claude
mdstory skills -d ./my-skills
```

## Skills

After installing skills, use `/mdstory-write` in your coding agent to create interactive stories:

```
/mdstory-write Write a mystery set in an abandoned space station. Include deeply nested sections and multiple endings.
```

The agent will design the structure, write each file, run validations, and deliver a complete playable story.

## Guide

### Section Structure

Everything in MdStory is a **Section**. The file itself is the root Section; heading levels create nested children:

| Heading | Depth | Relationship        |
| ------- | ----- | ------------------- |
| File    | root  | The entire document |
| `#`     | 1     | Child of root       |
| `##`    | 2     | Child of `#`        |
| `###`   | 3     | Child of `##`       |
| `####+` | 4+    | And so on           |

**First entrance**: When jumping into a deep Section from outside, un-entered ancestors render outside-in (root → mid → target). Ancestor templates with `{{#nav}}` can intercept and redirect here.

**Leaving**: `onLeave` fires inside-out (deepest → ancestors).

**Within the same branch**: Jumping within a branch (e.g. `a.b.c` → `a.b.d`) only enters the new `a.b.d` — the common prefix is skipped.

**Frontmatter** — YAML at the top sets metadata and root scope:

```yaml
---
title: My Story
scope:
  name: Alice
  flags: {}
---
```

**Explicit IDs**: Always give Sections an explicit id to keep navigation stable when renaming:

```markdown
## Forest {#forest}

### Deep Woods {#path}
```

IDs must be unique within the same parent Section. The same id under different parents is allowed.

### Navigation

Use `{{#nav target}}label{{/nav}}` to move between Sections:

```markdown
{{#nav "path"}} Child under same parent {{/nav}}
{{#nav "forest.path"}} Multi-segment path {{/nav}}
{{#nav null}} End story {{/nav}}
```

Multi-segment paths (containing `.`) are resolved: absolute from root → relative to current → up through ancestors.

### Input & Variables

Inputs are submitted together when leaving a Section. Values are written to the nearest scope layer that owns the key:

```markdown
{{input "string" name="Alice"}}
{{input "number" age=30}}
{{input "boolean" brave=true}}
```

Reference variables with `{{name}}`.

### Hooks

Hooks are JavaScript functions exported from `<script>` tags. Every Section can use these three hooks:

| Hook      | Signature             | Purpose                               |
| --------- | --------------------- | ------------------------------------- |
| `data`    | `({ scope })`         | Initialize variables for this Section |
| `onEnter` | `({ scope })`         | Side effect on enter                  |
| `onLeave` | `({ scope, target })` | Side effect on leave                  |

The `scope` parameter is a Proxy — reads walk up layers to find the nearest key; writes modify the owning layer. Both `scope.flags.x = true` and `scope.health = 50` persist correctly.

**Example**:

```markdown
## The Dungeon {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter({ scope }) {
    scope.flags.entered = true;
  },
};
</script>

### Treasure Chest {#chest}

<script>
export default {
  onLeave({ scope }) {
    scope.chestOpened = true;
  },
};
</script>

{{#if chestOpened}}
The chest is empty.
{{else}}
You found 50 gold pieces!
{{/if}}
```

### Styles

`<style>` tags belong to their containing Section:

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

### File Includes

```markdown
!include("./chapter-1.md")
!include("https://example.com/shared.md")
```

Includes resolve relative to the containing file.

### Line Breaks

```markdown
{{linebreak}}
{{linebreak 3}}
```

## More Resources

- [Examples](./examples/) — full working stories
- [Writing Guide](WRITING_GUIDE.zh-CN.md) — in-depth authoring reference
- [Online Demo](https://mdstory.elvish.cc)
