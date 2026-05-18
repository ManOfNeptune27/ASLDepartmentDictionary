<script lang="ts">
  let { form, data }: { form: any; data: any } = $props();
  const ADD_NEW_UNIT_VALUE = "__add_new_unit__";

  const bookOptions = [
    { value: "Signing Naturally", label: "Signing Naturally" },
    { value: "True Way ASL", label: "True Way ASL" },
    { value: "MISCELLANEOUS", label: "MISCELLANEOUS" },
  ];

  const PAIR_SEP = "|||";

  let selectedBooks = $state<string[]>([]);
  let unitSelectionByBook = $state<Record<string, string>>({});
  let newUnitByBook = $state<Record<string, string>>({});
  let deleteSearch = $state("");
  let uploading = $state(false);
  let uploadError = $state("");

  const filteredSigns = $derived(
    (data?.signs ?? []).filter((sign: any) =>
      sign.word.toLowerCase().includes(deleteSearch.toLowerCase()),
    ),
  );

  $effect(() => {
    if (form?.values) {
      selectedBooks = Array.isArray(form.values.books) ? form.values.books : [];
      const pairs: string[] = Array.isArray(form.values.bookUnitPairs)
        ? form.values.bookUnitPairs
        : [];
      const selMap: Record<string, string> = {};
      const newMap: Record<string, string> = {};
      for (const pair of pairs) {
        const parts = pair.split(PAIR_SEP);
        const book = parts[0];
        const unit = parts[1] ?? "";
        const custom = parts[2] ?? "";
        if (book) {
          selMap[book] = unit;
          if (unit === ADD_NEW_UNIT_VALUE) newMap[book] = custom;
        }
      }
      unitSelectionByBook = selMap;
      newUnitByBook = newMap;
    }
  });

  $effect(() => {
    const booksSet = new Set(selectedBooks);
    const stale = Object.keys(unitSelectionByBook).filter(
      (b) => !booksSet.has(b),
    );
    if (stale.length > 0) {
      const next = { ...unitSelectionByBook };
      for (const b of stale) delete next[b];
      unitSelectionByBook = next;
    }
  });

  const bookUnitPairs = $derived(
    selectedBooks.map((book) => {
      const sel = unitSelectionByBook[book] ?? "";
      if (sel === ADD_NEW_UNIT_VALUE) {
        return `${book}${PAIR_SEP}${ADD_NEW_UNIT_VALUE}${PAIR_SEP}${newUnitByBook[book] ?? ""}`;
      }
      return `${book}${PAIR_SEP}${sel}`;
    }),
  );

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    uploadError = "";

    const formEl = e.target as HTMLFormElement;
    const formData = new FormData(formEl);
    const gifFile = formData.get("gif") as File;

    if (!gifFile || gifFile.size === 0) {
      uploadError = "Please select a GIF file.";
      return;
    }

    uploading = true;

    try {
      const presignRes = await fetch(`/api/presign?filename=${encodeURIComponent(gifFile.name)}`);
      const { uploadUrl, publicUrl, error } = await presignRes.json();

      if (error) {
        uploadError = error;
        uploading = false;
        return;
      }

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/gif" },
        body: gifFile,
      });

      if (!uploadRes.ok) {
        uploadError = "Failed to upload GIF. Please try again.";
        uploading = false;
        return;
      }

      formData.delete("gif");
      formData.set("gifUrl", publicUrl);
      formData.set("gifSize", String(gifFile.size));

      const submitRes = await fetch("?/upload", {
        method: "POST",
        body: formData,
      });

      if (submitRes.ok) {
        window.location.reload();
      } else {
        uploadError = "Failed to save sign. Please try again.";
      }
    } catch {
      uploadError = "Something went wrong. Please try again.";
    }

    uploading = false;
  }
</script>

