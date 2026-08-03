[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / RenderResult

# Interface: RenderResult

Defined in: [src/core/renderer.ts:17](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/renderer.ts#L17)

The rendering result containing rendered text and extracted fields.

## Extended by

- [`PromptProps`](PromptProps.md)

## Properties

### inputs

> **inputs**: `object`[]

Defined in: [src/core/renderer.ts:21](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/renderer.ts#L21)

Input fields collected from `{{input}}` helper calls, in order.

#### name

> **name**: `string`

#### type

> **type**: [`InputType`](../type-aliases/InputType.md)

#### value

> **value**: `any`

***

### navs

> **navs**: `object`[]

Defined in: [src/core/renderer.ts:23](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/renderer.ts#L23)

Navigation controls collected from `{{nav}}` helper calls, in order.

#### target

> **target**: `string` \| `null`

#### text

> **text**: `string`

***

### text

> **text**: `string`

Defined in: [src/core/renderer.ts:19](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/renderer.ts#L19)

Rendered output text (Markdown or HTML, depending on the adapter).
