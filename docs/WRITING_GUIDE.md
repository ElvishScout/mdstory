# MdStory Writing Guide

This guide is for MdStory authors. It explains how to structure a `.md` story, how to manage state and navigation, and common pitfalls.

## 1. Core Concepts

An MdStory story is a single Markdown file. Three core concepts drive the story:

- **Section**: the structural unit of a story. The file itself is the root Section; `#` / `##` / `###` headings produce nested child Sections by level. Each Section contains a **template** (the Markdown content between its heading and the next sibling or child heading), which renders the scene.
- **Scope**: the variable storage space. Each Section has one scope layer; multiple layers cascade along the path, forming the read and write rules.
- **Hook**: JavaScript functions exported from a Section's `<script>` tag, used to initialize state and trigger side effects.

We recommend organizing your story into a clear hierarchy:

```markdown
# Chapter One

## Forest {#forest}

### Entrance {#entrance}

Scene text...
```

## 2. Document Structure

### 2.1 Frontmatter

The YAML block at the top of the file sets metadata and the initial scope of the root Section:

```yaml
---
title: My Story
scope:
  name: Traveler
  flags: {}
---
```

- `title`: the story title.
- `scope`: initial variables of the root Section, a good place for global state.
- `assets`: declares images, audio, and other resources, referenced in templates via `{key.url}`.

### 2.2 Section Hierarchy

| Heading | Level | Relation            |
| ------- | ----- | ------------------- |
| File    | Root  | The entire document |
| `#`     | 1     | Child of the root   |
| `##`    | 2     | Child of `#`        |
| `###`   | 3     | Child of `##`       |
| `####+` | 4+    | And so on           |

**We recommend giving every Section an explicit id**, e.g. `{#forest}`. Heading text may change; ids should stay stable, or navigation will break. Ids must be unique among siblings, but may repeat under different parents.

The content between a Section's heading and its first child heading is that Section's **template**.

## 3. Scope and State

### 3.1 Scope Layers

Each Section owns one scope layer. The scopes from the root down to the current Section form a chain:

```
root scope → chapter scope → section scope
```

When reading `scope.key`, the engine searches upward from the current Section and returns the first existing value.

When writing `scope.key = value`, it also searches upward: if some layer already owns the key, that layer is modified; otherwise the value is written to the current Section's own layer.

```js
// root scope already has flags: {}
scope.flags.started = true; // modifies root scope
scope.localCount = 1; // written to the current Section's scope
```

### 3.2 Scope Write Rules

| Operation                     | Key exists in an ancestor                   | Key does not exist       |
| ----------------------------- | ------------------------------------------- | ------------------------ |
| `scope.key = value`           | Modifies the ancestor                       | Written to current layer |
| `{{input}}` submits `key`     | Modifies the ancestor                       | Written to current layer |
| `data()` returns `{ key: v }` | Written to current layer (shadows ancestor) | Written to current layer |

Note that `data()` behaves differently from writing `scope` directly: `data()`'s return value is always merged into the **current Section's scope**, even if an ancestor already defines the same key.

### 3.3 The Three Hooks

A Section's `<script>` may export three hooks:

| Hook      | When it runs                                         | Purpose                                              |
| --------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `data`    | Every time the Section is entered, after scope reset | Initialize the Section's variables                   |
| `onEnter` | After `data()` completes                             | Side effects and state updates on entering the scene |
| `onLeave` | When leaving the Section or when the story ends      | Settle state, branch based on the target             |

Every time a Section is entered, its scope is cleared, then `data()` → `onEnter()` runs again. If you leave and come back, previous local state is not preserved. State that must persist across multiple entries should live in an ancestor Section or the root scope.

```markdown
## Dungeon {#dungeon}

<script>
export default {
  data() {
    return { difficulty: 3 };
  },
  onEnter({ scope }) {
    scope.flags.entered = true;  // modifies flags in root scope
  },
  onLeave({ scope, target }) {
    if (target === "dungeon.exit") {
      scope.flags.cleared = true;
    }
  },
};
</script>
```

## 4. Navigation

### 4.1 Explicit Navigation

Use `{{#nav target}}label{{/nav}}`:

```markdown
{{#nav "path"}}A sibling's child{{/nav}}
{{#nav "forest.path"}}A multi-segment path{{/nav}}
{{#nav null}}End the story{{/nav}}
```

Multi-segment paths resolve in this order:

1. Absolute path from the root.
2. Path relative to the current Section.
3. Search upward along the ancestors.

For cross-branch jumps, prefer writing the full path. To end the story, use `null` or `""`.

### 4.2 Implicit Navigation

