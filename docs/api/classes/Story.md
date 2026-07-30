[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Story

# Class: Story

Defined in: [src/core/story.ts:14](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L14)

Story runtime containing core playback logic.
Wraps a root Section tree. Construct via `fromSource(source)`,
`fromPath(path)`, `fromParsed(parsedStory)`, or manually.

## Constructors

### Constructor

> **new Story**(`root`, `metadata?`): `Story`

Defined in: [src/core/story.ts:27](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L27)

#### Parameters

##### root

[`Section`](Section.md)

##### metadata?

[`Metadata`](../interfaces/Metadata.md)

#### Returns

`Story`

## Properties

### assets

> **assets**: `Record`\<`string`, \{ `mime?`: `string`; `url`: `string`; \}\>

Defined in: [src/core/story.ts:20](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L20)

Named assets from metadata, spread into the render scope.

***

### metadata

> **metadata**: [`Metadata`](../interfaces/Metadata.md)

Defined in: [src/core/story.ts:16](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L16)

Story metadata collected from front-matter.

***

### root

> **root**: [`Section`](Section.md)

Defined in: [src/core/story.ts:18](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L18)

Root section of the section tree.

## Accessors

### title

#### Get Signature

> **get** **title**(): `string`

Defined in: [src/core/story.ts:23](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L23)

Story title from metadata, falling back to the root section title.

##### Returns

`string`

## Methods

### play()

> **play**(`prompt`, `options`): `Promise`\<`void`\>

Defined in: [src/core/story.ts:118](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L118)

Plays the story interactively.

Creates a new session via [session](#session) and delegates playback to it.
Returns a promise that resolves when playback completes.

#### Parameters

##### prompt

[`StoryPrompt`](../type-aliases/StoryPrompt.md)

##### options

[`PlayOptions`](../interfaces/PlayOptions.md)

#### Returns

`Promise`\<`void`\>

***

### resolveTarget()

> **resolveTarget**(`target`, `currentPath`): `string`[] \| `null`

Defined in: [src/core/story.ts:43](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L43)

Resolves a target string into a section path from root.

- `"a.b.c"` → walked from root as an absolute path
- `"b.c"`   → tried relative to current path first, then absolute
- `"c"`     → searched: current children → siblings → global
- `null`    → end of story (returns null)

Returns the path array (from root) or null for end-of-story.

#### Parameters

##### target

`string` \| `null`

##### currentPath

`string`[]

#### Returns

`string`[] \| `null`

***

### session()

> **session**(`savedData?`): [`StorySession`](StorySession.md)

Defined in: [src/core/story.ts:108](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/story.ts#L108)

Creates and returns a new [StorySession](StorySession.md) for this story.

#### Parameters

##### savedData?

[`StorySessionSavedData`](../interfaces/StorySessionSavedData.md)

#### Returns

[`StorySession`](StorySession.md)
