[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / HookParam

# Interface: HookParam

Defined in: [src/core/section.ts:13](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L13)

Parameters passed to section lifecycle hooks.

## Extended by

- [`LeaveHookParam`](LeaveHookParam.md)

## Properties

### env

> **env**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/section.ts:20](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L20)

Host-provided environment objects (from [PlayOptions.env](PlayOptions.md#env)), shared
by all hooks for the duration of a play loop.

***

### scope

> **scope**: [`Scope`](../type-aliases/Scope.md)

Defined in: [src/core/section.ts:15](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L15)

Layered scope for the current section (reads cascade up to ancestors).
