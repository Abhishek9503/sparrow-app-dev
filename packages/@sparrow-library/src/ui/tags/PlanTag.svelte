<script lang="ts">
  export let plan: "community" | "standard" | "professional" = "community";
  export let text: string = "";
  export let size: "small" | "medium" = "small";
  let height = size === "medium" ? 20 : 18;

  const planPalette = {
    community: {
      bg: "var(--bg-ds-neutral-700)",
      border: "var(--border-ds-neutral-500)",
      text: "var( --text-ds-neutral-200)",
    },
    standard: {
      bg: "var(--bg-ds-secondary-900)",
      border: "var(--border-ds-secondary-700)",
      text: "var(--bg-ds-secondary-200)",
    },
    professional: {
      bg: "var(--bg-ds-info-900)",
      border: "var(--text-ds-info-700)",
      text: "var(--text-ds-info-300)",
    },
  };

  // Capitalize first letter
  const formatPlan = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
</script>

<button
  style="
    background-color: {planPalette[plan].bg};
    color: {planPalette[plan].text};
    border: 1px solid {planPalette[plan].border};
    border-radius: 2px;
    padding: 2px 4px;
    height: {height}px;
    text-align: center;
    font-family: Inter, sans-serif;
    width: 100%;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
    line-height: 150%;
    display: flex;
    align-items: center;
    justify-content: center;
  "
  title={text || formatPlan(plan)}
>
  {text || formatPlan(plan)}
</button>
