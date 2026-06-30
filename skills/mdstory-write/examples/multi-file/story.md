---
title: 多文件故事
globals:
  name: 旅人
---

# 多文件故事

<script>
  export default {
    globals() {
      return { gold: 100 };
    },
  };
</script>

!include("./chapter1.md")
!include("./chapter2.md")
!include("./endings.md")
