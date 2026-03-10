<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="text-white py-3" style="background-color: rgb(64, 64, 64);">
	<div class="container-fluid d-flex align-items-center justify-content-between gap-2 px-3">
		<h1 class="m-0 app-title">ASL Dictionary</h1>
		<div class="d-flex align-items-center gap-2">
			<a class="btn btn-sm btn-outline-light" href="/login">Teacher Login</a>
			<a class="btn btn-sm btn-light" href="/admin">Admin</a>
		</div>
	</div>
</header>

{@render children()}

<style>
	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>
