[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / ParsedSection

# Interface: ParsedSection

Defined in: [src/core/parser.ts:38](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L38)

A parsed section node — recursive, mirrors the heading hierarchy.

## Properties

### children

> **children**: `ParsedSection`[]

Defined in: [src/core/parser.ts:50](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L50)

Nested child sections.

***

### id

> **id**: `string`

Defined in: [src/core/parser.ts:40](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L40)

Unique section identifier within its parent (heading id, or generated).

***

### scripts

> **scripts**: `string`[]

Defined in: [src/core/parser.ts:48](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L48)

Contents of `<script>` blocks scoped to this section.

***

### stylesheets

> **stylesheets**: `string`[]

Defined in: [src/core/parser.ts:46](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L46)

Contents of `<style>` blocks scoped to this section.

***

### template

> **template**: `string`

Defined in: [src/core/parser.ts:44](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L44)

Raw Markdown/Handlebars template body of the section.

***

### title

> **title**: `string`

Defined in: [src/core/parser.ts:42](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L42)

Heading title text (empty for the root section).
