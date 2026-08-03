[**@elvishscout/mdstory**](../README.md)

***

[@elvishscout/mdstory](../README.md) / injectTemplateData

# Function: injectTemplateData()

> **injectTemplateData**(`template`, `parsedStory`, `options?`): `string`

Defined in: [src/utils/template.ts:9](https://github.com/ElvishScout/mdstory/blob/156d2e91c8d8c2e651b5abecd3d9ca06cfb9f982/src/utils/template.ts#L9)

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
