[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / LeaveHookParam

# Interface: LeaveHookParam

Defined in: [src/core/section.ts:34](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L34)

Parameters passed to the `onLeave` hook.

## Extends

- [`HookParam`](HookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:30](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L30)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop. Not included in save/load —
do not use it to store story state.

#### Inherited from

[`HookParam`](HookParam.md).[`env`](HookParam.md#env)

***

### scope

> **scope**: [`Scope`](../type-aliases/Scope.md)

Defined in: [src/core/section.ts:24](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L24)

Layered scope for the current section (reads cascade up to ancestors).
Kept for compatibility — identical to the hook's `this`.

#### Inherited from

[`HookParam`](HookParam.md).[`scope`](HookParam.md#scope)

***

### target

> **target**: `string` \| `null`

Defined in: [src/core/section.ts:36](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L36)

Dot-separated path of the navigation target, or `null` if the story is ending.
