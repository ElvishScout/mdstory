[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionInit

# Interface: SectionInit

Defined in: [src/core/section.ts:57](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L57)

Structured representation of a section for runtime construction.

## Properties

### children

> **children**: [`Section`](../classes/Section.md)[]

Defined in: [src/core/section.ts:69](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L69)

Nested child sections.

***

### hooks?

> `optional` **hooks?**: [`SectionHooks`](SectionHooks.md)

Defined in: [src/core/section.ts:67](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L67)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:59](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L59)

Unique section identifier within its parent.

***

### stylesheets?

> `optional` **stylesheets?**: `string`[]

Defined in: [src/core/section.ts:65](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L65)

Stylesheets scoped to this section.

***

### template?

> `optional` **template?**: `string`

Defined in: [src/core/section.ts:63](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L63)

Raw Markdown/Handlebars template body of the section.

***

### title?

> `optional` **title?**: `string`

Defined in: [src/core/section.ts:61](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L61)

Heading title text.
