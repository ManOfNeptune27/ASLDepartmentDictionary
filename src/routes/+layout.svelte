<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="text-white py-3" style="background-color: rgb(64, 64, 64);">
	<h1 class="text-center m-0 app-title">ASL Dictionary</h1>
</header>

{@render children()}

<style>
	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>
