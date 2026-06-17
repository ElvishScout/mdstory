### Start {#start}

<script>
  export default {
    onEnter({ globals }) {
      globals.visits = (globals.visits || 0) + 1;
    },
    view({ globals, locals }) {
      return {
        visitLabel: globals.visits === 1 ? "first" : `${globals.visits}th`,
        displayName: locals.displayName,
      };
    },
  };
</script>

Hello, {{displayName}}.

This scene came from `include/scenes/start.md`. It is your {{visitLabel}} visit.

{{#nav "included.end"}}Continue{{/nav}}
{{#nav "welcome"}}Return to entry scene{{/nav}}
