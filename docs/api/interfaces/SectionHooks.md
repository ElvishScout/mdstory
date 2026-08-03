[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionHooks

# Interface: SectionHooks

Defined in: [src/core/section.ts:48](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L48)

Section-level lifecycle hooks — unified, no globals/locals distinction.

Each hook is invoked with the section's layered scope bound as `this`
(reads cascade up to ancestors; writes go to the owning layer), so hooks
declared with `function` or method shorthand can use `this` directly.
The same scope is also passed as [HookParam.scope](HookParam.md#scope) for hooks that
prefer destructuring the parameter (e.g. arrow functions).

## Properties

### data?

> `optional` **data?**: (`this`, `param`) => [`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

Defined in: [src/core/section.ts:50](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L50)

Returns variables that take effect within this section's scope and cascade to descendants.

#### Parameters

##### this

[`Scope`](../type-aliases/Scope.md)

##### param

[`HookParam`](HookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

***

### onEnter?

> `optional` **onEnter?**: (`this`, `param`) => [`HookResult`](../type-aliases/HookResult.md)

Defined in: [src/core/section.ts:52](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L52)

Called when the section is entered, after `data` has been applied.

#### Parameters

##### this

[`Scope`](../type-aliases/Scope.md)

##### param

[`HookParam`](HookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)

***

### onLeave?

> `optional` **onLeave?**: (`this`, `param`) => [`HookResult`](../type-aliases/HookResult.md)

Defined in: [src/core/section.ts:54](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L54)

Called when the section is left, before navigating to `target`.

#### Parameters

##### this

[`Scope`](../type-aliases/Scope.md)

##### param

[`LeaveHookParam`](LeaveHookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)
