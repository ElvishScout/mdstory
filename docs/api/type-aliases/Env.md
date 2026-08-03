[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Env

# Type Alias: Env

> **Env** = `Record`\<`string`, `any`\>

Defined in: [src/core/definitions.ts:20](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/definitions.ts#L20)

Host-provided environment objects made available to section hooks during
playback. Supplied via `PlayOptions.env`; hooks may read and mutate it
freely, e.g. to access player services or attach external state.
