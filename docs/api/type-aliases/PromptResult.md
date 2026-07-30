[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PromptResult

# Type Alias: PromptResult

> **PromptResult** = \{ `type`: `"end"`; \} \| \{ `data?`: [`PromptResultData`](PromptResultData.md); `type`: `"continue"`; \} \| \{ `reason?`: [`StorySessionAbortReason`](StorySessionAbortReason.md); `type`: `"abort"`; \}

Defined in: [src/core/session.ts:50](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/session.ts#L50)

Normalised result returned by the prompt function after each render.
