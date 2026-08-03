[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Section

# Class: Section

Defined in: [src/core/section.ts:74](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L74)

A recursive section node — the core unit of an MdStory.

## Constructors

### Constructor

> **new Section**(`__namedParameters`, `parent?`): `Section`

Defined in: [src/core/section.ts:90](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L90)

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

Defined in: [src/core/section.ts:86](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L86)

Nested child sections.

***

### hooks

> **hooks**: [`SectionHooks`](../interfaces/SectionHooks.md)

Defined in: [src/core/section.ts:84](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L84)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:76](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L76)

Unique section identifier within its parent.

***

### parent

> **parent**: `Section` \| `null`

Defined in: [src/core/section.ts:88](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L88)

Parent section, or `null` for the root.

***

### stylesheets

> **stylesheets**: `string`[]

Defined in: [src/core/section.ts:82](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L82)

Stylesheets scoped to this section.

***

### template

> **template**: `string`

Defined in: [src/core/section.ts:80](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L80)

Raw Markdown/Handlebars template body of the section.

***

### title

> **title**: `string`

Defined in: [src/core/section.ts:78](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L78)

Heading title text (empty for the root section).

## Methods

### findById()

> **findById**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:149](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L149)

Recursively find a section by id in the entire subtree (depth-first).

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### findNextInTree()

> **findNextInTree**(): `Section` \| `null`

Defined in: [src/core/section.ts:190](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L190)

Find the next section in depth-first pre-order. Returns null if this is the
last section in the entire tree.

#### Returns

`Section` \| `null`

***

### findNextSibling()

> **findNextSibling**(): `Section` \| `null`

Defined in: [src/core/section.ts:175](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L175)

Find the next sibling in the parent's children array.

#### Returns

`Section` \| `null`

***

### getChild()

> **getChild**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:131](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L131)

Find a direct child by id.

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### getPath()

> **getPath**(): `string`[]

Defined in: [src/core/section.ts:163](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L163)

Get the path from root to this section as an array of ids (root itself returns []).

#### Returns

`string`[]

***

### render()

> **render**(`scope`, `options`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [src/core/section.ts:126](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L126)

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

Defined in: [src/core/section.ts:136](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L136)

Walk a path array from this section, returning the section at the end (or null).

#### Parameters

##### path

`string`[]

#### Returns

`Section` \| `null`

***

### fromParsed()

> `static` **fromParsed**(`parsed`, `parentPath?`): `Promise`\<`Section`\>

Defined in: [src/core/section.ts:106](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/section.ts#L106)

Construct a Section tree recursively from parser output.

#### Parameters

##### parsed

[`ParsedSection`](../interfaces/ParsedSection.md)

##### parentPath?

`string`[]

#### Returns

`Promise`\<`Section`\>
