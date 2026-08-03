[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionHooks

# Interface: SectionHooks

Defined in: [src/core/section.ts:47](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L47)

Section-level lifecycle hooks — unified, no globals/locals distinction.

Each hook is invoked with the section's layered scope bound as `this`
(reads cascade up to ancestors; writes go to the owning layer), so hooks
declared with `function` or method shorthand can use `this` directly.
The same scope is also passed as [HookParam.scope](HookParam.md#scope) for hooks that
prefer destructuring the parameter (e.g. arrow functions).

## Properties

### data?

> `optional` **data?**: (`this`, `param`) => [`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

Defined in: [src/core/section.ts:49](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L49)

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

Defined in: [src/core/section.ts:51](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L51)

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

Defined in: [src/core/section.ts:53](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L53)

Called when the section is left, before navigating to `target`.

#### Parameters

##### this

[`Scope`](../type-aliases/Scope.md)

##### param

[`LeaveHookParam`](LeaveHookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)
