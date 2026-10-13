<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { isAdEligible } from '$lib/ads';

  let {
    contentText = '',
    minTextLength = 1,
    adSlot = 'auto',
  }: {
    contentText?: string;
    minTextLength?: number;
    adSlot?: string;
  } = $props();

  const isEligible = $derived(
    isAdEligible(page.url.pathname) && contentText.trim().length >= minTextLength,
  );

  onMount(() => {
    if (!isEligible) return;

    const pushAd = () => {
      const ads = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
      ads.push({});
      (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = ads;
    };

    pushAd();
  });
</script>

{#if isEligible}
  <ins
    class="adsbygoogle ad-slot"
    style="display:block"
    data-ad-client="ca-pub-6454601651628271"
    data-ad-slot={adSlot}
    data-ad-format="auto"
    data-full-width-responsive="true"
  ></ins>
{/if}

<style>
  .ad-slot {
    min-height: 90px;
  }
</style>
