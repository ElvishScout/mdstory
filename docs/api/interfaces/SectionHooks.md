[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionHooks

# Interface: SectionHooks

Defined in: [src/core/section.ts:30](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L30)

Section-level lifecycle hooks — unified, no globals/locals distinction.

## Properties

### data?

> `optional` **data?**: (`param`) => [`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

Defined in: [src/core/section.ts:32](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L32)

Returns variables that take effect within this section's scope and cascade to descendants.

#### Parameters

##### param

[`HookParam`](HookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)\<[`Scope`](../type-aliases/Scope.md) \| `undefined`\>

***

### onEnter?

> `optional` **onEnter?**: (`param`) => [`HookResult`](../type-aliases/HookResult.md)

Defined in: [src/core/section.ts:34](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L34)

Called when the section is entered, after `data` has been applied.

#### Parameters

##### param

[`HookParam`](HookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)

***

### onLeave?

> `optional` **onLeave?**: (`param`) => [`HookResult`](../type-aliases/HookResult.md)

Defined in: [src/core/section.ts:36](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L36)

Called when the section is left, before navigating to `target`.

#### Parameters

##### param

[`LeaveHookParam`](LeaveHookParam.md)

#### Returns

[`HookResult`](../type-aliases/HookResult.md)
