[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StoryPrompt

# Type Alias: StoryPrompt

> **StoryPrompt** = (`props`) => `Promise`\<[`PromptResult`](PromptResult.md)\>

Defined in: [src/core/session.ts:60](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/session.ts#L60)

Callback invoked after each section render. Receives the rendered output and
extracted fields, and resolves with the user's navigation decision.

## Parameters

### props

[`PromptProps`](../interfaces/PromptProps.md)

## Returns

`Promise`\<[`PromptResult`](PromptResult.md)\>
