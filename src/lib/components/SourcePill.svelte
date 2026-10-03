<script lang="ts">
  type Source = 'SN' | 'TWA' | 'MISCELLANEOUS';
  let { source }: { source: Source } = $props();

  const label = $derived(source === 'MISCELLANEOUS' ? 'MISC' : source);
  const fullName = $derived(
    source === 'SN' ? 'SN source'
    : source === 'TWA' ? 'TWA source'
    : 'Miscellaneous source'
  );
</script>

<span class="pill pill-{source.toLowerCase()}" title={fullName} aria-label={fullName}>
  <svg class="glyph" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
    {#if source === 'SN'}
      <circle cx="5" cy="5" r="4.5" fill="currentColor" />
    {:else if source === 'TWA'}
      <path d="M5 .5 9.5 5 5 9.5.5 5z" fill="currentColor" />
    {:else}
      <path d="M5 .8 9.4 9.2H.6z" fill="currentColor" />
    {/if}
  </svg>
  <span>{label}</span>
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.4;
    border: 2px solid transparent;
    white-space: nowrap;
  }

  .glyph {
    flex: none;
  }

  .pill-sn {
    background: #56B4E9;
    color: #0B1F33;
    border-color: #56B4E9;
  }

  .pill-twa {
    background: transparent;
    color: #E69F00;
    border-color: #E69F00;
  }

  .pill-miscellaneous {
    background: transparent;
    color: #9FB3C8;
    border: 2px dashed #9FB3C8;
  }

  .pill:hover {
    filter: brightness(1.12);
  }
</style>