- **Auto-advance without nav**: if a Section's template contains no clickable `{{#nav}}`, the engine automatically advances to the next Section in depth-first order; the story ends after the last Section.
- **Re-entering the current Section**: if the navigation target resolves to the current Section, the engine first runs `onLeave` back to the parent, then re-enters the current Section. This effectively "refreshes" the scene — the scope is reset.

### 4.3 Lifecycle During Jumps

**Same-branch jump** (`a.b.c` → `a.b.d`): the shared prefixes `a` and `a.b` are not re-entered; only the new `a.b.d` is entered.

**Cross-branch jump** (`a.b.c` → `x.y.z`):

1. Leaving the old path: `onLeave` fires inside-out (`a.b.c` → `a.b` → `a`).
2. Entering the new path: `onEnter` fires outside-in (`x` → `x.y` → `x.y.z`).

## 5. Input

`{{input}}` declares a reader input field. When leaving a Section, all inputs are submitted together with the chosen `{{#nav}}`.

```markdown
{{input "string" name="Traveler"}}
{{input "number" age=18}}
{{input "boolean" brave=false}}
```

Input values follow the same write rules as `scope.key = value`: the nearest scope layer owning the key is modified; if none exists, the value is written to the current layer.

Submission order:

1. The reader fills in all `input`s.
2. The reader picks a `nav`.
3. The runtime writes the inputs into the corresponding scope layers.
4. The current Section's `onLeave` runs.
5. Moving up the path, ancestor Sections' `onLeave` hooks run in order.

So `onLeave()` can read the latest inputs directly.

## 6. Template Syntax

MdStory uses Handlebars as its template engine.

### 6.1 Variable Interpolation

```markdown
Hello, {{name}}. You currently have {{gold}} gold coins.
```

Triple braces output raw HTML — use them only when you need to render HTML tags. Be aware that reader-supplied content may carry XSS risks.

```markdown
{{{richDescription}}}
```

### 6.2 Conditionals and Loops

```markdown
{{#if hasKey}}
The door opens.
{{else if hasLockpick}}
You pick the lock.
{{else}}
The door is locked tight.
{{/if}}

In your backpack:
{{#each inventory}}

- {{this}}
  {{/each}}
```

### 6.3 MdStory Built-in Helpers

| Helper                         | Purpose              |
| ------------------------------ | -------------------- |
| `{{#nav target}}label{{/nav}}` | Navigation link      |
| `{{input type name=default}}`  | Reader input field   |
| `{{linebreak N}}`              | Insert N blank lines |

## 7. Include

Use `!include("target")` to insert another Markdown file at the current location:

```markdown
!include("./chapters/intro.md")
!include("/shared/prologue.md")
!include("https://example.com/stories/ending.md")
```

An `!include` inside an included file resolves relative to the included file's location, not the outermost main file.

## 8. Assets and Styles

### 8.1 Assets

Declare them in the frontmatter:

```yaml
assets:
  map: "https://example.com/map.png"
  bgm: { url: "https://example.com/audio.mp3", mime: "audio/mpeg" }
```

Reference them in templates:

```markdown
![]({map.url})
{{bgm.url}}
```

When defined as a plain string, the MIME type is detected automatically from the file extension.

### 8.2 Styles

A `<style>` tag belongs to its Section and applies to that Section's template scope:

```html
<style>
  .clue {
    color: #ffd700;
  }
</style>
```

## 9. Common Anti-patterns

### 9.1 Relying on Heading Text as the Id

If you don't write an explicit `{#id}`, the heading text is used as the id. Change the heading and navigation may break. Always write explicit ids.

### 9.2 Inconsistent Variable Naming

Within one story, avoid mixing `hasKey`, `has_key`, and `key` for the same thing. Variable names should be stable and unambiguous.

### 9.3 Side Effects in `data()`

`data()` should only initialize variables. Reading inputs, modifying ancestor state, and triggering side effects belong in `onEnter()` or `onLeave()`.

### 9.4 Putting Persistent State in a Child Section

A child Section's scope resets on every entry. State that must survive across multiple entries should live in an ancestor Section or the root scope.

## 10. Recommended Template

```markdown
---
title: Example Story
scope:
  name: Traveler
---

# Example Story

<script>
export default {
  data() {
    return { gold: 10 };
  },
  onEnter({ scope }) {
    scope.flags = { started: true };
  },
};
</script>

## Chapter One {#chapter1}

<script>
export default {
  data() {
    return { difficulty: 1 };
  },
  onEnter({ scope }) {
    scope.flags.lastChapter = "chapter1";
  },
};
</script>

### Start {#start}

<script>
export default {
  data({ scope }) {
    return {
      greeting: scope.gold >= 10 ? "You look well prepared." : "You need more resources.",
    };
  },
  onLeave({ scope, target }) {
    scope.flags.lastTarget = target;
  },
};
</script>

Hello, {{name}}. {{greeting}}

{{#nav null}}The End{{/nav}}
```
