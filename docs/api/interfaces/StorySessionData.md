[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StorySessionData

# Interface: StorySessionData

Defined in: [src/core/session.ts:24](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L24)

Mutable state of a play session.

## Extended by

- [`StorySessionSavedData`](StorySessionSavedData.md)

## Properties

### currentPath

> **currentPath**: `string` \| `null`

Defined in: [src/core/session.ts:28](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L28)

`null` = nowhere (session not started / finished); `""` = root; `"a.b"` = nested section.

***

### scopes

> **scopes**: `Record`\<`string`, [`Scope`](../type-aliases/Scope.md)\>

Defined in: [src/core/session.ts:26](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L26)

Scope layers keyed by dot-separated section path (`""` is the root scope).
