[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StorySession

# Class: StorySession

Defined in: [src/core/session.ts:150](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L150)

Interactive play session for a [Story](Story.md).

Holds the mutable playback state (scope layers + current position) and drives
the enter/render/prompt/leave loop. Create via `new StorySession(story)`,
`Story.session()`, or restore a saved session via [StorySession.fromSaved](#fromsaved).

## Constructors

### Constructor

> **new StorySession**(`story`, `data?`): `StorySession`

Defined in: [src/core/session.ts:158](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L158)

#### Parameters

##### story

[`Story`](Story.md)

##### data?

[`StorySessionData`](../interfaces/StorySessionData.md)

#### Returns

`StorySession`

## Properties

### data

> **data**: [`StorySessionData`](../interfaces/StorySessionData.md)

Defined in: [src/core/session.ts:154](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L154)

Mutable session state (scope layers and current position).

***

### promise

> **promise**: `Promise`\<`void`\> \| `null`

Defined in: [src/core/session.ts:156](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L156)

In-flight play loop promise, or `null` when no loop is running.

***

### story

> **story**: [`Story`](Story.md)

Defined in: [src/core/session.ts:152](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L152)

The story being played.

## Methods

### play()

> **play**(`prompt`, `options`): `Promise`\<`void`\>

Defined in: [src/core/session.ts:433](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L433)

Plays the story interactively.

At most one play loop may be running at a time — re-entrant calls return
the in-flight promise rather than starting a second loop. This means if
the running loop is aborted (via [StorySessionAbortError](StorySessionAbortError.md)), any
waiter that joined mid-flight will also receive the abort rejection.
Callers that intend to restart should create a fresh session instead.

#### Parameters

##### prompt

[`StoryPrompt`](../type-aliases/StoryPrompt.md)

##### options

[`PlayOptions`](../interfaces/PlayOptions.md)

#### Returns

`Promise`\<`void`\>

***

### save()

> **save**(): [`StorySessionSavedData`](../interfaces/StorySessionSavedData.md)

Defined in: [src/core/session.ts:446](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L446)

Saves session data to a JSON-safe object.

The returned value can be passed directly to `JSON.stringify` and later
restored via `Story.session(savedData)` or the `StorySession` constructor.

#### Returns

[`StorySessionSavedData`](../interfaces/StorySessionSavedData.md)

***

### fromSaved()

> `static` **fromSaved**(`story`, `savedData`): `StorySession`

Defined in: [src/core/session.ts:173](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L173)

Creates a session restored from previously [saved](#save) data.

#### Parameters

##### story

[`Story`](Story.md)

##### savedData

[`StorySessionSavedData`](../interfaces/StorySessionSavedData.md)

#### Returns

`StorySession`
