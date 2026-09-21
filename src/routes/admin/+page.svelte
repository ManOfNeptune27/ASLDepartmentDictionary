<script lang="ts">
  let { form, data }: { form: any; data: any } = $props();
  const ADD_NEW_UNIT_VALUE = "__add_new_unit__";

  const bookOptions = [
    { value: "Signing Naturally", label: "SN" },
    { value: "True Way ASL", label: "TWA" },
    { value: "MISCELLANEOUS", label: "MISCELLANEOUS" },
  ];

  const PAIR_SEP = "|||";

  function sourceBadgeClass(book: string) {
    if (book === "Signing Naturally") return "admin-source-naturally";
    if (book === "True Way ASL") return "admin-source-trueway";
    if (book === "MISCELLANEOUS") return "admin-source-miscellaneous";
    return "admin-source-other";
  }

  let selectedBooks = $state<string[]>([]);
  let unitSelectionByBook = $state<Record<string, string>>({});
  let newUnitByBook = $state<Record<string, string>>({});
  let deleteSearch = $state("");
  let signFilter = $state("all");
  let signPage = $state(1);
  const signsPerPage = 30;
  let uploading = $state(false);
  let uploadError = $state("");
  let batchUploading = $state(false);
  let batchProgress = $state("");
  let batchUploadError = $state("");
  let batchResults = $state<{ filename: string; success: boolean; error?: string }[]>([]);
  let signName = $state("");
  let editingSignId = $state<number | null>(null);
  let showTeacherPassword = $state(false);

  // Edit form state
  let editSelectedBooks = $state<string[]>([]);
  let editUnitSelectionByBook = $state<Record<string, string>>({});
  let editNewUnitByBook = $state<Record<string, string>>({});

  const editBookUnitPairs = $derived(
    editSelectedBooks.map((book) => {
      const sel = editUnitSelectionByBook[book] ?? "";
      if (sel === ADD_NEW_UNIT_VALUE) {
        return `${book}${PAIR_SEP}${ADD_NEW_UNIT_VALUE}${PAIR_SEP}${editNewUnitByBook[book] ?? ""}`;
      }
      return `${book}${PAIR_SEP}${sel}`;
    }),
  );

  $effect(() => {
    const booksSet = new Set(editSelectedBooks);
    const stale = Object.keys(editUnitSelectionByBook).filter(
      (b) => !booksSet.has(b),
    );
    if (stale.length > 0) {
      const next = { ...editUnitSelectionByBook };
      for (const b of stale) delete next[b];
      editUnitSelectionByBook = next;
    }
  });

  function startEditing(sign: any) {
    editingSignId = sign.id;
    editSelectedBooks = sign.books.map((b: any) => b.book);
    editUnitSelectionByBook = Object.fromEntries(
      sign.books.map((b: any) => [b.book, b.unit])
    );
    editNewUnitByBook = {};
  }

  function normalizeSignName(word: string) {
    return word.trim().toLowerCase();
  }

  const duplicateNames = $derived(
    new Set(
      (data?.signs ?? [])
        .map((sign: any) => normalizeSignName(sign.word))
        .filter(
          (word: string, index: number, words: string[]) =>
            word && words.indexOf(word) !== index,
        ),
    ),
  );

  const filteredSigns = $derived(
    (data?.signs ?? []).filter((sign: any) => {
      const matchesSearch = normalizeSignName(sign.word).includes(
        normalizeSignName(deleteSearch),
      );
      const isDuplicate = duplicateNames.has(normalizeSignName(sign.word));
      const matchesFilter =
        signFilter === "all" ||
        (signFilter === "duplicates"
          ? isDuplicate
          : sign.books?.some((book: any) => book.book === signFilter));
      return matchesSearch && matchesFilter;
    }),
  );

  const totalSignPages = $derived(
    Math.max(1, Math.ceil(filteredSigns.length / signsPerPage)),
  );

  const paginatedSigns = $derived(
    filteredSigns.slice(
      (signPage - 1) * signsPerPage,
      signPage * signsPerPage,
    ),
  );

  $effect(() => {
    deleteSearch;
    signFilter;
    signPage = 1;
  });

  $effect(() => {
    if (signPage > totalSignPages) signPage = totalSignPages;
  });

  $effect(() => {
    if (form?.values) {
      if (form.values.word !== undefined) signName = form.values.word;
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

  function handleGifChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const gifFile = input.files?.[0];
    if (!gifFile || signName.trim()) return;

    signName = gifFile.name.replace(/\.gif$/i, "");
  }

  async function readJsonResponse(response: Response) {
    const body = await response.text();
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      const destination = response.redirected ? ` to ${response.url}` : "";
      throw new Error(`The server returned an unexpected response${destination}.`);
    }
  }

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
      const uploadRes = await fetch("/api/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: gifFile.name, size: gifFile.size }),
      });

      const { uploadUrl, publicUrl, size, error } = await readJsonResponse(uploadRes) as {
        uploadUrl?: string;
        publicUrl?: string;
        size?: number;
        error?: string;
      };

      if (error || !uploadUrl || !publicUrl) {
        uploadError = error ?? "Failed to upload GIF. Please try again.";
        uploading = false;
        return;
      }

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/gif" },
        body: gifFile,
      });

      if (!putRes.ok) {
        uploadError = "Failed to upload GIF. Please try again.";
        uploading = false;
        return;
      }

      formData.delete("gif");
      formData.set("gifUrl", publicUrl);
      formData.set("gifSize", String(size));

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

  async function handleBatchSubmit(e: SubmitEvent) {
    e.preventDefault();
    batchUploadError = "";
    batchResults = [];

    const formEl = e.target as HTMLFormElement;
    const input = formEl.elements.namedItem("gifs") as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      batchUploadError = "Please select at least one GIF file.";
      return;
    }

    batchUploading = true;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const filename = file.name.split(/[\\/]/).pop() ?? file.name;
      const word = filename.replace(/\.gif$/i, "").trim();
      batchProgress = `Uploading ${index + 1} of ${files.length}: ${filename}`;
      let uploadStage = "validating";

      try {
        const signature = new TextDecoder().decode(
          (await file.slice(0, 6).arrayBuffer()),
        );
        if (!/\.gif$/i.test(filename) || (file.type && file.type !== "image/gif") ||
          (signature !== "GIF87a" && signature !== "GIF89a") || !word) {
          throw new Error("Only valid GIF files are accepted.");
        }

        uploadStage = "preparing upload";
        const presignRes = await fetch("/api/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, size: file.size }),
        });
        const presignResult = await readJsonResponse(presignRes) as {
          uploadUrl?: string;
          publicUrl?: string;
          error?: string;
        };
        if (!presignRes.ok || !presignResult.uploadUrl || !presignResult.publicUrl) {
          throw new Error(presignResult.error ?? "Could not prepare the GIF upload.");
        }

        uploadStage = "uploading";
        const putRes = await fetch(presignResult.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/gif" },
          body: file,
        });
        if (!putRes.ok) throw new Error("Could not upload the GIF to storage.");

        uploadStage = "saving";
        const recordRes = await fetch("/api/batch-record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename,
            gifUrl: presignResult.publicUrl,
            gifSize: file.size,
          }),
        });
        const recordResult = await readJsonResponse(recordRes) as { error?: string };
        if (!recordRes.ok) throw new Error(recordResult.error ?? "Could not save the GIF.");

        batchResults = [...batchResults, { filename, success: true }];
      } catch (error) {
        batchResults = [...batchResults, {
          filename,
          success: false,
          error: `${uploadStage}: ${error instanceof Error ? error.message : "Upload failed."}`,
        }];
      }
    }

    batchProgress = `Finished ${files.length} file${files.length === 1 ? "" : "s"}.`;
    batchUploading = false;
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
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-semibold">Storage Used</span>
          <span class="small text-muted">{data.storageGB.toFixed(1)} GB</span>
        </div>
        {#if data.isAdmin}
          <details class="small mt-1">
            <summary class="storage-cost-summary">Show estimated monthly cost</summary>
            <div class="text-muted mt-1">
              First 10 GB free. {Math.max(0, data.storageGB - 10).toFixed(1)} GB billed at $0.015/GB-month:
              <strong>${(Math.max(0, data.storageGB - 10) * 0.015).toFixed(2)} per month</strong>.
            </div>
          </details>
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

          <form method="POST" action="?/addTeacher" class="mb-4 d-flex flex-column gap-3">
            <h4 class="h6 m-0">Add New Teacher</h4>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="teacherUsername">Username</label>
                <input id="teacherUsername" name="teacherUsername" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="teacherPassword">Password</label>
                <div class="input-group">
                  <input id="teacherPassword" name="teacherPassword" type={showTeacherPassword ? 'text' : 'password'} class="form-control" required />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    onclick={() => (showTeacherPassword = !showTeacherPassword)}
                    title={showTeacherPassword ? 'Hide password' : 'Show password'}
                  >
                    {showTeacherPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-success align-self-start">Add Teacher</button>
          </form>

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

      <!-- Batch Upload Form -->
      <form
        onsubmit={handleBatchSubmit}
        enctype="multipart/form-data"
        class="border rounded p-3 p-md-4 d-flex flex-column gap-3 mb-5"
      >
        <div>
          <h3 class="h5 mb-1">Batch GIF Upload</h3>
          <p class="text-muted mb-0">Select a folder or multiple files. Each filename becomes the sign name.</p>
        </div>

        <div>
          <label class="form-label" for="batchGifs">GIF Files</label>
          <input id="batchGifs" name="gifs" type="file" accept=".gif,image/gif" multiple webkitdirectory class="form-control" required />
          <div class="form-text">Only valid GIF files are uploaded. Other file types are rejected.</div>
          {#if form?.errors?.batch}<div class="invalid-feedback d-block">{form.errors.batch}</div>{/if}
          {#if batchUploadError}<div class="invalid-feedback d-block">{batchUploadError}</div>{/if}
        </div>

        <button type="submit" class="btn btn-primary align-self-start" disabled={batchUploading}>
          {batchUploading ? "Uploading..." : "Upload GIF Batch"}
        </button>

        {#if batchProgress || batchResults.length > 0}
          <div class="border-top pt-3">
            <div class="fw-semibold mb-2">{batchProgress}</div>
            <div class="d-flex flex-column gap-1">
              {#each batchResults as result}
                <div class="small {result.success ? 'text-success' : 'text-danger'}">
                  {result.success ? 'Uploaded' : 'Rejected'}: {result.filename}{result.error ? ` — ${result.error}` : ''}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </form>

      <!-- Upload Form -->
      <form
        onsubmit={handleSubmit}
        enctype="multipart/form-data"
        class="border rounded p-3 p-md-4 d-flex flex-column gap-3 mb-5"
      >
        <div>
          <label class="form-label" for="word">Name of Sign</label>
          <input id="word" name="word" class="form-control {form?.errors?.word ? 'is-invalid' : ''}" bind:value={signName} required />
          {#if form?.errors?.word}<div class="invalid-feedback d-block">{form.errors.word}</div>{/if}
        </div>

        <div>
          <label class="form-label" for="gloss">Gloss</label>
          <input id="gloss" name="gloss" class="form-control {form?.errors?.gloss ? 'is-invalid' : ''}" value={form?.values?.gloss ?? "N/A"} required />
          {#if form?.errors?.gloss}<div class="invalid-feedback d-block">{form.errors.gloss}</div>{/if}
        </div>

        <div>
          <fieldset>
            <legend class="form-label d-block">Books</legend>
            <div class="border rounded p-2 {form?.errors?.books ? 'border-danger' : ''}">
              {#each bookOptions as option}
                <div class="form-check">
                  <input id={`book-${option.value}`} name="books" type="checkbox" class="form-check-input" value={option.value} bind:group={selectedBooks} />
                  <label class="form-check-label" for={`book-${option.value}`}>{option.label}</label>
                </div>
              {/each}
            </div>
            {#if form?.errors?.books}<div class="invalid-feedback d-block">{form.errors.books}</div>{/if}
            <div class="form-text">Select all books where this sign appears. Leave blank for MISCELLANEOUS.</div>
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
                    <input class="form-control form-control-sm mt-2" bind:value={newUnitByBook[book]} placeholder="Example: Unit 4: Community" required />
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
            <input id="handshape" name="handshape" class="form-control {form?.errors?.handshape ? 'is-invalid' : ''}" value={form?.values?.handshape ?? "N/A"} required />
            {#if form?.errors?.handshape}<div class="invalid-feedback d-block">{form.errors.handshape}</div>{/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="location">Location</label>
            <input id="location" name="location" class="form-control {form?.errors?.location ? 'is-invalid' : ''}" value={form?.values?.location ?? "N/A"} required />
            {#if form?.errors?.location}<div class="invalid-feedback d-block">{form.errors.location}</div>{/if}
          </div>
        </div>

        <div class="row g-3">
          <div class="col-12 col-md-6">
            <label class="form-label" for="movement">Movement</label>
            <input id="movement" name="movement" class="form-control {form?.errors?.movement ? 'is-invalid' : ''}" value={form?.values?.movement ?? "N/A"} required />
            {#if form?.errors?.movement}<div class="invalid-feedback d-block">{form.errors.movement}</div>{/if}
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label" for="palmOrientation">Palm Orientation</label>
            <input id="palmOrientation" name="palmOrientation" class="form-control {form?.errors?.palmOrientation ? 'is-invalid' : ''}" value={form?.values?.palmOrientation ?? "N/A"} required />
            {#if form?.errors?.palmOrientation}<div class="invalid-feedback d-block">{form.errors.palmOrientation}</div>{/if}
          </div>
        </div>

        <div>
          <label class="form-label" for="nonManualSignals">Non-Manual Signals</label>
          <input id="nonManualSignals" name="nonManualSignals" class="form-control {form?.errors?.nonManualSignals ? 'is-invalid' : ''}" value={form?.values?.nonManualSignals ?? "N/A"} required />
          {#if form?.errors?.nonManualSignals}<div class="invalid-feedback d-block">{form.errors.nonManualSignals}</div>{/if}
        </div>

        <div>
          <label class="form-label" for="gif">GIF Upload</label>
          <input id="gif" name="gif" type="file" accept="image/gif" onchange={handleGifChange} class="form-control {form?.errors?.gif || uploadError ? 'is-invalid' : ''}" required />
          <div class="form-text">Only .gif files are accepted.</div>
          {#if form?.errors?.gif}<div class="invalid-feedback d-block">{form.errors.gif}</div>{/if}
          {#if uploadError}<div class="invalid-feedback d-block">{uploadError}</div>{/if}
        </div>

        <div class="form-check">
          <input id="allowDuplicate" name="allowDuplicate" type="checkbox" class="form-check-input" value="true" checked={form?.values?.allowDuplicate === "true"} />
          <label class="form-check-label" for="allowDuplicate">Allow duplicate / alternate version of this sign</label>
          <div class="form-text">Use this only when the same sign name has a valid second version.</div>
        </div>

        <button type="submit" class="btn btn-primary align-self-start" disabled={uploading}>
          {uploading ? "Uploading..." : "Submit Entry"}
        </button>
      </form>

      <!-- Existing Signs -->
      <h3 class="h5 mb-3">Existing Signs ({data?.signs?.length ?? 0})</h3>

      <div class="row g-2 mb-3">
        <div class="col-12 col-md-8">
          <input type="search" class="form-control" placeholder="Search signs to edit or delete..." bind:value={deleteSearch} aria-label="Search signs" />
        </div>
        <div class="col-12 col-md-4">
          <select class="form-select" bind:value={signFilter} aria-label="Filter existing signs">
            <option value="all">All signs</option>
            <option value="duplicates">Duplicate Signs</option>
            <option value="Signing Naturally">SN</option>
            <option value="True Way ASL">TWA</option>
            <option value="MISCELLANEOUS">MISC</option>
          </select>
        </div>
      </div>

      {#if filteredSigns.length === 0}
        <p class="text-muted">No signs match your search.</p>
      {:else}
        {#if totalSignPages > 1}
          <nav class="d-flex align-items-center justify-content-center gap-3 mb-4" aria-label="Admin sign pages">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              disabled={signPage === 1}
              onclick={() => (signPage -= 1)}
            >
              Previous
            </button>
            <span class="small text-muted">Page {signPage} of {totalSignPages}</span>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              disabled={signPage === totalSignPages}
              onclick={() => (signPage += 1)}
            >
              Next
            </button>
          </nav>
        {/if}
        <div class="row g-3">
          {#each paginatedSigns as sign}
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
                    <span class="badge admin-source-badge {sourceBadgeClass(b.book)} me-1">{b.book} → {b.unit}</span>
                  {/each}
                </div>
                <div class="mt-auto d-flex flex-column gap-2">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary w-100"
                    onclick={() => {
                      if (editingSignId === sign.id) {
                        editingSignId = null;
                      } else {
                        startEditing(sign);
                      }
                    }}
                  >
                    {editingSignId === sign.id ? 'Cancel' : 'Edit'}
                  </button>

                  {#if editingSignId === sign.id}
                    <form method="POST" action="?/editSign" class="d-flex flex-column gap-2 mt-1">
                      <input type="hidden" name="id" value={sign.id} />
                      <div>
                        <label class="form-label small mb-1" for={`edit-word-${sign.id}`}>Name of Sign</label>
                        <input id={`edit-word-${sign.id}`} name="word" class="form-control form-control-sm" value={sign.word} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-gloss-${sign.id}`}>Gloss</label>
                        <input id={`edit-gloss-${sign.id}`} name="gloss" class="form-control form-control-sm" value={sign.gloss} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-handshape-${sign.id}`}>Handshape</label>
                        <input id={`edit-handshape-${sign.id}`} name="handshape" class="form-control form-control-sm" value={sign.handshape} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-location-${sign.id}`}>Location</label>
                        <input id={`edit-location-${sign.id}`} name="location" class="form-control form-control-sm" value={sign.location} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-movement-${sign.id}`}>Movement</label>
                        <input id={`edit-movement-${sign.id}`} name="movement" class="form-control form-control-sm" value={sign.movement} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-palm-${sign.id}`}>Palm Orientation</label>
                        <input id={`edit-palm-${sign.id}`} name="palmOrientation" class="form-control form-control-sm" value={sign.palmOrientation} required />
                      </div>
                      <div>
                        <label class="form-label small mb-1" for={`edit-non-manual-${sign.id}`}>Non-Manual Signals</label>
                        <input id={`edit-non-manual-${sign.id}`} name="nonManualSignals" class="form-control form-control-sm" value={sign.nonManualSignals} required />
                      </div>

                      <!-- Book/Unit editing -->
                      <fieldset class="border rounded p-2">
                        <legend class="form-label d-block small fw-semibold">Books</legend>
                        {#each bookOptions as option}
                          <div class="form-check">
                            <input
                              id={`edit-book-${sign.id}-${option.value}`}
                              type="checkbox"
                              class="form-check-input"
                              value={option.value}
                              bind:group={editSelectedBooks}
                            />
                            <label class="form-check-label small" for={`edit-book-${sign.id}-${option.value}`}>{option.label}</label>
                          </div>
                        {/each}
                      </fieldset>

                      {#if editSelectedBooks.length > 0}
                        <div class="d-flex flex-column gap-2">
                          {#each editSelectedBooks as book}
                            {@const bookId = `edit-${sign.id}-${book.replace(/\s+/g, "-").toLowerCase()}`}
                            {@const isAddingNew = (editUnitSelectionByBook[book] ?? "") === ADD_NEW_UNIT_VALUE}
                            {@const existingUnits = data?.unitsByBook?.[book] ?? []}
                            <div class="border rounded p-2">
                              <label class="form-label mb-1 fw-semibold small" for={bookId}>{book}</label>
                              <select id={bookId} class="form-select form-select-sm" bind:value={editUnitSelectionByBook[book]}>
                                <option value="">Select unit</option>
                                {#each existingUnits as unitOption}
                                  <option value={unitOption}>{unitOption}</option>
                                {/each}
                                <option value={ADD_NEW_UNIT_VALUE}>+ Add a new unit</option>
                              </select>
                              {#if isAddingNew}
                                <input class="form-control form-control-sm mt-2" bind:value={editNewUnitByBook[book]} placeholder="New unit name" />
                              {/if}
                            </div>
                          {/each}
                        </div>
                      {/if}

                      {#each editBookUnitPairs as pair}
                        <input type="hidden" name="bookUnitPair" value={pair} />
                      {/each}

                      <button type="submit" class="btn btn-sm btn-primary w-100">Save</button>
                    </form>
                  {/if}

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
        {#if totalSignPages > 1}
          <nav class="d-flex align-items-center justify-content-center gap-3 mt-4" aria-label="Admin sign pages">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              disabled={signPage === 1}
              onclick={() => (signPage -= 1)}
            >
              Previous
            </button>
            <span class="small text-muted">Page {signPage} of {totalSignPages}</span>
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              disabled={signPage === totalSignPages}
              onclick={() => (signPage += 1)}
            >
              Next
            </button>
          </nav>
        {/if}
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

  .admin-source-badge {
    border: 1px solid transparent;
    border-radius: 0;
    color: #fff;
  }

  .admin-source-naturally {
    background-color: #18794e;
    border-color: #18794e;
  }

  .admin-source-trueway {
    background-color: #1769aa;
    border-color: #1769aa;
  }

  .admin-source-miscellaneous {
    background-color: #9a6700;
    border-color: #9a6700;
  }

  .admin-source-other {
    background-color: #6c757d;
    border-color: #6c757d;
  }
</style>