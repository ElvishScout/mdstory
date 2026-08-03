[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / Env

# Type Alias: Env

> **Env** = `Record`\<`string`, `any`\>

Defined in: [src/core/definitions.ts:24](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/definitions.ts#L24)

Host-provided environment objects made available to section hooks during
playback. Supplied via `PlayOptions.env`; hooks may read and mutate it
freely, e.g. to access player services.

`env` is provided by the host application on each play loop and is NOT
included in save/load — never use it to store story state; use scope
variables instead.
