[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / ParseStoryOptions

# Interface: ParseStoryOptions

Defined in: [src/core/parser.ts:30](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/parser.ts#L30)

Options controlling how a story source is parsed.

## Properties

### base

> **base**: `string`

Defined in: [src/core/parser.ts:32](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/parser.ts#L32)

Base path or URL that relative `!include()` targets are resolved against.

***

### resolveInclude

> **resolveInclude**: [`IncludeResolver`](../type-aliases/IncludeResolver.md)

Defined in: [src/core/parser.ts:34](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/parser.ts#L34)

Loader used to fetch `!include()` targets and other referenced sources.
