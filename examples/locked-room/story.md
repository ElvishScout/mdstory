---
title: 雾隐庄谜案
scope:
  name: 侦探
  clues: []
  flags: {}
---

# 雾隐庄谜案 {#story-root}

<style>
  .clue { color: #d4a017; font-style: italic; }
  .note { color: #888; font-size: 0.9em; }
  .suspect { color: #c0392b; }
</style>

<script>
  export default {
    scope() {
      return {
        clues: [],
        flags: {},
        accusation: null,
      };
    },
    onEnter({ scope }) {
      scope.flags.started = true;
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
