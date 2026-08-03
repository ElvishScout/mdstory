[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PromptProps

# Interface: PromptProps

Defined in: [src/core/session.ts:40](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L40)

Props passed to the prompt function for each rendered section.

## Extends

- [`RenderResult`](RenderResult.md)

## Properties

### inputs

> **inputs**: `object`[]

Defined in: [src/core/renderer.ts:21](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/renderer.ts#L21)

Input fields collected from `{{input}}` helper calls, in order.

#### name

> **name**: `string`

#### type

> **type**: [`InputType`](../type-aliases/InputType.md)

#### value

> **value**: `any`

#### Inherited from

[`RenderResult`](RenderResult.md).[`inputs`](RenderResult.md#inputs)

***

### navs

> **navs**: `object`[]

Defined in: [src/core/renderer.ts:23](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/renderer.ts#L23)

Navigation controls collected from `{{nav}}` helper calls, in order.

#### target

> **target**: `string` \| `null`

#### text

> **text**: `string`

#### Inherited from

[`RenderResult`](RenderResult.md).[`navs`](RenderResult.md#navs)

***

### path

> **path**: `string`[]

Defined in: [src/core/session.ts:42](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L42)

Path to the rendered section.

***

### text

> **text**: `string`

Defined in: [src/core/renderer.ts:19](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/renderer.ts#L19)

Rendered output text (Markdown or HTML, depending on the adapter).

#### Inherited from

[`RenderResult`](RenderResult.md).[`text`](RenderResult.md#text)
