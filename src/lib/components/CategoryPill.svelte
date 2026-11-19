<script lang="ts">
  let { category }: { category: string } = $props();
</script>

<span class="category-pill">{category}</span>

<style>
  .category-pill {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--ocean-surface-2);
    color: var(--ocean-text);
    border: 1px solid var(--ocean-border);
    font-size: 0.8rem;
    font-weight: 600;
    line-height: 1.35;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .category-pill:hover {
    border-color: var(--ocean-primary);
  }
</style>
