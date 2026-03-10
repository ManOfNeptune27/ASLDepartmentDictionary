<script lang="ts">
  let { form } = $props();
  const ADD_NEW_UNIT_VALUE = '__add_new_unit__';

  const bookOptions = [
    { value: 'Signing Naturally', label: 'Signing naturally' },
    { value: 'True Way ASL', label: 'True Way ASL' },
    { value: 'MISCELLANEOUS', label: 'MISCELLANEOUS' }
  ];

  const unitOptionsByBook: Record<string, string[]> = {
    'Signing Naturally': ['Unit 1: Greetings', 'Unit 2: Family', 'Unit 3: School'],
    'True Way ASL': ['Unit 1: Basics', 'Unit 2: Numbers', 'Unit 3: Food'],
    MISCELLANEOUS: []
  };

  const PAIR_SEP = '|||';

  let selectedBooks = $state<string[]>([]);
  let unitSelectionByBook = $state<Record<string, string>>({});
  let newUnitByBook = $state<Record<string, string>>({});

  $effect(() => {
    if (form?.values) {
      selectedBooks = Array.isArray(form.values.books) ? form.values.books : [];
      const pairs: string[] = Array.isArray(form.values.bookUnitPairs) ? form.values.bookUnitPairs : [];
      const selMap: Record<string, string> = {};
      const newMap: Record<string, string> = {};
      for (const pair of pairs) {
        const parts = pair.split(PAIR_SEP);
        const book = parts[0];
        const unit = parts[1] ?? '';
        const custom = parts[2] ?? '';
        if (book) {
          selMap[book] = unit;
          if (unit === ADD_NEW_UNIT_VALUE) newMap[book] = custom;
        }
      }
      unitSelectionByBook = selMap;
      newUnitByBook = newMap;
    }
  });

  // Clean up unit selections when a book is unchecked
  $effect(() => {
    const booksSet = new Set(selectedBooks);
    const stale = Object.keys(unitSelectionByBook).filter((b) => !booksSet.has(b));
    if (stale.length > 0) {
      const next = { ...unitSelectionByBook };
      for (const b of stale) delete next[b];
      unitSelectionByBook = next;
    }
  });

  // Hidden input values — one per selected book
  const bookUnitPairs = $derived(
    selectedBooks.map((book) => {
      const sel = unitSelectionByBook[book] ?? '';
      if (sel === ADD_NEW_UNIT_VALUE) {
        return `${book}${PAIR_SEP}${ADD_NEW_UNIT_VALUE}${PAIR_SEP}${newUnitByBook[book] ?? ''}`;
      }
      return `${book}${PAIR_SEP}${sel}`;
    })
  );
</script>

