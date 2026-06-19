---
title: 江湖风雨录
globals:
  name: 侠士
  inventory: []
  qi: 100
  martialLevel: 1
  reputation: 0
  flags: {}
---

# 江湖风雨录

<script>
  export default {
    globals() {
      return {
        inventory: [],
        qi: 100,
        martialLevel: 1,
        reputation: 0,
        flags: {},
      };
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
