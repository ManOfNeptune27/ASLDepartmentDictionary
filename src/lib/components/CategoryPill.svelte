<script lang="ts">
  let { category }: { category: string } = $props();
</script>

<span class="category-pill">{category}</span>

<style>
  .category-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    background: var(--ocean-surface-2);
    color: var(--ocean-text);
    border: 1px solid var(--ocean-border);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
  }

  .category-pill:hover {
    border-color: var(--ocean-primary);
  }
</style>
