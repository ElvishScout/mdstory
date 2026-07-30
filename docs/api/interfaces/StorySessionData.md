[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StorySessionData

# Interface: StorySessionData

Defined in: [src/core/session.ts:23](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L23)

Mutable state of a play session.

## Extended by

- [`StorySessionSavedData`](StorySessionSavedData.md)

## Properties

### currentPath

> **currentPath**: `string` \| `null`

Defined in: [src/core/session.ts:27](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L27)

`null` = nowhere (session not started / finished); `""` = root; `"a.b"` = nested section.

***

### scopes

> **scopes**: `Record`\<`string`, [`Scope`](../type-aliases/Scope.md)\>

Defined in: [src/core/session.ts:25](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L25)

Scope layers keyed by dot-separated section path (`""` is the root scope).
