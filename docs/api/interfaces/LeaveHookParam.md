[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / LeaveHookParam

# Interface: LeaveHookParam

Defined in: [src/core/section.ts:27](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L27)

Parameters passed to the `onLeave` hook.

## Extends

- [`HookParam`](HookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:23](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L23)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop.

#### Inherited from

[`HookParam`](HookParam.md).[`env`](HookParam.md#env)

***

### target

> **target**: `string` \| `null`

Defined in: [src/core/section.ts:29](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L29)

Dot-separated path of the navigation target, or `null` if the story is ending.
