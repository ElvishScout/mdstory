[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / SectionInit

# Interface: SectionInit

Defined in: [src/core/section.ts:58](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L58)

Structured representation of a section for runtime construction.

## Properties

### children

> **children**: [`Section`](../classes/Section.md)[]

Defined in: [src/core/section.ts:70](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L70)

Nested child sections.

***

### hooks?

> `optional` **hooks?**: [`SectionHooks`](SectionHooks.md)

Defined in: [src/core/section.ts:68](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L68)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:60](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L60)

Unique section identifier within its parent.

***

### stylesheets?

> `optional` **stylesheets?**: `string`[]

Defined in: [src/core/section.ts:66](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L66)

Stylesheets scoped to this section.

***

### template?

> `optional` **template?**: `string`

Defined in: [src/core/section.ts:64](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L64)

Raw Markdown/Handlebars template body of the section.

***

### title?

> `optional` **title?**: `string`

Defined in: [src/core/section.ts:62](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L62)

Heading title text.
