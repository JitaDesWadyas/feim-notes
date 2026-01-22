<script>
  import { createEventDispatcher } from 'svelte';
  
  export let x = 0;
  export let y = 0;
  export let node = null;
  export let hasClipboard = false;
  
  const dispatch = createEventDispatcher();
  
  function handleAction(action) {
    dispatch(action);
  }
</script>

{#if node}
  <div class="context-menu" style="left: {x}px; top: {y}px;">
    <div class="menu-header">
      <div class="menu-title">{node.text || '(empty)'}</div>
    </div>
    
    <button class="menu-item" on:click={() => handleAction('edit')}>
      <span class="menu-icon">✎</span>
      <span>Edit</span>
    </button>
    
    <button class="menu-item" on:click={() => handleAction('addChild')}>
      <span class="menu-icon">+</span>
      <span>Add Child</span>
    </button>
    
    <div class="menu-divider"></div>
    
    <button class="menu-item" on:click={() => handleAction('copy')}>
      <span class="menu-icon">📋</span>
      <span>Copy</span>
    </button>
    
    {#if hasClipboard}
      <button class="menu-item" on:click={() => handleAction('paste')}>
        <span class="menu-icon">📥</span>
        <span>Paste</span>
      </button>
    {/if}
    
    <div class="menu-divider"></div>
    
    <button class="menu-item" on:click={() => handleAction('moveUp')}>
      <span class="menu-icon">↑</span>
      <span>Move Up</span>
    </button>
    
    <button class="menu-item" on:click={() => handleAction('moveDown')}>
      <span class="menu-icon">↓</span>
      <span>Move Down</span>
    </button>
    
    <div class="menu-divider"></div>
    
    <button class="menu-item danger" on:click={() => handleAction('delete')}>
      <span class="menu-icon">🗑</span>
      <span>Delete</span>
    </button>
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    z-index: 1050;
    background: #1a181d;
    border: 1px solid #4a3a2c;
    border-radius: 4px;
    box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.5);
    min-width: 220px;
    padding: 8px;
    backdrop-filter: blur(8px);
  }

  .menu-header {
    padding: 12px 16px;
    border-bottom: 1px solid #4a3a2c;
    margin-bottom: 8px;
  }

  .menu-title {
    color: #f4efe6;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .menu-item {
    width: 100%;
    background: transparent;
    border: none;
    color: #d3c9bb;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.15s ease;
    text-align: left;
  }

  .menu-item:hover {
    background: #25232a;
    color: #f4efe6;
  }

  .menu-item:active {
    background: #2d2b32;
  }

  .menu-item.danger {
    color: #f87171;
  }

  .menu-item.danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
  }

  .menu-icon {
    font-size: 1.125rem;
    width: 20px;
    text-align: center;
    opacity: 0.85;
  }

  .menu-divider {
    height: 1px;
    background: #4a3a2c;
    margin: 8px 0;
  }

  /* Mobile floating modal */
  @media (max-width: 768px) {
    .context-menu {
      left: 50% !important;
      top: 50% !important;
      right: auto;
      bottom: auto;
      transform: translate(-50%, -50%);
      border-radius: 4px;
      max-width: 280px;
      min-width: 240px;
      width: 85vw;
    }

    .menu-header {
      padding: 12px 16px;
    }

    .menu-title {
      font-size: 0.875rem;
      max-width: 180px;
    }

    .menu-item {
      padding: 12px 16px;
      font-size: 0.875rem;
    }

    .menu-icon {
      font-size: 1.125rem;
      width: 20px;
    }

    .menu-divider {
      margin: 8px 0;
    }
  }
</style>
