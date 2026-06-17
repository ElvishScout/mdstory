---
title: Include Demo
globals:
  hero: Guest
---

# Include Demo

<script>
  export default {
    globals() {
      return { visits: 0 };
    },
  };
</script>

### Welcome {#welcome}

This entry file includes the rest of the story from nested files.

{{input "string" $hero="Guest"}}

{{#nav "included.start"}}Begin included chapter{{/nav}}

!include("./chapter.md")
