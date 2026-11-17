<script lang="ts">
  import AdSlot from '$lib/components/AdSlot.svelte';
  import { ADS_ENABLED_ON_SIGN_PAGES } from '$lib/adConfig';
  import SignMedia from '$lib/components/SignMedia.svelte';

  let { data, form } = $props();

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
      <SignMedia src={data.sign.gifUrl} word={data.sign.word} variant="detail" />
    </div>
    <div class="col-12 col-lg-6">
      <h1 class="h2">{data.sign.word}</h1>
    </div>
  </div>

  <section class="mt-4" aria-labelledby="sign-details-heading">
    <h2 id="sign-details-heading" class="h4">Sign details</h2>
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

  <section class="mt-4" aria-labelledby="report-heading">
    {#if form?.reportSuccess}
      <div class="alert alert-success" role="status">{form.reportMessage}</div>
    {/if}

    <details class="report-panel" open={Boolean(form?.reportError)}>
      <summary
        id="report-heading"
        class="btn btn-outline-warning btn-sm"
        aria-label={`Report inaccurate information for ${data.sign.word}`}
      >
        Report inaccurate information
      </summary>
      <form method="POST" action="?/report" class="d-flex flex-column gap-3 mt-3">
        {#if form?.reportError}
          <div class="alert alert-danger mb-0" role="alert">{form.reportError}</div>
        {/if}
        <div>
          <label class="form-label" for="report-description">What looks wrong?</label>
          <textarea
            id="report-description"
            name="description"
            class="form-control"
            rows="4"
            required
            minlength="10"
            maxlength="2000"
            aria-describedby="report-hint"
            aria-invalid={form?.reportError ? 'true' : undefined}
          >{form?.description ?? ''}</textarea>
          <p id="report-hint" class="form-text mb-0">
            Describe the suspected error in at least 10 characters. Leave out your name, email, and
            other contact details. The department reviews the report. The published sign stays as it
            is until a teacher edits it.
          </p>
        </div>
        <div class="report-honeypot" aria-hidden="true">
          <label for="report-leave-blank">Leave blank</label>
          <input id="report-leave-blank" name="leave_blank" type="text" tabindex="-1" autocomplete="off" />
        </div>
        <button type="submit" class="btn btn-warning align-self-start">Submit report</button>
      </form>
    </details>
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

  .sign-fields dt {
    color: var(--ocean-text-muted);
  }

  .report-panel summary {
    list-style: none;
  }

  .report-panel summary::-webkit-details-marker {
    display: none;
  }

  .report-honeypot {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
</style>
