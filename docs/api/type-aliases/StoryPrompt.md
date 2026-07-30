[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StoryPrompt

# Type Alias: StoryPrompt

> **StoryPrompt** = (`props`) => `Promise`\<[`PromptResult`](PromptResult.md)\>

Defined in: [src/core/session.ts:59](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L59)

Callback invoked after each section render. Receives the rendered output and
extracted fields, and resolves with the user's navigation decision.

## Parameters

### props

[`PromptProps`](../interfaces/PromptProps.md)

## Returns

`Promise`\<[`PromptResult`](PromptResult.md)\>
