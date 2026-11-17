<script lang="ts">
  let { data, form } = $props();

  const filters = [
    { value: 'open', label: 'Open' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'all', label: 'All' },
  ] as const;

  const statusLabels = {
    open: 'Open',
    reviewed: 'Reviewed',
    dismissed: 'Dismissed',
  } as const;

  function formatWhen(value: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(date);
  }

  function editHref(report: (typeof data.reports)[number]) {
    return `/admin?edit=${report.signId}#existing-signs`;
  }
</script>

<svelte:head>
  <title>Sign reports | ASL Department Dictionary</title>
</svelte:head>

<main class="container py-4 reports-page">
  <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
    <h1 class="h3 m-0">Sign reports</h1>
    <a class="btn btn-sm btn-outline-secondary" href="/admin">Back to signs</a>
  </div>
  <p class="text-muted">
    Review reports of inaccurate sign information. Updating a report leaves the published sign unchanged.
  </p>

  {#if form?.reportUpdateMessage}
    <div class="alert alert-success" role="status">{form.reportUpdateMessage}</div>
  {/if}
  {#if form?.reportUpdateError}
    <div class="alert alert-danger" role="alert">{form.reportUpdateError}</div>
  {/if}

  <nav class="d-flex flex-wrap gap-2 mb-4" aria-label="Report status">
    {#each filters as filter}
      <a
        class="btn btn-sm {data.status === filter.value ? 'btn-primary' : 'btn-outline-secondary'}"
        href={`/admin/reports?status=${filter.value}`}
        aria-current={data.status === filter.value ? 'page' : undefined}
      >
        {filter.label}
      </a>
    {/each}
  </nav>

  {#if data.reports.length === 0}
    <p>{data.status === 'all' ? 'No reports.' : `No ${data.status} reports.`}</p>
  {:else}
    <div class="d-flex flex-column gap-3">
      {#each data.reports as report (report.id)}
        <article class="border rounded p-3">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <h2 class="h5 m-0">{report.currentWord || report.signWord}</h2>
            <span class="badge text-bg-secondary">{statusLabels[report.status]}</span>
          </div>

          {#if report.currentWord && report.currentWord !== report.signWord}
            <p class="small text-muted mb-2">
              Reported while the sign was named “{report.signWord}”. It is now “{report.currentWord}”.
            </p>
          {:else if !report.signStillExists}
            <p class="small text-muted mb-2">
              Reported as “{report.signWord}”. That sign is no longer in the dictionary.
            </p>
          {/if}

          <p class="report-description mb-2">{report.description}</p>
          <p class="small text-muted mb-3">
            Submitted {formatWhen(report.createdAt)} UTC
            {#if report.reviewedAt}
              · {statusLabels[report.status]} {formatWhen(report.reviewedAt)} UTC
              {#if report.reviewerUsername}
                by {report.reviewerUsername}
              {/if}
            {/if}
          </p>

          <div class="d-flex flex-wrap gap-2">
            {#if report.signStillExists}
              <a class="btn btn-sm btn-outline-secondary" href={`/sign/${report.signId}`}>View sign</a>
              <a class="btn btn-sm btn-outline-secondary" href={editHref(report)}>Edit sign</a>
            {/if}
            <form method="POST" action="?/updateStatus" class="d-flex flex-wrap gap-2">
              <input type="hidden" name="id" value={report.id} />
              {#if report.status !== 'reviewed'}
                <button class="btn btn-sm btn-success" name="status" value="reviewed">Mark reviewed</button>
              {/if}
              {#if report.status !== 'dismissed'}
                <button class="btn btn-sm btn-outline-danger" name="status" value="dismissed">Dismiss</button>
              {/if}
              {#if report.status !== 'open'}
                <button class="btn btn-sm btn-outline-secondary" name="status" value="open">Reopen</button>
              {/if}
            </form>
          </div>
        </article>
      {/each}
    </div>
    {#if data.reports.length === 200}
      <p class="small text-muted mt-3">Showing the 200 most recent reports in this list.</p>
    {/if}
  {/if}
</main>

<style>
  .reports-page {
    max-width: 860px;
  }

  .report-description {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
