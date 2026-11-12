<script lang="ts">
  type Props = {
    src: string;
    word: string;
    variant?: 'thumbnail' | 'detail';
  };

  let { src, word, variant = 'detail' }: Props = $props();
  let mediaState: 'loading' | 'ready' | 'missing' | 'error' = $state('loading');
  let attempt: number = $state(0);
  let previewCanvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    const url = src;
    if (!url) {
      mediaState = 'missing';
      return;
    }

    mediaState = 'loading';
    if (variant !== 'thumbnail' || !previewCanvas) return;

    const canvas = previewCanvas;
    let active = true;
    let image: HTMLImageElement | null = null;
    const loadPreview = () => {
      image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (!active) return;
        const context = canvas.getContext('2d');
        if (!context) {
          mediaState = 'error';
          image = null;
          return;
        }

        const previewSize = 150;
        const scale = Math.max(
          previewSize / image!.naturalWidth,
          previewSize / image!.naturalHeight,
        );
        const width = image!.naturalWidth * scale;
        const height = image!.naturalHeight * scale;

        canvas.width = previewSize;
        canvas.height = previewSize;
        context.drawImage(
          image!,
          (previewSize - width) / 2,
          (previewSize - height) / 2,
          width,
          height,
        );
        mediaState = 'ready';
        image = null;
      };
      image.onerror = () => {
        if (active) mediaState = 'error';
        image = null;
      };
      image.src = url;
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            loadPreview();
          }
        },
        { rootMargin: '100px' },
      );
      observer.observe(canvas);

      return () => {
        active = false;
        observer.disconnect();
        if (image) image.src = '';
      };
    }

    loadPreview();
    return () => {
      active = false;
      if (image) image.src = '';
    };
  });

  function retry() {
    mediaState = 'loading';
    attempt += 1;
  }
</script>

<div
  class="sign-media sign-media-{variant}"
  class:sign-media-ready={mediaState === 'ready'}
  class:sign-media-pending={mediaState === 'loading'}
>
  {#if variant === 'thumbnail'}
    <canvas bind:this={previewCanvas} aria-hidden="true"></canvas>
  {:else if src}
    {#key `${src}-${attempt}`}
      <img
        src={src}
        alt={`Animated ASL sign for ${word}`}
        class="sign-media-image"
        onload={() => (mediaState = 'ready')}
        onerror={() => (mediaState = 'error')}
      />
    {/key}
  {/if}

  {#if mediaState === 'loading'}
    <div class="sign-media-message" role={variant === 'detail' ? 'status' : undefined}>
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>Loading sign media…</span>
    </div>
  {:else if mediaState === 'missing'}
    <div class="sign-media-message">Sign media is not available yet.</div>
  {:else if mediaState === 'error'}
    <div class="sign-media-message" role={variant === 'detail' ? 'status' : undefined}>
      <span>Sign media couldn’t be loaded.</span>
      {#if variant === 'detail'}
        <button type="button" class="btn btn-outline-secondary btn-sm" onclick={retry}>
          Try again
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sign-media {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 0.4rem;
    background: var(--ocean-bg);
    color: var(--ocean-text-muted);
    text-align: center;
  }

  .sign-media-thumbnail {
    width: 150px;
    height: 150px;
    margin: 0 auto;
  }

  .sign-media-detail {
    width: 100%;
    min-height: 240px;
  }

  canvas {
    width: 150px;
    height: 150px;
    object-fit: cover;
  }

  .sign-media-image {
    display: block;
    width: 100%;
    max-height: 400px;
    object-fit: contain;
  }

  .sign-media-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 1rem;
  }

  .sign-media-ready .sign-media-message {
    display: none;
  }

  .sign-media-pending canvas,
  .sign-media:not(.sign-media-ready) .sign-media-image {
    visibility: hidden;
  }
</style>
