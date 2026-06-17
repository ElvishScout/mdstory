## Included Chapter {#included}

<script>
  export default {
    locals({ globals }) {
      return {
        displayName: globals.hero || "Guest",
      };
    },
  };
</script>

!include("./scenes/start.md")
!include("./scenes/end.md")
