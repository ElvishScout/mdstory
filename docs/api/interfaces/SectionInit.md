[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionInit

# Interface: SectionInit

Defined in: [src/core/section.ts:49](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L49)

Structured representation of a section for runtime construction.

## Properties

### children

> **children**: [`Section`](../classes/Section.md)[]

Defined in: [src/core/section.ts:61](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L61)

Nested child sections.

***

### hooks?

> `optional` **hooks?**: [`SectionHooks`](SectionHooks.md)

Defined in: [src/core/section.ts:59](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L59)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:51](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L51)

Unique section identifier within its parent.

***

### stylesheets?

> `optional` **stylesheets?**: `string`[]

Defined in: [src/core/section.ts:57](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L57)

Stylesheets scoped to this section.

***

### template?

> `optional` **template?**: `string`

Defined in: [src/core/section.ts:55](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L55)

Raw Markdown/Handlebars template body of the section.

***

### title?

> `optional` **title?**: `string`

Defined in: [src/core/section.ts:53](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L53)

Heading title text.
