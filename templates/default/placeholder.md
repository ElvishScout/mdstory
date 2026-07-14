---
title: MdStory
---

## 📖 MdStory

<script>
  export default {
    data() {
      return {
        replacedText: JSON.stringify(window.PARSED_STORY),
      }
    }
  }
</script>

Your story JSON is not yet injected. Use one of the methods below to get started.

**CLI**

Build from a Markdown file:

```shell
npx mdstory build story.md
```

**Manual**

Replace `{{{replacedText}}}` in this HTML file with your parsed story JSON.

{{linebreak 2}}

_Refer to README.md in the project root for details._
