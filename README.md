**English** | [中文](README.zh-CN.md)

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

**Entering**: Jumping to a deep Section renders ancestors outside-in (root → mid → target). Each Section's scope resets on entry, then `data()` and `onEnter()` run. Ancestor templates with `{{#nav}}` can intercept here.

**Leaving**: `onLeave` fires inside-out (deepest → ancestors), then the engine enters the target from the common ancestor outward.

**Same branch**: Jumping within a branch (e.g. `a.b.c` → `a.b.d`) only enters the new `a.b.d` — the common prefix is skipped. Jumping to the current Section triggers leave-then-re-enter (a "refresh").

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

Multi-segment paths (containing `.`) are resolved: absolute from root → relative to current → up through ancestors. `null` or `""` ends the story.

Sections with no `{{#nav}}` auto-advance depth-first. Selecting the current Section re-enters it (leave → parent → re-enter).

### Inputs

Inputs are submitted together when leaving a Section. Values are written to the nearest scope layer that owns the key:

```markdown
{{input "string" name="Alice"}}
{{input "number" age=30}}
{{input "boolean" brave=true}}
```

Reference variables with `{{name}}`.

### Hooks

Hooks are JavaScript functions exported from `<script>` tags. They run on every entry, with the section's layered scope bound as `this`:

| Hook      | Signature                  | When                            |
| --------- | -------------------------- | ------------------------------- |
| `data`    | `({ scope, env })`         | Every entry (scope reset first) |
| `onEnter` | `({ scope, env })`         | After `data()` returns          |
| `onLeave` | `({ scope, target, env })` | Leaving Section / story end     |

`this` is a Proxy over the scope layers — reads walk up layers to find the nearest key; writes modify the owning layer. Both `this.flags.x = true` and `this.health = 50` persist correctly. The `scope` parameter is the same object as `this`, kept for compatibility — arrow functions can't receive the `this` binding, but can destructure `scope` from the parameter instead.

`env` holds host-provided objects (from `PlayOptions.env` in the library API), shared by all hooks for the duration of a play loop. It is re-supplied by the host on every play and is NOT included in save/load — never store story state in `env`; use scope variables instead. `target` is the dot-separated path of the navigation destination, or `null` if the story is ending.

**Example**:

```markdown
## The Dungeon {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter() {
    this.flags.entered = true;
  },
};
</script>

### Treasure Chest {#chest}

<script>
export default {
  onLeave() {
    this.chestOpened = true;
  },
};
</script>

{{#if chestOpened}}
The chest is empty.
{{else}}
You found 50 gold pieces!
{{/if}}
```

## Scope & Variables

Variables in MdStory live in **scope**. Every Section has its own scope layer: the root Section's scope comes from frontmatter, and child Sections initialize their layer via `data()` on each entry.

Scopes form a stack from root to the current Section. Reads walk up the stack and return the nearest matching key. Writes modify the layer that already owns the key, or the current Section's own layer if the key is not found.

```markdown
## The Dungeon {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter() {
    // Write to the current layer
    this.entered = true;
    // Look up and modify flags in the root scope
    this.flags.dungeon = true;
  },
};
</script>
```

> **Note**: Do not use `$type` as a key in scope. MdStory reserves `$type` internally for save/load serialization of special types.

## Custom Adapters

MdStory renders stories through a pluggable adapter. The built-in `markdownAdapter` and `htmlAdapter` cover the CLI and default web output, but you can pass a custom `RenderAdapter` through `PlayOptions` when using the library API to change how helpers are rendered or add new Handlebars helpers.

```ts
import { fromSource, htmlAdapter, type RenderAdapter, type StoryPrompt } from "@elvishscout/mdstory";

const story = await fromSource(source);

const spoilerAdapter: RenderAdapter = {
  format: "html",
  helpers: {
    ...htmlAdapter.helpers,
    spoiler({ children }) {
      return `<span class="spoiler">${children}</span>`;
    },
  },
};

const prompt: StoryPrompt = async (props) => {
  // Render props.text, collect FormData, return { type: "continue", data }
};

await story.play(prompt, { adapter: spoilerAdapter });
```

Every helper receives a `HelperParam` object:

| Property   | Type                  | Description                                                      |
| ---------- | --------------------- | ---------------------------------------------------------------- |
| `args`     | `any[]`               | Positional arguments from the template (e.g. input type).        |
| `options`  | `Record<string, any>` | Named arguments from the template hash (e.g. `name="Alice"`).    |
| `children` | `string \| undefined` | Trimmed block content for block helpers; `undefined` for inline. |

Use custom helpers in templates just like built-ins:

```markdown
{{#spoiler}}The butler did it.{{/spoiler}}
```

## More Resources

- [Examples](./examples/) — full working stories
- [Docs](./docs/) — [Writing Guide](docs/WRITING_GUIDE.md) and [API Reference](docs/api/README.md)
- [Online Demo](https://mdstory.elvish.cc)
