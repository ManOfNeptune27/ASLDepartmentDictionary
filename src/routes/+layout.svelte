<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="text-white py-3" style="background-color: rgb(64, 64, 64);">
	<div class="container-fluid d-flex align-items-center px-3">
		<a href="/" class="text-decoration-none text-white">
			<h1 class="m-0 app-title">ASL Dictionary</h1>
		</a>
	</div>
</header>

{@render children()}

<style>
	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>