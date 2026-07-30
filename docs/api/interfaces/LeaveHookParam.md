[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / LeaveHookParam

# Interface: LeaveHookParam

Defined in: [src/core/section.ts:24](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L24)

Parameters passed to the `onLeave` hook.

## Extends

- [`HookParam`](HookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:20](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L20)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop.

#### Inherited from

[`HookParam`](HookParam.md).[`env`](HookParam.md#env)

***

### scope

> **scope**: [`Scope`](../type-aliases/Scope.md)

Defined in: [src/core/section.ts:15](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L15)

Layered scope for the current section (reads cascade up to ancestors).

#### Inherited from

[`HookParam`](HookParam.md).[`scope`](HookParam.md#scope)

***

### target

> **target**: `string` \| `null`

Defined in: [src/core/section.ts:26](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L26)

Dot-separated path of the navigation target, or `null` if the story is ending.
