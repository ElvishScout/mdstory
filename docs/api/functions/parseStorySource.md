[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / parseStorySource

# Function: parseStorySource()

> **parseStorySource**(`source`, `options?`): `Promise`\<[`ParsedStory`](../interfaces/ParsedStory.md)\>

Defined in: [src/core/parser.ts:130](https://github.com/ElvishScout/mdstory/blob/24013214167ccb2bff73a34e90d96326a7d3a658/src/core/parser.ts#L130)

Parses a Markdown-formatted story source into a recursive Section tree.

Heading levels map to nesting depth:
- h1 → depth 1 (child of root)
- h2 → depth 2 (child of h1)
- h3 → depth 3 (child of h2)
- ... and so on (h4/h5/h6 supported)

Content before the first h1 belongs to the root section.

## Parameters

### source

`string`

### options?

`Partial`\<[`ParseStoryOptions`](../interfaces/ParseStoryOptions.md)\>

## Returns

`Promise`\<[`ParsedStory`](../interfaces/ParsedStory.md)\>
