[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / RenderAdapter

# Interface: RenderAdapter

Defined in: [src/core/adapter.ts:59](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/adapter.ts#L59)

Custom render adapter for generating output in different formats.

## Properties

### format

> **format**: `"markdown"` \| `"html"`

Defined in: [src/core/adapter.ts:61](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/adapter.ts#L61)

Whether to convert Markdown to HTML

***

### helpers

> **helpers**: [`BuiltinHelpers`](BuiltinHelpers.md) & `Record`\<`string`, (`param`) => `string`\>

Defined in: [src/core/adapter.ts:63](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/adapter.ts#L63)

Built-in and custom Handlebars helpers used during rendering.
