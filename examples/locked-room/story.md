---
title: 雾隐庄谜案
globals:
  name: 侦探
  clues: []
  flags: {}
---

# 雾隐庄谜案

<style>
  .clue { color: #d4a017; font-style: italic; }
  .note { color: #888; font-size: 0.9em; }
  .suspect { color: #c0392b; }
</style>

<script>
  export default {
    globals() {
      return {
        clues: [],
        flags: {},
        accusation: null,
        reasoningPoints: 0,
      };
    },
    onStart({ globals }) {
      globals.flags.started = true;
    },
  };
</script>

!include("./chapter1.md")
!include("./chapter2.md")
!include("./chapter3.md")
!include("./chapter4.md")
!include("./endings/true.md")
!include("./endings/good.md")
!include("./endings/bad.md")
