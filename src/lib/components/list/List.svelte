<script lang="ts">
  import { fade } from "svelte/transition";

  export let height = "100%";
  export let minHeight = "default";
  export let overflowY = "scroll";
  export let overflowX = "auto";
  export let classProps = "";
</script>

<div
  class={`list-container gap-2 sparrow-thin-scrollbar ${classProps}`}
  transition:fade
  style={`min-height: ${minHeight}; max-height: ${height}; overflow-y: ${overflowY}; overflow-x: ${overflowX};`}
>
  <div class="list-body">
    <slot />
  </div>
</div>
