[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / LeaveHookParam

# Interface: LeaveHookParam

Defined in: [src/core/section.ts:33](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L33)

Parameters passed to the `onLeave` hook.

## Extends

- [`HookParam`](HookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:29](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L29)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop.

#### Inherited from

[`HookParam`](HookParam.md).[`env`](HookParam.md#env)

***

### scope

> **scope**: [`Scope`](../type-aliases/Scope.md)

Defined in: [src/core/section.ts:24](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L24)

Layered scope for the current section (reads cascade up to ancestors).
Kept for compatibility — identical to the hook's `this`.

#### Inherited from

[`HookParam`](HookParam.md).[`scope`](HookParam.md#scope)

***

### target

> **target**: `string` \| `null`

Defined in: [src/core/section.ts:35](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L35)

Dot-separated path of the navigation target, or `null` if the story is ending.
