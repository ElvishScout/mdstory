[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionHooks

# Interface: SectionHooks

Defined in: [src/core/section.ts:39](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L39)

Section-level lifecycle hooks — unified, no globals/locals distinction.

Each hook is invoked with the section's layered scope bound as `this`
(reads cascade up to ancestors; writes go to the owning layer), so hooks
declared with `function` or method shorthand can use `this` directly.

## Properties

### data?

> `optional` **data?**: (`this`, `param`) => [`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

Defined in: [src/core/section.ts:41](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L41)

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

Defined in: [src/core/section.ts:43](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L43)

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

Defined in: [src/core/section.ts:45](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L45)

Called when the section is left, before navigating to `target`.

#### Parameters

##### this

[`Scope`](../type-aliases/Scope.md)

##### param

[`LeaveHookParam`](LeaveHookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)
