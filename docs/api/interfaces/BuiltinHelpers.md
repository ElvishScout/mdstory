[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / BuiltinHelpers

# Interface: BuiltinHelpers

Defined in: [src/core/adapter.ts:39](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L39)

Built-in helpers every adapter must provide.

## Methods

### input()

> **input**(`param`): `string`

Defined in: [src/core/adapter.ts:45](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L45)

Render an input placeholder.
Expected `args[0]` is the input type (defaults to `"string"`);
`options` should contain a single `{ name: value }` pair.

#### Parameters

##### param

[`HelperParam`](HelperParam.md)

#### Returns

`string`

***

### linebreak()

> **linebreak**(`param`): `string`

Defined in: [src/core/adapter.ts:55](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L55)

Render line breaks. Expected `args[0]` is the number of breaks (defaults to 1).

#### Parameters

##### param

[`HelperParam`](HelperParam.md)

#### Returns

`string`

***

### nav()

> **nav**(`param`): `string`

Defined in: [src/core/adapter.ts:52](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/adapter.ts#L52)

Render a navigation/submit control.
Expected `args[0]` is the navigation target;
`children` is the visible label text for block usage.

#### Parameters

##### param

[`HelperParam`](HelperParam.md)

#### Returns

`string`
