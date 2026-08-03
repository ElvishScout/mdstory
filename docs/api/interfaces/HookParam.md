[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / HookParam

# Interface: HookParam

Defined in: [src/core/section.ts:19](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L19)

Parameters passed to section lifecycle hooks.

The layered scope for the current section is available both as
[HookParam.scope](#scope) and as the hook's `this` (see [SectionHooks](SectionHooks.md))
— both refer to the same object.

## Extended by

- [`LeaveHookParam`](LeaveHookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:30](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L30)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop. Not included in save/load —
do not use it to store story state.

***

### scope

> **scope**: [`Scope`](../type-aliases/Scope.md)

Defined in: [src/core/section.ts:24](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L24)

Layered scope for the current section (reads cascade up to ancestors).
Kept for compatibility — identical to the hook's `this`.
