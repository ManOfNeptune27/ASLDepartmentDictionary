<script lang="ts">
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly, slide } from 'svelte/transition';
  import { sourceData, sources, type Source } from '$lib';

  type WordCard = {
    id: string;
    sourceId: Source;
    sourceLabel: string;
    unitId: string;
    unitName: string;
    word: string;
    parameters: {
      handshape: string;
      location: string;
      movement: string;
      palmOrientation: string;
      nonManualSignals: string;
    };
  };

  type ParameterKey = 'handshape' | 'location' | 'movement' | 'palmOrientation' | 'nonManualSignals';

  const parameterDefinitions: Record<ParameterKey, string> = {
    handshape: 'The specific configuration of the fingers and hand.',
    location: 'The area on or near the body where the sign is produced, such as the forehead, chin, or neutral space.',
    movement: 'The action of the hands, such as twisting, shaking, or moving in a specific direction.',
    palmOrientation: 'The direction in which the palm faces.',
    nonManualSignals: 'Facial expressions, head movements, or body language that convey grammatical information or emotion.'
  };

  let selectedSource: Source | null = null;
  let selectedUnitId: string | null = null;
  let searchQuery = '';
  let selectedCardId: string | null = null;

  function selectSource(source: Source) {
    selectedSource = selectedSource === source ? null : source;
    selectedUnitId = null;
  }

  function selectUnit(unitId: string) {
    selectedUnitId = selectedUnitId === unitId ? null : unitId;
  }

  $: visibleUnits = selectedSource ? sourceData[selectedSource].units : [];
  $: allWordCards = sources.flatMap((source) =>
    sourceData[source.id].units.flatMap((unit) =>
      unit.words.map((word) => ({
        id: `${unit.id}-${word}`,
        sourceId: source.id,
        sourceLabel: source.label,
        unitId: unit.id,
        unitName: unit.name,
        word,
        parameters: {
          handshape: 'Not added yet',
          location: 'Not added yet',
          movement: 'Not added yet',
          palmOrientation: 'Not added yet',
          nonManualSignals: 'Not added yet'
        }
      }))
    )
  ) as WordCard[];
  $: filteredWordCards = allWordCards
    .filter((card) => {
      if (selectedSource && card.sourceId !== selectedSource) return false;
      if (selectedUnitId && card.unitId !== selectedUnitId) return false;
      if (searchQuery.trim() && !card.word.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
      return true;
    })
    .sort((firstCard, secondCard) => firstCard.word.localeCompare(secondCard.word, undefined, { sensitivity: 'base' }));
  $: {
    if (selectedCardId && !filteredWordCards.find((card) => card.id === selectedCardId)) {
      selectedCardId = null;
    }
  }
  $: selectedCard = filteredWordCards.find((card) => card.id === selectedCardId) ?? null;

</script>

<div class="container-fluid">
  <div class="row">
    <aside class="col-12 col-md-4 col-lg-3 p-3 sidebar-panel" style="background-color: rgb(210, 210, 210);">
      <div class="d-flex flex-column gap-3">
        {#each sources as source (source.id)}
          <button
            class="btn text-start nav-button {selectedSource === source.id ? 'btn-primary' : 'btn-outline-primary'}"
            on:click={() => selectSource(source.id)}
            transition:fade={{ duration: 250 }}
            animate:flip={{ duration: 400 }}
          >
            {source.label}
          </button>
        {/each}

        {#if selectedSource}
          <div class="unit-panel" in:slide={{ duration: 260, easing: cubicOut }} out:fade={{ duration: 180 }}>
            <hr class="my-2" />
            <p class="fw-bold mb-1 section-label">Units</p>
            {#key selectedSource}
              <div
                class="d-flex flex-column gap-2 unit-list"
                in:fade={{ duration: 320, delay: 180 }}
                out:fade={{ duration: 240 }}
              >
                {#each visibleUnits as unit (unit.id)}
                  <button
                    class="btn text-start nav-button {selectedUnitId === unit.id ? 'btn-dark' : 'btn-outline-dark'}"
                    on:click={() => selectUnit(unit.id)}
                    in:fade={{ duration: 280, delay: 220 }}
                    out:fade={{ duration: 220 }}
                  >
                    {unit.name}
                  </button>
                {/each}
              </div>
            {/key}
          </div>
        {/if}
      </div>
    </aside>

    <main class="col p-4 overflow-hidden">
      <div in:fly={{ y: 18, duration: 500, opacity: 0 }} out:fade={{ duration: 300 }}>
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-2 mb-2">
          <h2 class="h4 m-0 content-title">Sign Gallery</h2>
          <input
            type="search"
            class="form-control gallery-search"
            placeholder="Search signs..."
            bind:value={searchQuery}
            aria-label="Search signs"
          />
        </div>
        <p class="text-muted content-subtitle mb-3">
          {#if searchQuery.trim() && selectedSource && selectedUnitId}
            Showing {filteredWordCards.length} item(s) matching “{searchQuery.trim()}” in the selected source and unit.
          {:else if searchQuery.trim() && selectedSource}
            Showing {filteredWordCards.length} item(s) matching “{searchQuery.trim()}” in the selected source.
          {:else if searchQuery.trim()}
            Showing {filteredWordCards.length} item(s) matching “{searchQuery.trim()}”.
          {:else if selectedSource && selectedUnitId}
            Showing {filteredWordCards.length} item(s) from the selected source and unit.
          {:else if selectedSource}
            Showing {filteredWordCards.length} item(s) from the selected source.
          {:else}
            Showing all {filteredWordCards.length} item(s).
          {/if}
        </p>

        {#if selectedCard}
          <div class="border rounded p-3 mb-3 selected-sign-panel">
            <div class="row g-3">
              <div class="col-12 col-lg-6">
                <div class="gif-placeholder gif-placeholder-large d-flex align-items-center justify-content-center text-muted">
                  GIF coming soon
                </div>
              </div>
              <div class="col-12 col-lg-6 d-flex flex-column gap-2">
                <h3 class="h5 m-0">{selectedCard.word}</h3>
                <div class="small text-muted">{selectedCard.sourceLabel}</div>
                <div class="small text-muted">{selectedCard.unitName}</div>
                <hr class="my-2" />
                <div class="small">
                  <strong class="parameter-label" title={parameterDefinitions.handshape}>Handshape:</strong>
                  {selectedCard.parameters.handshape}
                </div>
                <div class="small">
                  <strong class="parameter-label" title={parameterDefinitions.location}>Location:</strong>
                  {selectedCard.parameters.location}
                </div>
                <div class="small">
                  <strong class="parameter-label" title={parameterDefinitions.movement}>Movement:</strong>
                  {selectedCard.parameters.movement}
                </div>
                <div class="small">
                  <strong class="parameter-label" title={parameterDefinitions.palmOrientation}>Palm Orientation:</strong>
                  {selectedCard.parameters.palmOrientation}
                </div>
                <div class="small">
                  <strong class="parameter-label" title={parameterDefinitions.nonManualSignals}>Non-Manual Signals:</strong>
                  {selectedCard.parameters.nonManualSignals}
                </div>
              </div>
            </div>
          </div>
        {/if}

        {#if filteredWordCards.length === 0}
          <p class="text-muted">No items match this filter yet.</p>
        {:else}
          <div class="cards-scroll">
            <div class="row g-3 cards-grid">
              {#each filteredWordCards as card (card.id)}
                <div class="col-12 col-sm-6 col-xl-4">
                  <button
                    type="button"
                    class="border rounded p-3 h-100 d-flex flex-column gap-2 gif-card card-button {selectedCardId === card.id ? 'selected-card' : ''}"
                    on:click={() => (selectedCardId = selectedCardId === card.id ? null : card.id)}
                  >
                    <div class="gif-placeholder d-flex align-items-center justify-content-center text-muted">
                      GIF coming soon
                    </div>
                    <div class="word-button fw-semibold">{card.word}</div>
                    <div class="small text-muted">{card.sourceLabel}</div>
                    <div class="small text-muted">{card.unitName}</div>
                  </button>
                </div>
              {/each}
            </div>
          </div>
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
    padding: clamp(0.4rem, 0.35rem + 0.2vw, 0.6rem) clamp(0.6rem, 0.5rem + 0.35vw, 0.9rem);
  }

  .gif-card {
    background-color: var(--bs-body-bg);
  }

  .card-button {
    text-align: left;
    width: 100%;
  }

  .selected-card {
    border-color: var(--bs-primary) !important;
    box-shadow: 0 0 0 0.2rem color-mix(in srgb, var(--bs-primary) 20%, transparent);
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

  .unit-panel .section-label {
    color: var(--bs-black);
  }

  .unit-list .btn-outline-dark {
    --bs-btn-color: var(--bs-black);
    --bs-btn-border-color: var(--bs-black);
    --bs-btn-hover-color: var(--bs-white);
    --bs-btn-hover-bg: var(--bs-black);
    --bs-btn-hover-border-color: var(--bs-black);
    --bs-btn-active-color: var(--bs-white);
    --bs-btn-active-bg: var(--bs-black);
    --bs-btn-active-border-color: var(--bs-black);
  }

  .unit-list .btn-dark {
    --bs-btn-bg: var(--bs-black);
    --bs-btn-border-color: var(--bs-black);
    --bs-btn-hover-bg: var(--bs-black);
    --bs-btn-hover-border-color: var(--bs-black);
    --bs-btn-active-bg: var(--bs-black);
    --bs-btn-active-border-color: var(--bs-black);
  }

  .parameter-label {
    cursor: help;
    text-decoration: underline dotted;
    text-underline-offset: 0.1em;
  }

  .gif-placeholder {
    min-height: 160px;
    border: 1px dashed var(--bs-border-color);
    border-radius: 0.4rem;
    font-size: clamp(0.85rem, 0.8rem + 0.2vw, 1rem);
  }

  .gif-placeholder-large {
    min-height: 240px;
  }

  @media (min-width: 768px) {
    .sidebar-panel {
      min-height: 100vh;
    }
  }
</style>