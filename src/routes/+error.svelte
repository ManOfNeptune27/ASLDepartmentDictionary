<script lang="ts">
  let { status = 500 } = $props<{ status?: number }>();

  const isNotFound = $derived(status === 404);
</script>

<svelte:head>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="container py-5 text-center error-page">
  {#if isNotFound}
    <h1>Page not found</h1>
    <p class="text-muted">The page you requested is unavailable.</p>
  {:else}
    <h1>We couldn’t load this page</h1>
    <p class="text-muted">There was a problem retrieving this content. Check your connection and try again.</p>
    <button class="btn btn-outline-secondary" type="button" onclick={() => location.reload()}>
      Try again
    </button>
  {/if}
  <a class="btn btn-primary" href="/dictionary">Return to the dictionary</a>
</main>

<style>
  .error-page .btn {
    min-height: 2.75rem;
    margin: 0.35rem;
    white-space: normal;
  }

  @media (max-width: 575.98px) {
    .error-page .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  }
</style>
