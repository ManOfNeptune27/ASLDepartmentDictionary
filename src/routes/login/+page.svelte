<script lang="ts">
  let { data, form } = $props();
</script>

<main class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-md-8 col-lg-5">
      <h2 class="h4 mb-2">Teacher Login</h2>
      <p class="text-muted mb-4">Sign in to access the admin upload page.</p>

      {#if form?.error}
        <div class="alert alert-danger" role="alert">{form.error}</div>
      {/if}

      <form method="POST" class="border rounded p-3 p-md-4 d-flex flex-column gap-3">
        <input type="hidden" name="next" value={form?.values?.next ?? data.next} />

        <div>
          <label class="form-label" for="username">Username</label>
          <input
            id="username"
            name="username"
            class="form-control"
            autocomplete="username"
            value={form?.values?.username ?? ''}
            required
          />
        </div>

        <div>
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            class="form-control"
            autocomplete="current-password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary align-self-start">Log In</button>
      </form>
    </div>
  </div>
</main>
