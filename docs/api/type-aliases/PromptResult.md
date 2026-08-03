[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PromptResult

# Type Alias: PromptResult

> **PromptResult** = \{ `type`: `"end"`; \} \| \{ `data?`: [`PromptResultData`](PromptResultData.md); `type`: `"continue"`; \} \| \{ `reason?`: [`StorySessionAbortReason`](StorySessionAbortReason.md); `type`: `"abort"`; \}

Defined in: [src/core/session.ts:51](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/core/session.ts#L51)

Normalised result returned by the prompt function after each render.
