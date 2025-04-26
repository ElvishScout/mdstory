---
title: Sole Survivor
globals:
  name: Elvish
---

# Beginning

<script>
  let counter = 0;

  return {
    onEnter(globals) {
      counter++;    
      const order = String(counter) + (["st", "nd", "rd"][(counter + 9) % 10] ?? "th");
      
      return {
        alive: counter <= 5,
        counter,
        order,
        showIntro: counter === 1,
      };
    },
    onNavigate() {
    }
  };
</script>

{{#if alive}}

{{#if showIntro}}

Are you OK? {{input "boolean" ok=""}}

You are the only survivor of an air disaster. I known this is an old-fashioned story, but we are just doing a test. You
wake up, and barely remember your name is {{input "string" name=name}} .

You struggle to climbed out of the wreckage of the crashed plane and find yourself in a vast desert.

{{else}}

You, {{name}}, get lost in the desert, and in the end you travel back to the original place.

You find yourself in a vast desert, near a crashed plane. It's the {{order}} time you've been here.

{{/if}}

You look around and decide to

{{#nav "Beginning"}} Walk forward {{/nav}}

{{else}}

You run out of energy and can't even lift your leg anymore.

{{#nav null}} Accept failure {{/nav}}

{{/if}}
