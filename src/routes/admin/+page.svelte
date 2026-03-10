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

  let selectedBooks = $state<string[]>([]);
  let selectedUnit = $state('');
  let newUnit = $state('');

  $effect(() => {
    if (form?.values) {
      selectedBooks = Array.isArray(form.values.books) ? form.values.books : [];
      selectedUnit = form.values.unit ?? '';
      newUnit = form.values.newUnit ?? '';
    }
  });

  const availableUnits = $derived(
    [...new Set(selectedBooks.flatMap((book) => unitOptionsByBook[book] ?? []))].sort((a, b) => a.localeCompare(b))
  );
  const isAddingNewUnit = $derived(selectedUnit === ADD_NEW_UNIT_VALUE);

  $effect(() => {
    if (selectedUnit && selectedUnit !== ADD_NEW_UNIT_VALUE && !availableUnits.includes(selectedUnit)) {
      selectedUnit = '';
    }
  });
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
            Saved payload preview: {form.submission.word} — {form.submission.gloss}
            ({form.submission.books.join(', ')} | {form.submission.unit} | {form.submission.gifFileName})
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

        <div class="row g-3">
          <div class="col-12 col-md-6">
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
          <div class="col-12 col-md-6">
            <label class="form-label" for="unit">Unit</label>
            <select
              id="unit"
              name="unit"
              class="form-select {form?.errors?.unit ? 'is-invalid' : ''}"
              bind:value={selectedUnit}
              disabled={selectedBooks.length === 0}
              required
            >
              <option value="">{selectedBooks.length === 0 ? 'Select at least one book first' : 'Select unit'}</option>
              {#each availableUnits as unitOption}
                <option value={unitOption}>{unitOption}</option>
              {/each}
              <option value={ADD_NEW_UNIT_VALUE}>+ Add a new unit</option>
            </select>
            {#if form?.errors?.unit}
              <div class="invalid-feedback d-block">{form.errors.unit}</div>
            {/if}
          </div>
        </div>

        {#if isAddingNewUnit}
          <div>
            <label class="form-label" for="newUnit">New Unit Name</label>
            <input
              id="newUnit"
              name="newUnit"
              class="form-control {form?.errors?.newUnit ? 'is-invalid' : ''}"
              bind:value={newUnit}
              placeholder="Example: Unit 4: Community"
              required
            />
            {#if form?.errors?.newUnit}
              <div class="invalid-feedback d-block">{form.errors.newUnit}</div>
            {/if}
            <div class="form-text">Use this when the unit is not listed yet.</div>
          </div>
        {/if}

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