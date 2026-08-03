[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Section

# Class: Section

Defined in: [src/core/section.ts:73](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L73)

A recursive section node — the core unit of an MdStory.

## Constructors

### Constructor

> **new Section**(`__namedParameters`, `parent?`): `Section`

Defined in: [src/core/section.ts:89](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L89)

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

Defined in: [src/core/section.ts:85](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L85)

Nested child sections.

***

### hooks

> **hooks**: [`SectionHooks`](../interfaces/SectionHooks.md)

Defined in: [src/core/section.ts:83](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L83)

Lifecycle hooks for this section.

***

### id

> **id**: `string`

Defined in: [src/core/section.ts:75](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L75)

Unique section identifier within its parent.

***

### parent

> **parent**: `Section` \| `null`

Defined in: [src/core/section.ts:87](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L87)

Parent section, or `null` for the root.

***

### stylesheets

> **stylesheets**: `string`[]

Defined in: [src/core/section.ts:81](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L81)

Stylesheets scoped to this section.

***

### template

> **template**: `string`

Defined in: [src/core/section.ts:79](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L79)

Raw Markdown/Handlebars template body of the section.

***

### title

> **title**: `string`

Defined in: [src/core/section.ts:77](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L77)

Heading title text (empty for the root section).

## Methods

### findById()

> **findById**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:148](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L148)

Recursively find a section by id in the entire subtree (depth-first).

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### findNextInTree()

> **findNextInTree**(): `Section` \| `null`

Defined in: [src/core/section.ts:189](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L189)

Find the next section in depth-first pre-order. Returns null if this is the
last section in the entire tree.

#### Returns

`Section` \| `null`

***

### findNextSibling()

> **findNextSibling**(): `Section` \| `null`

Defined in: [src/core/section.ts:174](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L174)

Find the next sibling in the parent's children array.

#### Returns

`Section` \| `null`

***

### getChild()

> **getChild**(`id`): `Section` \| `null`

Defined in: [src/core/section.ts:130](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L130)

Find a direct child by id.

#### Parameters

##### id

`string`

#### Returns

`Section` \| `null`

***

### getPath()

> **getPath**(): `string`[]

Defined in: [src/core/section.ts:162](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L162)

Get the path from root to this section as an array of ids (root itself returns []).

#### Returns

`string`[]

***

### render()

> **render**(`scope`, `options`): [`RenderResult`](../interfaces/RenderResult.md)

Defined in: [src/core/section.ts:125](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L125)

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

Defined in: [src/core/section.ts:135](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L135)

Walk a path array from this section, returning the section at the end (or null).

#### Parameters

##### path

`string`[]

#### Returns

`Section` \| `null`

***

### fromParsed()

> `static` **fromParsed**(`parsed`, `parentPath?`): `Promise`\<`Section`\>

Defined in: [src/core/section.ts:105](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/section.ts#L105)

Construct a Section tree recursively from parser output.

#### Parameters

##### parsed

[`ParsedSection`](../interfaces/ParsedSection.md)

##### parentPath?

`string`[]

#### Returns

`Promise`\<`Section`\>
