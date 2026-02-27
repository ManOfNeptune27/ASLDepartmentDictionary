<script lang="ts">
  let { form } = $props();

  const bookOptions = [
    { value: 'Signing Naturally', label: 'Signing naturally' },
    { value: 'True Way ASL', label: 'True Way ASL' },
    { value: 'MISCELLANEOUS', label: 'MISCELLANEOUS' }
  ];
</script>

<main class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-9">
      <h2 class="h4 mb-2">Teacher Admin Upload</h2>
      <p class="text-muted mb-4">Add a sign GIF and its ASL metadata.</p>

      {#if form?.success && form?.submission}
        <div class="alert alert-success" role="alert">
          <div class="fw-semibold">{form.message}</div>
          <div class="small mt-2">Saved payload preview: {form.submission.word} ({form.submission.gifFileName})</div>
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

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="book">Book</label>
            <select
              id="book"
              name="book"
              class="form-select {form?.errors?.book ? 'is-invalid' : ''}"
              required
            >
              <option value="">Select book</option>
              {#each bookOptions as option}
                <option value={option.value} selected={form?.values?.book === option.value}>{option.label}</option>
              {/each}
            </select>
            {#if form?.errors?.book}
              <div class="invalid-feedback d-block">{form.errors.book}</div>
            {/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="unit">Unit</label>
            <input
              id="unit"
              name="unit"
              type="number"
              min="1"
              step="1"
              class="form-control {form?.errors?.unit ? 'is-invalid' : ''}"
              value={form?.values?.unit ?? ''}
              required
            />
            {#if form?.errors?.unit}
              <div class="invalid-feedback d-block">{form.errors.unit}</div>
            {/if}
          </div>
        </div>

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

        <button type="submit" class="btn btn-primary align-self-start">Submit Entry</button>
      </form>
    </div>
  </div>
</main>