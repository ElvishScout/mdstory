[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / PromptResult

# Type Alias: PromptResult

> **PromptResult** = \{ `type`: `"end"`; \} \| \{ `data?`: [`PromptResultData`](PromptResultData.md); `type`: `"continue"`; \} \| \{ `reason?`: [`StorySessionAbortReason`](StorySessionAbortReason.md); `type`: `"abort"`; \}

Defined in: [src/core/session.ts:51](https://github.com/ElvishScout/mdstory/blob/24cd3bf07a5aedf13937a1c919b190fdced75f34/src/core/session.ts#L51)

Normalised result returned by the prompt function after each render.
