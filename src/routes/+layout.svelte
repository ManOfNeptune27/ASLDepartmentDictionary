<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6454601651628271" crossorigin="anonymous"></script>
</svelte:head>

<header class="text-white py-3" style="background-color: rgb(64, 64, 64);">
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
</footer>

<style>
	.app-title {
		font-size: clamp(1.35rem, 1.1rem + 0.9vw, 2rem);
	}
</style>