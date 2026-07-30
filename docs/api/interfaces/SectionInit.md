[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionInit

# Interface: SectionInit

Defined in: [src/core/section.ts:40](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L40)

Structured representation of a section for runtime construction.

## Properties

### children

> **children**: [`Section`](../classes/Section.md)[]

Defined in: [src/core/section.ts:52](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L52)

Nested child sections.

***

### hooks?

> `optional` **hooks?**: [`SectionHooks`](SectionHooks.md)

Defined in: [src/core/section.ts:50](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L50)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:42](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L42)

Unique section identifier within its parent.

***

### stylesheets?

> `optional` **stylesheets?**: `string`[]

Defined in: [src/core/section.ts:48](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L48)

Stylesheets scoped to this section.

***

### template?

> `optional` **template?**: `string`

Defined in: [src/core/section.ts:46](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L46)

Raw Markdown/Handlebars template body of the section.

***

### title?

> `optional` **title?**: `string`

Defined in: [src/core/section.ts:44](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L44)

Heading title text.
