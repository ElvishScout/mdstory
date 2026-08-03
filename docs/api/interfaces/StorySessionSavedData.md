[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StorySessionSavedData

# Interface: StorySessionSavedData

Defined in: [src/core/session.ts:35](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L35)

Serialized session data as returned by [StorySession.save](../classes/StorySession.md#save).
Safe to pass to `JSON.stringify` and to `Story.session()` / `StorySession`.

## Extends

- [`StorySessionData`](StorySessionData.md)

## Properties

### currentPath

> **currentPath**: `string` \| `null`

Defined in: [src/core/session.ts:28](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L28)

`null` = nowhere (session not started / finished); `""` = root; `"a.b"` = nested section.

#### Inherited from

[`StorySessionData`](StorySessionData.md).[`currentPath`](StorySessionData.md#currentpath)

***

### scopes

> **scopes**: `Record`\<`string`, `Record`\<`string`, [`JsonValue`](../type-aliases/JsonValue.md)\>\>

Defined in: [src/core/session.ts:36](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L36)

Scope layers keyed by dot-separated section path (`""` is the root scope).

#### Overrides

[`StorySessionData`](StorySessionData.md).[`scopes`](StorySessionData.md#scopes)
