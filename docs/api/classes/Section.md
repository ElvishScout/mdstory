[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Section

# Class: Section

Defined in: [src/core/section.ts:65](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L65)

A recursive section node — the core unit of an MdStory.

## Constructors

### Constructor

> **new Section**(`__namedParameters`, `parent?`): `Section`

Defined in: [src/core/section.ts:81](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L81)

#### Parameters

##### \_\_namedParameters

[`SectionInit`](../interfaces/SectionInit.md)

##### parent?

`Section` \| `null`

#### Returns

`Section`

## Properties

### children

> **children**: `Section`[]

Defined in: [src/core/section.ts:77](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L77)

Nested child sections.

***

### hooks

> **hooks**: [`SectionHooks`](../interfaces/SectionHooks.md)

Defined in: [src/core/section.ts:75](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L75)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:67](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L67)

Unique section identifier within its parent.

***

### parent

> **parent**: `Section` \| `null`

Defined in: [src/core/section.ts:79](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L79)

Parent section, or `null` for the root.

***

### stylesheets

> **stylesheets**: `string`[]

Defined in: [src/core/section.ts:73](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L73)

Stylesheets scoped to this section.

***

### template

> **template**: `string`

Defined in: [src/core/section.ts:71](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L71)

Raw Markdown/Handlebars template body of the section.

***

### title

> **title**: `string`

Defined in: [src/core/section.ts:69](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L69)

Heading title text (empty for the root section).

## Methods

### findById()

> **findById**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:140](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L140)

Recursively find a section by id in the entire subtree (depth-first).

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### findNextInTree()

> **findNextInTree**(): `Section` \| `null`

Defined in: [src/core/section.ts:181](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L181)

Find the next section in depth-first pre-order. Returns null if this is the
last section in the entire tree.

#### Returns

`Section` \| `null`

***

### findNextSibling()

> **findNextSibling**(): `Section` \| `null`

Defined in: [src/core/section.ts:166](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L166)

Find the next sibling in the parent's children array.

#### Returns

`Section` \| `null`

***

### getChild()

> **getChild**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:122](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L122)

Find a direct child by id.

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### getPath()

> **getPath**(): `string`[]

Defined in: [src/core/section.ts:154](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L154)

Get the path from root to this section as an array of ids (root itself returns []).

#### Returns

`string`[]

***

### render()

> **render**(`scope`, `options`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [src/core/section.ts:117](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L117)

Renders the section template with the given scope and render options.

#### Parameters

##### scope

[`Scope`](../type-aliases/Scope.md)

##### options

[`RenderOptions`](../interfaces/RenderOptions.md)

#### Returns

[`RenderResult`](../interfaces/RenderResult.md)

***

### walk()

> **walk**(`path`): `Section` \| `null`

Defined in: [src/core/section.ts:127](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L127)

Walk a path array from this section, returning the section at the end (or null).

#### Parameters

##### path

`string`[]

#### Returns

`Section` \| `null`

***

### fromParsed()

> `static` **fromParsed**(`parsed`, `parentPath?`): `Promise`\<`Section`\>

Defined in: [src/core/section.ts:97](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/section.ts#L97)

Construct a Section tree recursively from parser output.

#### Parameters

##### parsed

[`ParsedSection`](../interfaces/ParsedSection.md)

##### parentPath?

`string`[]

#### Returns

`Promise`\<`Section`\>
