[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Env

# Type Alias: Env

> **Env** = `Record`\<`string`, `any`\>

Defined in: [src/core/definitions.ts:20](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/definitions.ts#L20)

Host-provided environment objects made available to section hooks during
playback. Supplied via `PlayOptions.env`; hooks may read and mutate it
freely, e.g. to access player services or attach external state.
