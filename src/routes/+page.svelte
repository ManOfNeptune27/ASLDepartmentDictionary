<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade, fly, slide } from 'svelte/transition';

  type Source = 'spread' | 'trueway';
  type Unit = {
    id: string;
    name: string;
    words: string[];
  };

  const sourceData: Record<Source, { label: string; units: Unit[] }> = {
    spread: {
      label: 'Spread the Sign',
      units: [
        { id: 'spread-u1', name: 'Unit 1: Greetings', words: ['Hello', 'Good Morning', 'How Are You'] },
        { id: 'spread-u2', name: 'Unit 2: Family', words: ['Mother', 'Father', 'Sister', 'Brother'] },
        { id: 'spread-u3', name: 'Unit 3: School', words: ['Teacher', 'Student', 'Class', 'Homework'] }
      ]
    },
    trueway: {
      label: 'TRUE WAY ASL',
      units: [
        { id: 'trueway-u1', name: 'Unit 1: Basics', words: ['Name', 'Nice', 'Meet', 'You'] },
        { id: 'trueway-u2', name: 'Unit 2: Numbers', words: ['One', 'Two', 'Three', 'Ten'] },
        { id: 'trueway-u3', name: 'Unit 3: Food', words: ['Eat', 'Drink', 'Apple', 'Water'] }
      ]
    }
  };

  let selectedSource: Source | null = null;
  let selectedUnitId: string | null = null;
  const sources: { id: Source; label: string }[] = [
    { id: 'spread', label: 'Spread the Sign' },
    { id: 'trueway', label: 'TRUE WAY ASL' }
  ];

  function selectSource(source: Source) {
    selectedSource = selectedSource === source ? null : source;
    selectedUnitId = null;
  }

  function selectUnit(unitId: string) {
    selectedUnitId = selectedUnitId === unitId ? null : unitId;
  }

  $: visibleUnits = selectedSource ? sourceData[selectedSource].units : [];
  $: selectedUnit = visibleUnits.find((unit) => unit.id === selectedUnitId) ?? null;
  $: visibleSources = sources.filter((source) => selectedSource === null || selectedSource === source.id);

</script>

<header class="text-white py-3" style="background-color: rgb(64, 64, 64);">
  <h1 class="text-center m-0">ASL Dictionary</h1>
</header>

<div class="container-fluid">
  <div class="row">
    <aside class="col-12 col-md-4 col-lg-3 p-3 min-vh-100" style="background-color: rgb(210, 210, 210);">
      <div class="d-flex flex-column gap-3">
        {#each visibleSources as source (source.id)}
          <button
            class="btn btn-primary text-start"
            on:click={() => selectSource(source.id)}
            transition:fade={{ duration: 250 }}
            animate:flip={{ duration: 400 }}
          >
            {source.label}
          </button>
        {/each}

        {#if selectedSource}
          <div transition:slide={{ duration: 300 }}>
            <hr class="my-2" />
            <p class="fw-bold mb-1">Units</p>
            <div class="d-flex flex-column gap-2">
              {#each visibleUnits as unit (unit.id)}
                <button
                  class="btn text-start {selectedUnitId === unit.id ? 'btn-dark' : 'btn-outline-dark'}"
                  on:click={() => selectUnit(unit.id)}
                  transition:fade={{ duration: 250 }}
                  animate:flip={{ duration: 400 }}
                >
                  {unit.name}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </aside>

    <main class="col p-4 overflow-hidden">
      {#if !selectedSource}
        <div in:fly={{ y: 18, duration: 500, opacity: 0 }} out:fade={{ duration: 300 }}>
          <h2 class="h4 mb-2">Choose a source</h2>
          <p class="text-muted">Click one button on the left to load units.</p>
        </div>
      {:else if selectedUnit}
        <div in:fly={{ y: 18, duration: 500, opacity: 0 }} out:fade={{ duration: 300 }}>
          <h2 class="h4 mb-3">{selectedUnit.name}</h2>
          <div class="d-flex flex-wrap gap-2">
            {#each selectedUnit.words as word}
              <button class="btn btn-outline-primary" transition:fade={{ duration: 250 }}>{word}</button>
            {/each}
          </div>
        </div>
      {/if}
    </main>
  </div>
</div>
