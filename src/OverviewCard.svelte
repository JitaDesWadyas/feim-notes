<script>
  import { createEventDispatcher } from 'svelte';
  import { router } from './router.js';
  
  export let category;
  export let selectedNodeId = null;
  
  const dispatch = createEventDispatcher();
  
  let editing = false;
  let editText = category.text;
  let textareaElement = null;
  let longPressTimer = null;
  let touchStartTime = 0;
  let clickTimeout = null;
  
  $: isSelected = selectedNodeId === category.id;
  $: noteCount = countNotes(category);
  
  function countNotes(node) {
    if (!node.children || node.children.length === 0) return 0;
    let count = node.children.length;
    for (const child of node.children) {
      count += countNotes(child);
    }
    return count;
  }
  
  function handleInput(e) {
    editText = e.target.innerText || e.target.textContent || '';
  }
  
  function handleCardClick(e) {
    if (editing) return;
    
    e.stopPropagation();
    
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      if (editing) return;
      
      router.navigateToWorkspace(category.id, category.title);
    }, 250);
  }
  
  function handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    dispatch('contextmenu', { 
      nodeId: category.id, 
      x: e.clientX, 
      y: e.clientY 
    });
    dispatch('select', { nodeId: category.id });
  }
  
  function handleTouchStart(e) {
    if (editing) return;
    touchStartTime = Date.now();
    
    longPressTimer = setTimeout(() => {
      const touch = e.touches[0];
      dispatch('contextmenu', { 
        nodeId: category.id, 
        x: touch.clientX, 
        y: touch.clientY 
      });
      dispatch('select', { nodeId: category.id });
    }, 500);
  }
  
  function handleTouchEnd(e) {
    clearTimeout(longPressTimer);
    
    if (Date.now() - touchStartTime < 500) {
      handleCardClick(e);
    }
  }
  
  function handleTouchMove() {
    clearTimeout(longPressTimer);
  }
  
  export function startEdit() {
    editing = true;
    editText = category.text;
    setTimeout(() => {
      const input = document.querySelector(`[data-node-id="${category.id}"] .category-text-editable`);
      if (input) {
        textareaElement = input;
        input.innerText = editText;
        input.focus();
        
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  }
  
  function commitEdit() {
    if (editText.trim() !== category.text) {
      dispatch('edit', { nodeId: category.id, text: editText.trim() });
    }
    editing = false;
    clearTimeout(clickTimeout);
  }
  
  function handleBlur() {
    setTimeout(() => {
      commitEdit();
    }, 0);
  }
  
  function cancelEdit() {
    editing = false;
    editText = category.text;
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }
  
  function handleDoubleClick(e) {
    if (!editing) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(clickTimeout);
      startEdit();
    }
  }
</script>

<div 
  class="category-card"
  class:selected={isSelected}
  class:editing={editing}
  data-node-id={category.id}
  role="button"
  tabindex="0"
  on:click={handleCardClick}
  on:dblclick={handleDoubleClick}
  on:contextmenu={handleContextMenu}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  on:touchmove={handleTouchMove}
  on:keydown={(e) => e.key === 'Enter' && !editing && handleCardClick(e)}
>
  <div class="card-content">
    {#if editing}
      <div
        class="category-text category-text-editable"
        contenteditable="true"
        bind:this={textareaElement}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        on:blur={handleBlur}
        on:click={(e) => e.stopPropagation()}
        on:touchstart={(e) => e.stopPropagation()}
      ></div>
    {:else}
      <h3 class="category-title">{category.title || '(empty)'}</h3>
    {/if}
    
    <div class="category-meta">
      <span class="note-count">
        {noteCount} {noteCount === 1 ? 'note' : 'notes'}
      </span>
      <span class="chevron-right">→</span>
    </div>
  </div>
</div>

<style>
  .category-card {
    background: linear-gradient(135deg, #3e3b47 0%, #1e1c24 100%);
    border: 1px solid #4a3a2c;
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    position: relative;
    overflow: hidden;
  }

  .category-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .category-card:hover {
    background: linear-gradient(135deg, #454250 0%, #242229 100%);
    border-color: #5a4634;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .category-card:hover::before {
    opacity: 1;
  }

  .category-card:active:not(.editing) {
    transform: translateY(0) scale(0.99);
  }

  .category-card.selected {
    background: linear-gradient(135deg, #3d3b46 0%, #1e1c26 100%);
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1),
                inset 0 0 0 1px rgba(251, 191, 36, 0.1);
  }

  .category-card.selected::before {
    opacity: 1;
  }

  .category-card.editing {
    background: linear-gradient(135deg, #35333c 0%, #16141a 100%);
    border-color: rgba(251, 191, 36, 0.5);
    cursor: text;
    box-shadow: 0 2px 12px rgba(251, 191, 36, 0.15);
  }

  .card-content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
    margin: 0;
    letter-spacing: -0.01em;
    line-height: 1.4;
  }

  .category-text-editable {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
    outline: none;
    cursor: text;
    line-height: 1.4;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .category-text-editable:focus {
    outline: none;
  }

  .category-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
  }

  .note-count {
    color: #a79d8f;
    font-weight: 500;
  }

  .chevron-right {
    color: #fbbf24;
    font-size: 1rem;
    opacity: 0.7;
    transition: transform 0.15s ease;
  }

  .category-card:hover .chevron-right {
    transform: translateX(4px);
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .category-card:hover,
    .category-card:active {
      transform: none;
    }

    .category-card:hover .chevron-right {
      transform: none;
    }
  }

  @media (max-width: 768px) {
    .card-content {
      padding: 16px 20px;
      gap: 10px;
    }

    .category-title,
    .category-text-editable {
      font-size: 1.125rem;
    }

    .category-meta {
      font-size: 0.8125rem;
    }
  }
</style>
