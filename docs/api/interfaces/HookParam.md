[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / HookParam

# Interface: HookParam

Defined in: [src/core/section.ts:18](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L18)

Parameters passed to section lifecycle hooks.

The layered scope for the current section is not part of this object — it
is bound as the hook's `this` (see [SectionHooks](SectionHooks.md)).

## Extended by

- [`LeaveHookParam`](LeaveHookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:23](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L23)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop.
