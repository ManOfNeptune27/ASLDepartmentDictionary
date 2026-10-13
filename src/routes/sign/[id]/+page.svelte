<script lang="ts">
  import AdSlot from '$lib/components/AdSlot.svelte';
  import { ADS_ENABLED_ON_SIGN_PAGES } from '$lib/adConfig';

  let { data } = $props();

  const sources = $derived([...new Set(data.books.map((book) => book.source).filter(Boolean))]);
  const units = $derived([...new Set(data.books.map((book) => book.category).filter(Boolean))]);
  const primarySource = $derived(sources[0] ?? 'ASL');
  const metaDescription = $derived(
    `${data.sign.word} in ASL, from ${primarySource}, with a GIF and sign details.`.slice(0, 159),
  );
</script>

<svelte:head>
  <title>{data.sign.word} in ASL | ASL Department Dictionary</title>
  <meta name="description" content={metaDescription} />
  {#if !data.isContentReady}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

<main class="container py-4 sign-page">
  <a href="/dictionary" class="btn btn-outline-secondary btn-sm mb-4">Back to dictionary</a>
  <div class="row g-4">
    <div class="col-12 col-lg-6">
      {#if data.sign.gifUrl}
        <img
          src={data.sign.gifUrl}
          alt={data.sign.gloss ? `${data.sign.word}, ${data.sign.gloss}` : data.sign.word}
          class="img-fluid rounded sign-gif"
        />
      {/if}
    </div>
    <div class="col-12 col-lg-6">
      <h1 class="h2">{data.sign.word}</h1>
    </div>
  </div>

  <section class="mt-4" aria-labelledby="sign-details-heading">
    <dl class="row g-2 sign-fields">
      {#if data.sign.gloss}<dt class="col-sm-4">Gloss</dt><dd class="col-sm-8">{data.sign.gloss}</dd>{/if}
      {#if sources.length > 0}<dt class="col-sm-4">Source{sources.length === 1 ? '' : 's'}</dt><dd class="col-sm-8">{sources.join(', ')}</dd>{/if}
      {#if units.length > 0}<dt class="col-sm-4">Unit{units.length === 1 ? '' : 's'}</dt><dd class="col-sm-8">{units.join(', ')}</dd>{/if}
      {#if data.sign.handshape}<dt class="col-sm-4">Handshape</dt><dd class="col-sm-8">{data.sign.handshape}</dd>{/if}
      {#if data.sign.location}<dt class="col-sm-4">Location</dt><dd class="col-sm-8">{data.sign.location}</dd>{/if}
      {#if data.sign.movement}<dt class="col-sm-4">Movement</dt><dd class="col-sm-8">{data.sign.movement}</dd>{/if}
      {#if data.sign.palmOrientation}<dt class="col-sm-4">Palm orientation</dt><dd class="col-sm-8">{data.sign.palmOrientation}</dd>{/if}
      {#if data.sign.nonManualSignals}<dt class="col-sm-4">Non-manual signals</dt><dd class="col-sm-8">{data.sign.nonManualSignals}</dd>{/if}
    </dl>
  </section>

  {#if data.relatedGroups.length > 0}
    <section class="mt-5" aria-labelledby="related-signs-heading">
      <h2 id="related-signs-heading" class="h4">Related signs</h2>
      <div class="d-flex flex-column gap-3">
        {#each data.relatedGroups as group}
          <div>
            <h3 class="h6 mb-2">{group.label}</h3>
            <div class="d-flex flex-wrap gap-2">
              {#each group.signs as related}
                {#if related.word}
                  <a class="btn btn-outline-secondary btn-sm" href={`/sign/${related.id}`}>{related.word}</a>
                {/if}
              {/each}
            </div>
          </div>
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
