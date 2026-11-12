<script lang="ts">
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import { fade, fly, slide } from "svelte/transition";
  import { goto, invalidateAll } from "$app/navigation";
  import { navigating, page } from "$app/state";
  import { sources, type Source } from "$lib";
  import CategoryPill from "$lib/components/CategoryPill.svelte";
  import SignMedia from "$lib/components/SignMedia.svelte";
  import SourcePill from "$lib/components/SourcePill.svelte";

  type WordCard = {
    id: string;
    sourceId: Source;
    sourceLabel: string;
    unitId: string;
    unitName: string;
    word: string;
    gloss: string;
    gifUrl: string;
    parameters: {
      handshape: string;
      location: string;
      movement: string;
      palmOrientation: string;
      nonManualSignals: string;
    };
  };

  type ParameterKey =
    | "handshape"
    | "location"
    | "movement"
    | "palmOrientation"
    | "nonManualSignals";

  let { data } = $props();

  const bookToSourceId: Record<string, Source> = {
    "Signing Naturally": "naturally",
    "True Way ASL": "trueway",
    MISCELLANEOUS: "miscellaneous",
  };

  const sourceDisplayNames: Record<string, string> = {
    "Signing Naturally": "SN",
    "True Way ASL": "TWA",
    MISCELLANEOUS: "MISCELLANEOUS",
  };

  function pillSource(source: Source): "SN" | "TWA" | "MISCELLANEOUS" {
    return source === "naturally" ? "SN" : source === "trueway" ? "TWA" : "MISCELLANEOUS";
  }

  function hasValue(value: string) {
    return Boolean(value && value !== "N/A");
  }

  const parameterDefinitions: Record<ParameterKey, string> = {
    handshape: "The specific configuration of the fingers and hand.",
    location:
      "The area on or near the body where the sign is produced, such as the forehead, chin, or neutral space.",
    movement:
      "The action of the hands, such as twisting, shaking, or moving in a specific direction.",
    palmOrientation: "The direction in which the palm faces.",
    nonManualSignals:
      "Facial expressions, head movements, or body language that convey grammatical information or emotion.",
  };

  let selectedSource = $state<Source | null>(null);
  let selectedUnitId = $state<string | null>(null);
  let searchQuery = $state("");
  let selectedCardId = $state<string | null>(null);
  let currentPage = $state(1);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let retrying = $state(false);
  let retryFailed = $state(false);
  const isLoading = $derived(
    retrying || navigating?.to?.url.pathname === page.url.pathname,
  );

  function selectSource(source: Source) {
    selectedSource = selectedSource === source ? null : source;
    selectedUnitId = null;
    navigateTo(selectedSource, null, 1, searchQuery);
  }

  function selectUnit(unitId: string) {
    selectedUnitId = selectedUnitId === unitId ? null : unitId;
    navigateTo(selectedSource, selectedUnitId, 1, searchQuery);
  }

  function navigateTo(
    source: Source | null,
    unit: string | null,
    page: number,
    search: string,
  ) {
    const params = new URLSearchParams();
    const book = source ? bookIdToName[source] : "";
    if (book) params.set("book", book);
    if (unit) params.set("unit", unit);
    if (search.trim()) params.set("search", search.trim());
    if (page > 1) params.set("page", String(page));
    goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
  }

  function handleSearchInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      navigateTo(selectedSource, selectedUnitId, 1, searchQuery);
    }, 250);
  }

  async function retryLoading() {
    retrying = true;
    retryFailed = false;
    try {
      await invalidateAll();
    } catch (cause) {
      console.error("Failed to retry dictionary load", cause);
      retryFailed = true;
    } finally {
      retrying = false;
    }
  }

  const bookIdToName: Record<string, string> = {
    naturally: "Signing Naturally",
    trueway: "True Way ASL",
    miscellaneous: "MISCELLANEOUS",
  };

  const visibleUnits = $derived(
    selectedSource
      ? (data?.unitsByBook?.[bookIdToName[selectedSource]] ?? [])
      : [],
  );

  const wordCards = $derived(
    data.signs.map((sign: any) => ({
      id: String(sign.id),
      sourceId: bookToSourceId[sign.books[0]?.book ?? ""] ?? "miscellaneous",
      sourceLabel: sourceDisplayNames[sign.books[0]?.book ?? "MISCELLANEOUS"] ?? "MISCELLANEOUS",
      unitId: sign.books[0]?.unit ?? "uncategorized",
      unitName: sign.books[0]?.unit ?? "Uncategorized",
      word: sign.word,
      gloss: sign.gloss,
      gifUrl: sign.gifUrl,
      parameters: sign.parameters,
    })) as WordCard[],
  );

  const totalPages = $derived(data.totalPages);
  const paginatedWordCards = $derived(wordCards);

  $effect(() => {
    selectedSource = data.filters.book
      ? (Object.entries(bookIdToName).find(([, name]) => name === data.filters.book)?.[0] as Source | undefined) ?? null
      : null;
    selectedUnitId = data.filters.unit || null;
    searchQuery = data.filters.search;
    currentPage = data.page;
  });

  $effect(() => {
    if (
      selectedCardId &&
      !wordCards.find((card: WordCard) => card.id === selectedCardId)
    ) {
      selectedCardId = null;
    }
  });

  const selectedCard = $derived(
    wordCards.find((card: WordCard) => card.id === selectedCardId) ??
      null,
  );
