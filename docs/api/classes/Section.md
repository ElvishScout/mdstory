[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Section

# Class: Section

Defined in: [src/core/section.ts:56](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L56)

A recursive section node — the core unit of an MdStory.

## Constructors

### Constructor

> **new Section**(`__namedParameters`, `parent?`): `Section`

Defined in: [src/core/section.ts:72](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L72)

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

Defined in: [src/core/section.ts:68](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L68)

Nested child sections.

***

### hooks

> **hooks**: [`SectionHooks`](../interfaces/SectionHooks.md)

Defined in: [src/core/section.ts:66](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L66)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:58](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L58)

Unique section identifier within its parent.

***

### parent

> **parent**: `Section` \| `null`

Defined in: [src/core/section.ts:70](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L70)

Parent section, or `null` for the root.

***

### stylesheets

> **stylesheets**: `string`[]

Defined in: [src/core/section.ts:64](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L64)

Stylesheets scoped to this section.

***

### template

> **template**: `string`

Defined in: [src/core/section.ts:62](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L62)

Raw Markdown/Handlebars template body of the section.

***

### title

> **title**: `string`

Defined in: [src/core/section.ts:60](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L60)

Heading title text (empty for the root section).

## Methods

### findById()

> **findById**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:131](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L131)

Recursively find a section by id in the entire subtree (depth-first).

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### findNextInTree()

> **findNextInTree**(): `Section` \| `null`

Defined in: [src/core/section.ts:172](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L172)

Find the next section in depth-first pre-order. Returns null if this is the
last section in the entire tree.

#### Returns

`Section` \| `null`

***

### findNextSibling()

> **findNextSibling**(): `Section` \| `null`

Defined in: [src/core/section.ts:157](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L157)

Find the next sibling in the parent's children array.

#### Returns

`Section` \| `null`

***

### getChild()

> **getChild**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:113](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L113)

Find a direct child by id.

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### getPath()

> **getPath**(): `string`[]

Defined in: [src/core/section.ts:145](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L145)

Get the path from root to this section as an array of ids (root itself returns []).

#### Returns

`string`[]

***

### render()

> **render**(`scope`, `options`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [src/core/section.ts:108](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L108)

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

Defined in: [src/core/section.ts:118](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L118)

Walk a path array from this section, returning the section at the end (or null).

#### Parameters

##### path

`string`[]

#### Returns

`Section` \| `null`

***

### fromParsed()

> `static` **fromParsed**(`parsed`, `parentPath?`): `Promise`\<`Section`\>

Defined in: [src/core/section.ts:88](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/section.ts#L88)

Construct a Section tree recursively from parser output.

#### Parameters

##### parsed

[`ParsedSection`](../interfaces/ParsedSection.md)

##### parentPath?

`string`[]

#### Returns

`Promise`\<`Section`\>
