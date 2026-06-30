## 第一章：出发 {#chapter1}

<script>
  export default {
    locals({ globals }) {
      return { rich: globals.gold >= 50 };
    },
  };
</script>

### 小镇 {#town}

你来到一座小镇。

{{#if rich}}
你住进了最好的旅店。
{{else}}
你只能在马厩过夜。
{{/if}}

{{#nav "chapter1.forest"}}前往森林{{/nav}}

### 森林 {#forest}

森林里雾气弥漫。

{{#nav "chapter2.mountain"}}翻过山脉{{/nav}}
