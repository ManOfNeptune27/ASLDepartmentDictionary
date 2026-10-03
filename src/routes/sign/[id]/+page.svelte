<script lang="ts">
  import AdSlot from '$lib/components/AdSlot.svelte';
  import CategoryPill from '$lib/components/CategoryPill.svelte';
  import SourcePill from '$lib/components/SourcePill.svelte';
  import { ADS_ENABLED_ON_SIGN_PAGES } from '$lib/adConfig';
  import { SIGN_CONTENT_MIN_FILLED_FIELDS } from '$lib/signContent';

  let { data } = $props();

  const sourceNames: Record<string, string> = {
    'Signing Naturally': 'Signing Naturally',
    'True Way ASL': 'True Way ASL',
    MISCELLANEOUS: 'Miscellaneous',
  };

  function sourcePill(source: string): 'SN' | 'TWA' | 'MISCELLANEOUS' {
    if (source === 'Signing Naturally') return 'SN';
    if (source === 'True Way ASL') return 'TWA';
    return 'MISCELLANEOUS';
  }

  function displaySource(source: string) {
    return sourceNames[source] ?? source;
  }
</script>

<svelte:head>
  <title>{data.sign.word} | ASL Department Dictionary</title>
  <meta
    name="description"
    content={`${data.sign.word} ASL sign entry with GIF, gloss, and sign parameters.`}
  />
  {#if !data.isContentReady}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<main class="container py-4 sign-page">
  <a href="/" class="btn btn-outline-secondary btn-sm mb-4">Back to dictionary</a>
  <div class="row g-4">
    <div class="col-12 col-lg-6">
      {#if data.sign.gifUrl}
        <img src={data.sign.gifUrl} alt={data.sign.word} class="img-fluid rounded sign-gif" />
      {/if}
    </div>
    <div class="col-12 col-lg-6">
      <h1 class="h2">{data.sign.word}</h1>
      {#if data.isContentReady}
        <p class="text-muted">{data.filledFieldCount} of {SIGN_CONTENT_MIN_FILLED_FIELDS} minimum content fields filled.</p>
      {/if}

      {#if data.books.length > 0}
        <div class="d-flex flex-wrap gap-2 mb-4">
          {#each data.books as book}
            <span class="d-inline-flex align-items-center gap-2">
              <SourcePill source={sourcePill(book.source)} />
              {#if book.category}<CategoryPill category={book.category} />{/if}
              <span class="visually-hidden">{displaySource(book.source)}</span>
            </span>
          {/each}
        </div>
      {/if}

      <dl class="row g-2 sign-fields">
        {#if data.sign.gloss}<dt class="col-sm-4">Gloss</dt><dd class="col-sm-8">{data.sign.gloss}</dd>{/if}
        {#if data.sign.handshape}<dt class="col-sm-4">Handshape</dt><dd class="col-sm-8">{data.sign.handshape}</dd>{/if}
        {#if data.sign.location}<dt class="col-sm-4">Location</dt><dd class="col-sm-8">{data.sign.location}</dd>{/if}
        {#if data.sign.movement}<dt class="col-sm-4">Movement</dt><dd class="col-sm-8">{data.sign.movement}</dd>{/if}
        {#if data.sign.palmOrientation}<dt class="col-sm-4">Palm orientation</dt><dd class="col-sm-8">{data.sign.palmOrientation}</dd>{/if}
        {#if data.sign.nonManualSignals}<dt class="col-sm-4">Non-manual signals</dt><dd class="col-sm-8">{data.sign.nonManualSignals}</dd>{/if}
      </dl>
    </div>
  </div>

  {#if data.relatedSigns.length > 0}
    <section class="mt-5" aria-labelledby="related-signs-heading">
      <h2 id="related-signs-heading" class="h4">Related signs</h2>
      <div class="d-flex flex-wrap gap-2">
        {#each data.relatedSigns as related}
          {#if related.word}<a class="btn btn-outline-secondary btn-sm" href={`/sign/${related.id}`}>{related.word}</a>{/if}
        {/each}
      </div>
    </section>
  {/if}

  {#if data.isContentReady && ADS_ENABLED_ON_SIGN_PAGES}
    <AdSlot contentText={data.contentText} minTextLength={1} />
  {/if}
</main>

<style>
  .sign-page {
    max-width: 960px;
  }

  .sign-gif {
    width: 100%;
    max-height: 520px;
    object-fit: contain;
    background: var(--ocean-surface);
  }

  .sign-fields dt {
    color: var(--ocean-text-muted);
  }
</style>
