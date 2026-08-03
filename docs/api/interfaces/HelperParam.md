[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / HelperParam

# Interface: HelperParam

Defined in: [src/core/adapter.ts:29](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L29)

Parameters passed to every adapter helper registered with Handlebars.

## Properties

### args

> **args**: `any`[]

Defined in: [src/core/adapter.ts:31](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L31)

Positional arguments supplied by the template (e.g. the input type).

***

### children?

> `optional` **children?**: `string`

Defined in: [src/core/adapter.ts:35](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L35)

Trimmed block content for block helpers; undefined for inline helpers.

***

### options

> **options**: `Record`\<`string`, `any`\>

Defined in: [src/core/adapter.ts:33](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L33)

Named arguments (hash) supplied by the template (e.g. `{ name: value }`).
