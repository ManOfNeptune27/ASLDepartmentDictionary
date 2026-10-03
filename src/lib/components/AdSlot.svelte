<script lang="ts">
  import { onMount } from 'svelte';

  let {
    contentText = '',
    minTextLength = 1,
    adSlot = 'auto',
  }: {
    contentText?: string;
    minTextLength?: number;
    adSlot?: string;
  } = $props();

  const isEligible = $derived(contentText.trim().length >= minTextLength);

  onMount(() => {
    if (!isEligible) return;

    const scriptSelector = 'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
    const existingScript = document.querySelector(scriptSelector);
    const pushAd = () => {
      const ads = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
      ads.push({});
      (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = ads;
    };

    if (existingScript) {
      pushAd();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454601651628271';
    script.crossOrigin = 'anonymous';
    script.onload = pushAd;
    document.head.appendChild(script);
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