<main class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-9">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h2 class="h4 m-0">Teacher Admin Upload</h2>
        <a class="btn btn-sm btn-outline-secondary" href="/logout">Log Out</a>
      </div>
      <p class="text-muted mb-4">Add a sign GIF and its ASL metadata.</p>

      {#if form?.success && form?.submission}
        <div class="alert alert-success" role="alert">
          <div class="fw-semibold">{form.message}</div>
          <div class="small mt-2">
            Saved payload preview: {form.submission.word} — {form.submission.gloss} ({form.submission.gifFileName})<br />
            {#each form.submission.bookUnitPairs as pair}
              <span class="badge bg-secondary me-1">{pair.book} → {pair.unit}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if form?.duplicateNotice}
        <div class="alert alert-warning" role="alert">
          <div class="fw-semibold">Possible duplicate found</div>
          <div class="small mt-1">{form.duplicateNotice}</div>
        </div>
      {/if}

      <form method="POST" enctype="multipart/form-data" class="border rounded p-3 p-md-4 d-flex flex-column gap-3">
        <div>
          <label class="form-label" for="word">Word</label>
          <input
            id="word"
            name="word"
            class="form-control {form?.errors?.word ? 'is-invalid' : ''}"
            value={form?.values?.word ?? ''}
            required
          />
          {#if form?.errors?.word}
            <div class="invalid-feedback d-block">{form.errors.word}</div>
          {/if}
        </div>

        <div>
          <label class="form-label" for="gloss">Gloss</label>
          <input
            id="gloss"
            name="gloss"
            class="form-control {form?.errors?.gloss ? 'is-invalid' : ''}"
            value={form?.values?.gloss ?? ''}
            required
          />
          {#if form?.errors?.gloss}
            <div class="invalid-feedback d-block">{form.errors.gloss}</div>
          {/if}
        </div>

        <div>
          <fieldset>
            <legend class="form-label d-block">Books</legend>
            <div class="border rounded p-2 {form?.errors?.books ? 'border-danger' : ''}">
              {#each bookOptions as option}
                <div class="form-check">
                  <input
                    id={`book-${option.value}`}
                    name="books"
                    type="checkbox"
                    class="form-check-input"
                    value={option.value}
                    bind:group={selectedBooks}
                  />
                  <label class="form-check-label" for={`book-${option.value}`}>{option.label}</label>
                </div>
              {/each}
            </div>
            {#if form?.errors?.books}
              <div class="invalid-feedback d-block">{form.errors.books}</div>
            {/if}
            <div class="form-text">Select all books where this same sign appears.</div>
          </fieldset>
        </div>

        {#if selectedBooks.length > 0}
          <div>
            <p class="form-label mb-2">Units</p>
            <div class="d-flex flex-column gap-2 {form?.errors?.bookUnitPairs ? 'is-invalid' : ''}">
              {#each selectedBooks as book}
                {@const bookId = book.replace(/\s+/g, '-').toLowerCase()}
                {@const isAddingNew = (unitSelectionByBook[book] ?? '') === ADD_NEW_UNIT_VALUE}
                <div class="border rounded p-2">
                  <label class="form-label mb-1 fw-semibold" for={`unit-${bookId}`}>{book}</label>
                  <select
                    id={`unit-${bookId}`}
                    class="form-select form-select-sm"
                    bind:value={unitSelectionByBook[book]}
                    required
                  >
                    <option value="">Select unit for {book}</option>
                    {#each unitOptionsByBook[book] ?? [] as unitOption}
                      <option value={unitOption}>{unitOption}</option>
                    {/each}
                    <option value={ADD_NEW_UNIT_VALUE}>+ Add a new unit</option>
                  </select>
                  {#if isAddingNew}
                    <input
                      class="form-control form-control-sm mt-2"
                      bind:value={newUnitByBook[book]}
                      placeholder="Example: Unit 4: Community"
                      required
                    />
                    <div class="form-text">Enter the new unit name for {book}.</div>
                  {/if}
                </div>
              {/each}
            </div>
            {#if form?.errors?.bookUnitPairs}
              <div class="invalid-feedback d-block">{form.errors.bookUnitPairs}</div>
            {/if}
          </div>
        {/if}

        {#each bookUnitPairs as pair}
          <input type="hidden" name="bookUnitPair" value={pair} />
        {/each}

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="handshape">Handshape</label>
            <input
              id="handshape"
              name="handshape"
              class="form-control {form?.errors?.handshape ? 'is-invalid' : ''}"
              value={form?.values?.handshape ?? ''}
              required
            />
            {#if form?.errors?.handshape}
              <div class="invalid-feedback d-block">{form.errors.handshape}</div>
            {/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="location">Location</label>
            <input
              id="location"
              name="location"
              class="form-control {form?.errors?.location ? 'is-invalid' : ''}"
              value={form?.values?.location ?? ''}
              required
            />
            {#if form?.errors?.location}
              <div class="invalid-feedback d-block">{form.errors.location}</div>
            {/if}
          </div>
        </div>

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="movement">Movement</label>
            <input
              id="movement"
              name="movement"
              class="form-control {form?.errors?.movement ? 'is-invalid' : ''}"
              value={form?.values?.movement ?? ''}
              required
            />
            {#if form?.errors?.movement}
              <div class="invalid-feedback d-block">{form.errors.movement}</div>
            {/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="palmOrientation">Palm Orientation</label>
            <input
              id="palmOrientation"
              name="palmOrientation"
              class="form-control {form?.errors?.palmOrientation ? 'is-invalid' : ''}"
              value={form?.values?.palmOrientation ?? ''}
              required
            />
            {#if form?.errors?.palmOrientation}
              <div class="invalid-feedback d-block">{form.errors.palmOrientation}</div>
            {/if}
          </div>
        </div>

        <div>
          <label class="form-label" for="nonManualSignals">Non-Manual Signals</label>
          <input
            id="nonManualSignals"
            name="nonManualSignals"
            class="form-control {form?.errors?.nonManualSignals ? 'is-invalid' : ''}"
            value={form?.values?.nonManualSignals ?? ''}
            required
          />
          {#if form?.errors?.nonManualSignals}
            <div class="invalid-feedback d-block">{form.errors.nonManualSignals}</div>
          {/if}
        </div>

        <div>
          <label class="form-label" for="gif">GIF Upload</label>
          <input id="gif" name="gif" type="file" accept="image/gif" class="form-control {form?.errors?.gif ? 'is-invalid' : ''}" required />
          <div class="form-text">Only .gif files are accepted in this base version.</div>
          {#if form?.errors?.gif}
            <div class="invalid-feedback d-block">{form.errors.gif}</div>
          {/if}
        </div>

        <div class="form-check">
          <input
            id="allowDuplicate"
            name="allowDuplicate"
            type="checkbox"
            class="form-check-input"
            value="true"
            checked={form?.values?.allowDuplicate === 'true'}
          />
          <label class="form-check-label" for="allowDuplicate">
            Allow duplicate / alternate version of this sign
          </label>
          <div class="form-text">Use this only when the same word has a valid second version.</div>
        </div>

        <button type="submit" class="btn btn-primary align-self-start">Submit Entry</button>
      </form>
    </div>
  </div>
</main>