</script>

<svelte:head>
  <title>Sign Gallery | ASL Department Dictionary</title>
  <meta
    name="description"
    content="Browse and search animated American Sign Language signs by word, source, and unit."
  />
</svelte:head>

<div class="container-fluid">
  <div class="row">
    <aside
      class="col-12 col-md-4 col-lg-3 p-3 sidebar-panel"
      aria-label="Browse signs by source and unit"
    >
      <div class="d-flex flex-column gap-3">
        {#each sources as source (source.id)}
          <button
            type="button"
            class="source-btn"
            data-source={source.id === "naturally" ? "SN" : source.id === "trueway" ? "TWA" : "MISCELLANEOUS"}
            aria-pressed={selectedSource === source.id}
            onclick={() => selectSource(source.id)}
            transition:fade={{ duration: 250 }}
            animate:flip={{ duration: 400 }}
          >
            <svg class="source-btn-glyph" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
              {#if source.id === "naturally"}
                <circle cx="5" cy="5" r="4.5" fill="currentColor" />
              {:else if source.id === "trueway"}
                <path d="M5 .5 9.5 5 5 9.5.5 5z" fill="currentColor" />
              {:else}
                <path d="M5 .8 9.4 9.2H.6z" fill="currentColor" />
              {/if}
            </svg>
            {source.label}
          </button>
        {/each}

        {#if selectedSource}
          <fieldset
            class="unit-panel"
            in:slide={{ duration: 260, easing: cubicOut }}
            out:fade={{ duration: 180 }}
          >
            <hr class="my-2" />
            <legend class="h6 fw-bold mb-1 section-label">Units</legend>
            {#key selectedSource}
              <div
                class="d-flex flex-column gap-2 unit-list"
                in:fade={{ duration: 320, delay: 180 }}
                out:fade={{ duration: 240 }}
              >
                {#each visibleUnits as unit}
                  <button
                    class="btn text-start nav-button {selectedUnitId === unit
                      ? 'btn-dark'
                      : 'btn-outline-dark'}"
                    aria-pressed={selectedUnitId === unit}
                    onclick={() => selectUnit(unit)}
                    in:fade={{ duration: 280, delay: 220 }}
                    out:fade={{ duration: 220 }}
                  >
                    {unit}
                  </button>
                {/each}
              </div>
            {/key}
          </fieldset>
        {/if}
      </div>
    </aside>

    <main class="col p-4 overflow-hidden">
      <div
        in:fly={{ y: 18, duration: 500, opacity: 0 }}
        out:fade={{ duration: 300 }}
      >
        <div
          class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-2 mb-2"
        >
          <h1 class="h4 m-0 content-title">Sign Gallery</h1>
          <input
            type="search"
            class="form-control gallery-search"
            placeholder="Search signs..."
            bind:value={searchQuery}
            oninput={handleSearchInput}
            aria-label="Search signs"
          />
        </div>
        {#if data.loadError || retryFailed}
          <div class="border rounded p-3 mb-3" role="alert">
            <p class="mb-2">
              {data.loadError ?? 'We couldn’t retrieve signs. Check your connection and try again.'}
            </p>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              onclick={retryLoading}
              disabled={retrying}
            >
              {retrying ? 'Retrying…' : 'Try again'}
            </button>
          </div>
        {:else if isLoading}
          <div
            class="border rounded p-3 mb-3 d-flex align-items-center gap-2"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span>Retrieving signs…</span>
          </div>
        {:else}
          <p class="text-muted content-subtitle mb-3" role="status" aria-live="polite" aria-atomic="true">
            {#if searchQuery.trim() && selectedSource && selectedUnitId}
              Showing {data.total} item(s) matching "{searchQuery.trim()}"
              in the selected source and unit.
            {:else if searchQuery.trim() && selectedSource}
              Showing {data.total} item(s) matching "{searchQuery.trim()}"
              in the selected source.
            {:else if searchQuery.trim()}
              Showing {data.total} item(s) matching "{searchQuery.trim()}".
            {:else if selectedSource && selectedUnitId}
              Showing {data.total} item(s) from the selected source and
              unit.
            {:else if selectedSource}
              Showing {data.total} item(s) from the selected source.
            {:else}
              Showing all {data.total} item(s).
            {/if}
          </p>

        {#if selectedCard}
          <section class="border rounded p-3 mb-3 selected-sign-panel" aria-labelledby="selected-sign-heading">
            <div class="row g-3">
              <div class="col-12 col-lg-6">
                <SignMedia src={selectedCard.gifUrl} word={selectedCard.word} variant="detail" />
              </div>
              <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                <h2 id="selected-sign-heading" class="h5 m-0">{selectedCard.word}</h2>
                {#if hasValue(selectedCard.gloss)}<div class="small">{selectedCard.gloss}</div>{/if}
                <div><SourcePill source={pillSource(selectedCard.sourceId)} /></div>
                {#if hasValue(selectedCard.unitName)}
                  <div><CategoryPill category={selectedCard.unitName} /></div>
                {/if}
                <hr class="my-2" />
                {#if hasValue(selectedCard.parameters.handshape)}<div class="small">
                  <strong
                    class="parameter-label"
                    title={parameterDefinitions.handshape}>Handshape:</strong
                  >
                  {selectedCard.parameters.handshape}
                </div>{/if}
                {#if hasValue(selectedCard.parameters.location)}<div class="small">
                  <strong
                    class="parameter-label"
                    title={parameterDefinitions.location}>Location:</strong
                  >
                  {selectedCard.parameters.location}
                </div>{/if}
                {#if hasValue(selectedCard.parameters.movement)}<div class="small">
                  <strong
                    class="parameter-label"
                    title={parameterDefinitions.movement}>Movement:</strong
                  >
                  {selectedCard.parameters.movement}
                </div>{/if}
                {#if hasValue(selectedCard.parameters.palmOrientation)}<div class="small">
                  <strong
                    class="parameter-label"
                    title={parameterDefinitions.palmOrientation}
                    >Palm Orientation:</strong
                  >
                  {selectedCard.parameters.palmOrientation}
                </div>{/if}
                {#if hasValue(selectedCard.parameters.nonManualSignals)}<div class="small">
                  <strong
                    class="parameter-label"
                    title={parameterDefinitions.nonManualSignals}
                    >Non-Manual Signals:</strong
                  >
                  {selectedCard.parameters.nonManualSignals}
                </div>{/if}
              </div>
            </div>
          </section>
        {/if}

        {#if data.signs.length === 0}
          <div class="border rounded p-3" role="status" aria-live="polite">
            <h2 class="h5">No signs found</h2>
            <p class="mb-0">No signs match these filters. Try a different search or change the selected source or unit.</p>
          </div>
        {:else}
          <h2 class="visually-hidden">Signs</h2>
          <div class="cards-scroll">
            <div class="row g-3 cards-grid">
              {#each paginatedWordCards as card (card.id)}
                <div class="col-12 col-sm-6 col-xl-4 d-flex flex-column">
                  <button
                    type="button"
                    class="border rounded p-3 flex-grow-1 d-flex flex-column gap-2 gif-card card-button {selectedCardId ===
                    card.id
                      ? 'selected-card'
                      : ''}"
                    onclick={() =>
                      (selectedCardId =
                        selectedCardId === card.id ? null : card.id)}
                    aria-pressed={selectedCardId === card.id}
                  >
                    <SignMedia src={card.gifUrl} word={card.word} variant="thumbnail" />
                    <div class="word-button fw-semibold">{card.word}</div>
                    {#if hasValue(card.gloss)}<div class="small">{card.gloss}</div>{/if}
                    <div><SourcePill source={pillSource(card.sourceId)} /></div>
                    {#if hasValue(card.unitName)}
                      <div><CategoryPill category={card.unitName} /></div>
                    {/if}
                  </button>
                  <a class="btn btn-outline-secondary sign-card-link mt-2" href={`/sign/${card.id}`}>
                    View full sign entry
                  </a>
                </div>
              {/each}
            </div>
          </div>
          {#if totalPages > 1}
            <nav class="d-flex align-items-center justify-content-center gap-3 mt-4" aria-label="Gallery pages">
              <button
                type="button"
                class="btn btn-outline-dark btn-sm"
                disabled={currentPage === 1}
                aria-label="Go to previous page"
                onclick={() => navigateTo(selectedSource, selectedUnitId, currentPage - 1, searchQuery)}
              >
                Previous
              </button>
              <span class="small text-muted">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                class="btn btn-outline-dark btn-sm"
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
                onclick={() => navigateTo(selectedSource, selectedUnitId, currentPage + 1, searchQuery)}
              >
                Next
              </button>
            </nav>
          {/if}
        {/if}
        {/if}

      </div>
    </main>
  </div>
</div>

<style>
  .sidebar-panel {
    min-height: auto;
  }

  .section-label,
  .content-subtitle {
    font-size: clamp(0.9rem, 0.84rem + 0.22vw, 1.05rem);
  }

  .content-title {
    font-size: clamp(1.1rem, 0.95rem + 0.6vw, 1.5rem);
  }

  .nav-button,
  .word-button {
    font-size: clamp(0.9rem, 0.85rem + 0.25vw, 1.05rem);
    padding: clamp(0.4rem, 0.35rem + 0.2vw, 0.6rem)
      clamp(0.6rem, 0.5rem + 0.35vw, 0.9rem);
  }

  .gif-card {
    background-color: var(--ocean-surface);
  }

  .card-button {
    text-align: left;
    width: 100%;
  }

  .selected-card {
    border-color: var(--bs-primary) !important;
    box-shadow: 0 0 0 0.2rem
      color-mix(in srgb, var(--bs-primary) 20%, transparent);
  }

  .selected-sign-panel {
    background-color: var(--bs-body-bg);
  }

  .gallery-search {
    max-width: 320px;
    font-size: clamp(0.9rem, 0.85rem + 0.25vw, 1.05rem);
  }

  .cards-scroll {
    max-height: 72vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 0.25rem;
  }

  .cards-grid {
    margin-left: 0;
    margin-right: 0;
  }

  .unit-panel,
  .section-label {
    color: var(--bs-black);
  }
 
  .unit-list,
  .btn-outline-dark {
    --bs-btn-color: var(--ocean-text);
    --bs-btn-border-color: var(--ocean-border);
    --bs-btn-hover-color: var(--ocean-bg);
    --bs-btn-hover-bg: var(--ocean-accent);
    --bs-btn-hover-border-color: var(--ocean-accent);
    --bs-btn-active-color: var(--ocean-text);
    --bs-btn-active-bg: var(--ocean-bg);
    --bs-btn-active-border-color: var(--ocean-text);
  }

  .unit-list,
  .btn-dark {
    --bs-btn-color: var(--ocean-bg);
    --bs-btn-bg: var(--ocean-accent);
    --bs-btn-border-color: var(--ocean-accent);
    --bs-btn-hover-color: var(--ocean-bg);
    --bs-btn-hover-bg: var(--ocean-accent);
    --bs-btn-hover-border-color: var(--ocean-accent);
    --bs-btn-active-color: var(--ocean-bg);
    --bs-btn-active-bg: var(--ocean-accent);
    --bs-btn-active-border-color: var(--ocean-accent);
  }

  .parameter-label {
    cursor: help;
    text-decoration: underline dotted;
    text-underline-offset: 0.1em;
  }

  @media (min-width: 768px) {
    .sidebar-panel {
      min-height: 100vh;
    }
  }
</style>
