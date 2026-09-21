<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.png';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		const ads = (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle ?? [];
		ads.push({});
		(window as Window & { adsbygoogle?: unknown[] }).adsbygoogle = ads;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="text-white py-3 app-header">
	<div class="container-fluid d-flex align-items-center px-3">
		<a href="/" class="text-decoration-none text-white">
			<h1 class="m-0 app-title">ASL Dictionary</h1>
		</a>
	</div>
</header>

{@render children()}

<footer class="text-center py-3 mt-4 border-top">
	<ins class="adsbygoogle"
		style="display:block"
		data-ad-client="ca-pub-6454601651628271"
		data-ad-slot="auto"
		data-ad-format="auto"
		data-full-width-responsive="true">
	</ins>
	<a class="privacy-link d-block mt-2" href="/privacy">Privacy Policy</a>
</footer>

<style>
	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>