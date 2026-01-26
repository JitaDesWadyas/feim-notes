<script>
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { router } from './router.js';

  export let path = []; // ['Category Name', 'Subcategory', ...]

  const dispatch = createEventDispatcher();

  function handleBack() {
    router.navigateToOverview();
  }

  function handleBreadcrumbClick(index) {
    if (index === 0) {
      router.navigateToOverview();
    }
    // Future: support nested category navigation
  }
</script>

<div class="breadcrumb-container" transition:slide={{ duration: 180, easing: quintOut }}>
  <button class="back-button" on:click={handleBack} title="Back to overview">
    <span class="back-icon">←</span>
  </button>
  
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <button class="breadcrumb-item root" on:click={() => handleBreadcrumbClick(-1)}>
      FEIM
    </button>
    
    {#each path as segment, i}
      <span class="breadcrumb-separator">/</span>
      <button 
        class="breadcrumb-item" 
        class:current={i === path.length - 1}
        on:click={() => handleBreadcrumbClick(i)}
      >
        {segment}
      </button>
    {/each}
  </nav>
</div>

<style>
  .breadcrumb-container {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: #1a181d;
    border-bottom: 1px solid #4a3a2c;
    position: sticky;
    top: var(--header-h, 80px);
    z-index: 999;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .back-button {
    background: #25232a;
    border: 1px solid #4a3a2c;
    color: #fbbf24;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 1.125rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    min-width: 40px;
    height: 40px;
  }

  .back-button:hover {
    background: #2d2b32;
    border-color: #fbbf24;
    transform: translateX(-2px);
  }

  .back-button:active {
    background: #1a181d;
    transform: translateX(0);
  }

  .back-icon {
    line-height: 1;
  }

  .breadcrumb {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    padding: 4px 0;
  }

  .breadcrumb::-webkit-scrollbar {
    height: 4px;
  }

  .breadcrumb::-webkit-scrollbar-track {
    background: transparent;
  }

  .breadcrumb::-webkit-scrollbar-thumb {
    background: #4a3a2c;
    border-radius: 2px;
  }

  .breadcrumb-item {
    background: transparent;
    border: none;
    color: #a79d8f;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .breadcrumb-item:hover {
    color: #f4efe6;
    background: #25232a;
  }

  .breadcrumb-item.root {
    color: #fbbf24;
    font-weight: 600;
  }

  .breadcrumb-item.current {
    color: #f4efe6;
    background: #25232a;
    cursor: default;
  }

  .breadcrumb-separator {
    color: #4a3a2c;
    font-size: 0.875rem;
    user-select: none;
  }

  @media (max-width: 768px) {
    .breadcrumb-container {
      padding: 12px 16px;
      gap: 12px;
    }

    .back-button {
      min-width: 36px;
      height: 36px;
      padding: 6px 10px;
    }

    .breadcrumb {
      font-size: 0.8125rem;
      gap: 6px;
    }

    .breadcrumb-item {
      padding: 4px 8px;
      font-size: 0.8125rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .back-button:hover {
      transform: none;
    }
  }
</style>
