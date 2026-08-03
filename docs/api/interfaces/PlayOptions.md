[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PlayOptions

# Interface: PlayOptions

Defined in: [src/core/session.ts:63](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/session.ts#L63)

Options for interactive playback.

## Extends

- [`RenderOptions`](RenderOptions.md)

## Properties

### adapter

> **adapter**: [`RenderAdapter`](RenderAdapter.md) \| `"markdown"` \| `"html"`

Defined in: [src/core/renderer.ts:13](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/renderer.ts#L13)

Output adapter: a built-in format name or a custom adapter.

#### Inherited from

[`RenderOptions`](RenderOptions.md).[`adapter`](RenderOptions.md#adapter)

***

### debug?

> `optional` **debug?**: `boolean`

Defined in: [src/core/session.ts:70](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/session.ts#L70)

Log the current path and merged scope before each render.

***

### env?

> `optional` **env?**: [`Env`](../type-aliases/Env.md)

Defined in: [src/core/session.ts:68](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/session.ts#L68)

Arbitrary host-provided objects made available to every section hook as
[HookParam.env](HookParam.md#env). Defaults to an empty object.
