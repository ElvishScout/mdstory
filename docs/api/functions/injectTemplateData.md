[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / injectTemplateData

# Function: injectTemplateData()

> **injectTemplateData**(`template`, `parsedStory`, `options?`): `string`

Defined in: [src/utils/template.ts:9](https://github.com/ElvishScout/mdstory/blob/83e21ff2aaea40630799b3c290a4d3b938995647/src/utils/template.ts#L9)

Injects the parsed story and template options into an HTML template by
replacing the `"__PARSED_STORY__"` and `"__TEMPLATE_OPTIONS__"` placeholders
with JSON (`<` is escaped so the payload is safe to embed inside `<script>`).

## Parameters

### template

`string`

### parsedStory

[`ParsedStory`](../interfaces/ParsedStory.md)

### options?

[`TemplateOptions`](../interfaces/TemplateOptions.md)

## Returns

`string`
