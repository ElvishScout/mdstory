[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PromptResult

# Type Alias: PromptResult

> **PromptResult** = \{ `type`: `"end"`; \} \| \{ `data?`: [`PromptResultData`](PromptResultData.md); `type`: `"continue"`; \} \| \{ `reason?`: [`StorySessionAbortReason`](StorySessionAbortReason.md); `type`: `"abort"`; \}

Defined in: [src/core/session.ts:51](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/core/session.ts#L51)

Normalised result returned by the prompt function after each render.
