<script lang="ts">
  import { onMount } from 'svelte';

  let {
    adSlot = 'auto',
    contentText: _contentText,
    minTextLength: _minTextLength,
  }: {
    adSlot?: string;
    contentText?: string;
    minTextLength?: number;
  } = $props();

  onMount(() => {
    const ads = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
    ads.push({});
    (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = ads;
  });
</script>

<ins
  class="adsbygoogle ad-slot"
  style="display:block"
  data-ad-client="ca-pub-6454601651628271"
  data-ad-slot={adSlot}
  data-ad-format="auto"
  data-full-width-responsive="true"
></ins>

<style>
  .ad-slot {
    min-height: 90px;
  }
</style>
