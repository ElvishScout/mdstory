[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / StoryPrompt

# Type Alias: StoryPrompt

> **StoryPrompt** = (`props`) => `Promise`\<[`PromptResult`](PromptResult.md)\>

Defined in: [src/core/session.ts:60](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L60)

Callback invoked after each section render. Receives the rendered output and
extracted fields, and resolves with the user's navigation decision.

## Parameters

### props

[`PromptProps`](../interfaces/PromptProps.md)

## Returns

`Promise`\<[`PromptResult`](PromptResult.md)\>
