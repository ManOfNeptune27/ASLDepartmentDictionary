<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import { page } from '$app/state';
	import { isAdEligible } from '$lib/ads';
	import '../app.css';

	let { children } = $props();
	const canonicalUrl = $derived(`https://asldepartmentdictionary.org${page.url.pathname}`);
	const adsEligible = $derived(isAdEligible(page.url.pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={canonicalUrl} />
	{#if adsEligible}
		<script
			async
			src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454601651628271"
			crossorigin="anonymous"
		></script>
	{/if}
</svelte:head>

<div class="app-shell">
	<header class="text-white py-3 app-header">
		<div class="container-fluid d-flex align-items-center px-3">
			<a href="/" class="text-decoration-none text-white">
				<h1 class="m-0 app-title">ASL Dictionary</h1>
			</a>
		</div>
	</header>

	<div class="app-content">
		{@render children()}
	</div>

	<footer class="text-center py-3 mt-4 border-top">
		<nav class="d-flex flex-wrap justify-content-center gap-3" aria-label="Site information">
			<a href="/about">About</a>
			<a href="/contact">Contact</a>
			<a href="/how-name-signs-work">How Name Signs Work</a>
			<a href="/fingerspelling-basics">Fingerspelling Basics</a>
			<a href="/privacy">Privacy</a>
			<a href="/terms">Terms</a>
		</nav>
	</footer>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-content {
		flex: 1;
	}

	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>