<main class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-xl-9">
      <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
        <h2 class="h4 m-0">Teacher Admin Upload</h2>
        <a class="btn btn-sm btn-outline-secondary" href="/logout">Log Out</a>
      </div>
      <p class="text-muted mb-4">Add a sign GIF and its ASL metadata.</p>

      <!-- Storage Usage -->
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="small fw-semibold">Storage Usage</span>
          <span class="small text-muted">{data.storageMB} MB / 9,800 MB</span>
        </div>
        <div class="progress" style="height: 8px;">
          <div
            class="progress-bar {data.storagePercent > 90 ? 'bg-danger' : data.storagePercent > 75 ? 'bg-warning' : 'bg-success'}"
            role="progressbar"
            style="width: {data.storagePercent}%"
            aria-valuenow={data.storagePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
        {#if data.storagePercent > 90}
          <div class="small text-danger mt-1">Storage almost full! Please delete old GIFs.</div>
        {/if}
      </div>

      {#if form?.success && form?.submission}
        <div class="alert alert-success" role="alert">
          <div class="fw-semibold">{form.message}</div>
          <div class="small mt-2">
            Saved: {form.submission.word} — {form.submission.gloss} ({form.submission.gifFileName})<br />
            {#each form.submission.bookUnitPairs as pair}
              <span class="badge bg-secondary me-1">{pair.book} → {pair.unit}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if form?.success && !form?.submission}
        <div class="alert alert-success" role="alert">{form.message}</div>
      {/if}

      {#if form?.errors?.general}
        <div class="alert alert-danger" role="alert">{form.errors.general}</div>
      {/if}

      {#if form?.duplicateNotice}
        <div class="alert alert-warning" role="alert">
          <div class="fw-semibold">Possible duplicate found</div>
          <div class="small mt-1">{form.duplicateNotice}</div>
        </div>
      {/if}

      {#if data.isAdmin}
        <!-- Teacher Management -->
        <div class="border rounded p-3 p-md-4 mb-5">
          <h3 class="h5 mb-3">
            Teacher Accounts ({data?.teachers?.length ?? 0})
          </h3>

          {#if form?.errors?.teacher}
            <div class="alert alert-danger" role="alert">{form.errors.teacher}</div>
          {/if}

          <!-- Add Teacher Form -->
          <form method="POST" action="?/addTeacher" class="mb-4 d-flex flex-column gap-3">
            <h4 class="h6 m-0">Add New Teacher</h4>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="teacherUsername">Username</label>
                <input id="teacherUsername" name="teacherUsername" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="teacherPassword">Password</label>
                <input id="teacherPassword" name="teacherPassword" type="password" class="form-control" required />
              </div>
            </div>
            <button type="submit" class="btn btn-success align-self-start">Add Teacher</button>
          </form>

          <!-- Teacher List -->
          {#if data?.teachers?.length === 0}
            <p class="text-muted">No teacher accounts yet.</p>
          {:else}
            <div class="d-flex flex-column gap-2">
              {#each data.teachers as teacher}
                <div class="border rounded p-3 d-flex align-items-center justify-content-between gap-3">
                  <div>
                    <div class="fw-semibold">{teacher.username}</div>
                    <div class="small text-muted">
                      Added {new Date(teacher.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <form method="POST" action="?/deleteTeacher">
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <button
                      type="submit"
                      class="btn btn-sm btn-outline-danger"
                      onclick={(e) => {
                        if (!confirm(`Remove ${teacher.username}? They will no longer be able to log in.`))
                          e.preventDefault();
                      }}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Upload Form -->
      <form
        onsubmit={handleSubmit}
        enctype="multipart/form-data"
        class="border rounded p-3 p-md-4 d-flex flex-column gap-3 mb-5"
      >
        <div>
          <label class="form-label" for="word">Word</label>
          <input
            id="word"
            name="word"
            class="form-control {form?.errors?.word ? 'is-invalid' : ''}"
            value={form?.values?.word ?? ""}
            required
          />
          {#if form?.errors?.word}<div class="invalid-feedback d-block">{form.errors.word}</div>{/if}
        </div>

        <div>
          <label class="form-label" for="gloss">Gloss</label>
          <input
            id="gloss"
            name="gloss"
            class="form-control {form?.errors?.gloss ? 'is-invalid' : ''}"
            value={form?.values?.gloss ?? ""}
            required
          />
          {#if form?.errors?.gloss}<div class="invalid-feedback d-block">{form.errors.gloss}</div>{/if}
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
            {#if form?.errors?.books}<div class="invalid-feedback d-block">{form.errors.books}</div>{/if}
            <div class="form-text">Select all books where this sign appears.</div>
          </fieldset>
        </div>

        {#if selectedBooks.length > 0}
          <div>
            <p class="form-label mb-2">Units</p>
            <div class="d-flex flex-column gap-2 {form?.errors?.bookUnitPairs ? 'is-invalid' : ''}">
              {#each selectedBooks as book}
                {@const bookId = book.replace(/\s+/g, "-").toLowerCase()}
                {@const isAddingNew = (unitSelectionByBook[book] ?? "") === ADD_NEW_UNIT_VALUE}
                {@const existingUnits = data?.unitsByBook?.[book] ?? []}
                <div class="border rounded p-2">
                  <label class="form-label mb-1 fw-semibold" for={`unit-${bookId}`}>{book}</label>
                  <select id={`unit-${bookId}`} class="form-select form-select-sm" bind:value={unitSelectionByBook[book]} required>
                    <option value="">Select unit for {book}</option>
                    {#each existingUnits as unitOption}
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
            {#if form?.errors?.bookUnitPairs}<div class="invalid-feedback d-block">{form.errors.bookUnitPairs}</div>{/if}
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
              value={form?.values?.handshape ?? ""}
              required
            />
            {#if form?.errors?.handshape}<div class="invalid-feedback d-block">{form.errors.handshape}</div>{/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="location">Location</label>
            <input
              id="location"
              name="location"
              class="form-control {form?.errors?.location ? 'is-invalid' : ''}"
              value={form?.values?.location ?? ""}
              required
            />
            {#if form?.errors?.location}<div class="invalid-feedback d-block">{form.errors.location}</div>{/if}
          </div>
        </div>

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="movement">Movement</label>
            <input
              id="movement"
              name="movement"
              class="form-control {form?.errors?.movement ? 'is-invalid' : ''}"
              value={form?.values?.movement ?? ""}
              required
            />
            {#if form?.errors?.movement}<div class="invalid-feedback d-block">{form.errors.movement}</div>{/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="palmOrientation">Palm Orientation</label>
            <input
              id="palmOrientation"
              name="palmOrientation"
              class="form-control {form?.errors?.palmOrientation ? 'is-invalid' : ''}"
              value={form?.values?.palmOrientation ?? ""}
              required
            />
            {#if form?.errors?.palmOrientation}<div class="invalid-feedback d-block">{form.errors.palmOrientation}</div>{/if}
          </div>
        </div>

        <div>
          <label class="form-label" for="nonManualSignals">Non-Manual Signals</label>
          <input
            id="nonManualSignals"
            name="nonManualSignals"
            class="form-control {form?.errors?.nonManualSignals ? 'is-invalid' : ''}"
            value={form?.values?.nonManualSignals ?? ""}
            required
          />
          {#if form?.errors?.nonManualSignals}<div class="invalid-feedback d-block">{form.errors.nonManualSignals}</div>{/if}
        </div>

        <div>
          <label class="form-label" for="gif">GIF Upload</label>
          <input
            id="gif"
            name="gif"
            type="file"
            accept="image/gif"
            class="form-control {form?.errors?.gif || uploadError ? 'is-invalid' : ''}"
            required
          />
          <div class="form-text">Only .gif files are accepted.</div>
          {#if form?.errors?.gif}<div class="invalid-feedback d-block">{form.errors.gif}</div>{/if}
          {#if uploadError}<div class="invalid-feedback d-block">{uploadError}</div>{/if}
        </div>

        <div class="form-check">
          <input
            id="allowDuplicate"
            name="allowDuplicate"
            type="checkbox"
            class="form-check-input"
            value="true"
            checked={form?.values?.allowDuplicate === "true"}
          />
          <label class="form-check-label" for="allowDuplicate">Allow duplicate / alternate version of this sign</label>
          <div class="form-text">Use this only when the same word has a valid second version.</div>
        </div>

        <button type="submit" class="btn btn-primary align-self-start" disabled={uploading}>
          {uploading ? "Uploading..." : "Submit Entry"}
        </button>
      </form>

      <!-- Existing Signs -->
      <h3 class="h5 mb-3">Existing Signs ({data?.signs?.length ?? 0})</h3>

      <input
        type="search"
        class="form-control mb-3"
        placeholder="Search signs to delete..."
        bind:value={deleteSearch}
        aria-label="Search signs"
      />

      {#if filteredSigns.length === 0}
        <p class="text-muted">No signs match your search.</p>
      {:else}
        <div class="row g-3">
          {#each filteredSigns as sign}
            <div class="col-12 col-sm-6 col-xl-4">
              <div class="border rounded p-3 h-100 d-flex flex-column gap-2">
                {#if sign.gifUrl}
                  <img src={sign.gifUrl} alt={sign.word} class="admin-gif-thumb rounded" loading="lazy" />
                {:else}
                  <div class="admin-gif-placeholder d-flex align-items-center justify-content-center text-muted rounded">
                    No GIF
                  </div>
                {/if}
                <div class="fw-semibold">{sign.word}</div>
                <div class="small text-muted">{sign.gloss}</div>
                <div class="small text-muted">
                  {#each sign.books as b}
                    <span class="badge bg-secondary me-1">{b.book} → {b.unit}</span>
                  {/each}
                </div>
                <div class="mt-auto">
                  <form method="POST" action="?/delete">
                    <input type="hidden" name="id" value={sign.id} />
                    <input type="hidden" name="gifUrl" value={sign.gifUrl} />
                    <button
                      type="submit"
                      class="btn btn-sm btn-outline-danger w-100"
                      onclick={(e) => {
                        if (!confirm(`Delete ${sign.word}? This cannot be undone.`))
                          e.preventDefault();
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</main>

<style>
  .admin-gif-thumb {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }

  .admin-gif-placeholder {
    width: 100%;
    height: 150px;
    border: 1px dashed var(--bs-border-color);
  }
</style>