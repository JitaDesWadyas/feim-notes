<script>
  import { createEventDispatcher } from 'svelte';
  import { slide, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut, cubicOut } from 'svelte/easing';
  
  export let node;
  export let depth = 0;
  export let selectedNodeId = null;
  export let isAnyNodeEditing = false;
  
  const dispatch = createEventDispatcher();
  
  let editing = false;
  let editText = node.text;
  let longPressTimer = null;
  let touchStartTime = 0;
  let clickTimeout = null;
  let textareaElement = null;
  
  $: isAnyNodeEditing = editing;
  $: isSelected = selectedNodeId === node.id;
  $: hasChildren = node.children && node.children.length > 0;
  $: isExpanded = !node.collapsed && hasChildren;
  
  // Chevron rotation angle
  $: chevronRotation = isExpanded ? 90 : 0;
  
  function handleInput(e) {
    editText = e.target.innerText || e.target.textContent || '';
  }
  
  function handleNodeClick(e) {
    if (isAnyNodeEditing) return;
    
    e.stopPropagation();
    
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      if (isAnyNodeEditing) return;
      
      // Toggle expand/collapse if has children
      if (hasChildren) {
        dispatch('toggle', { nodeId: node.id });
      }
      
      // Select node
      dispatch('select', { nodeId: node.id });
    }, 250);
  }
  
  function handleChevronClick(e) {
    e.stopPropagation();
    if (hasChildren && !isAnyNodeEditing) {
      dispatch('toggle', { nodeId: node.id });
    }
  }
  
  function handleContextMenu(e) {
    e.preventDefault();
    dispatch('contextmenu', { 
      nodeId: node.id, 
      x: e.clientX, 
      y: e.clientY 
    });
  }
  
  function handleTouchStart(e) {
    if (editing) return;
    touchStartTime = Date.now();
    
    longPressTimer = setTimeout(() => {
      const touch = e.touches[0];
      dispatch('contextmenu', { 
        nodeId: node.id, 
        x: touch.clientX, 
        y: touch.clientY 
      });
    }, 500);
  }
  
  function handleTouchEnd(e) {
    clearTimeout(longPressTimer);
    
    if (Date.now() - touchStartTime < 500) {
      handleNodeClick(e);
    }
  }
  
  function handleTouchMove() {
    clearTimeout(longPressTimer);
  }
  
  export function startEdit() {
    editing = true;
    editText = node.text;
    setTimeout(() => {
      const input = document.querySelector(`[data-node-id="${node.id}"] .node-text-editable`);
      if (input) {
        textareaElement = input;
        input.innerText = editText;
        input.focus();
        
        setTimeout(() => {
          const rect = input.getBoundingClientRect();
          const scrollContainer = document.scrollingElement;
          if (scrollContainer && rect.top < 150) {
            scrollContainer.scrollBy({
              top: rect.top - 200,
              behavior: 'smooth'
            });
          }
        }, 300);
        
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
    if (editText.trim() !== node.text) {
      dispatch('edit', { nodeId: node.id, text: editText.trim() });
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
    editText = node.text;
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
  class="category-node" 
  data-depth={depth}
  style="--indent: {depth * 24}px"
  data-node-id={node.id}
>
  <div 
    class="node-content"
    class:selected={isSelected}
    class:editing={editing}
    class:has-children={hasChildren}
    role="button"
    tabindex="0"
    on:click={handleNodeClick}
    on:dblclick={handleDoubleClick}
    on:contextmenu={handleContextMenu}
    on:touchstart={handleTouchStart}
    on:touchend={handleTouchEnd}
    on:touchmove={handleTouchMove}
    on:keydown={(e) => e.key === 'Enter' && !editing && startEdit()}
  >
    <!-- Indent spacer -->
    {#if depth > 0}
      <div class="indent-spacer"></div>
    {/if}

    <!-- Chevron with rotation animation -->
    <button 
      class="node-chevron" 
      class:visible={hasChildren}
      on:click={handleChevronClick}
      on:dblclick={(e) => { if (!editing) e.stopPropagation(); }}
      tabindex="-1"
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      aria-expanded={isExpanded}
    >
      {#if hasChildren}
        <span 
          class="chevron-icon"
          style="transform: rotate({chevronRotation}deg)"
        >
          ▸
        </span>
      {/if}
    </button>
    
    <!-- Text content -->
    <div class="node-text-wrapper">
      {#if editing}
        <div
          class="node-text node-text-editable"
          contenteditable="true"
          bind:this={textareaElement}
          on:input={handleInput}
          on:keydown={handleKeyDown}
          on:blur={handleBlur}
          on:click={(e) => e.stopPropagation()}
          on:touchstart={(e) => e.stopPropagation()}
        ></div>
      {:else}
        <div class="node-text">
          {node.text || '(empty)'}
        </div>
      {/if}
    </div>
  </div>
  
  {#if isExpanded}
    <div 
      class="node-children"
      transition:slide={{ duration: 180, easing: quintOut }}
    >
      {#each node.children as child (child.id)}
        <div animate:flip={{ duration: 180, easing: quintOut }}>
          <svelte:self 
            node={child} 
            depth={depth + 1}
            {selectedNodeId}
            bind:isAnyNodeEditing
            on:select
            on:toggle
            on:edit
            on:contextmenu
          />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .category-node {
    position: relative;
  }

  .node-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
    margin: 4px 0;
    cursor: pointer;
    background: linear-gradient(135deg, #35333c 0%, #16141a 100%);
    border: 1px solid #4a3a2c;
    border-radius: 4px;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    position: relative;
    transition: all 0.15s ease;
  }

  .node-content:hover {
    background: linear-gradient(135deg, #3d3b46 0%, #1c1a20 100%);
    border-color: #5a4634;
    transform: translateX(2px);
  }

  .node-content:active:not(.editing) {
    transform: scale(0.99) translateX(2px);
  }

  .node-content.selected {
    background: linear-gradient(135deg, #3d3b46 0%, #1e1c26 100%);
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1),
                inset 0 0 0 1px rgba(251, 191, 36, 0.1);
  }

  .node-content.editing {
    background: linear-gradient(135deg, #35333c 0%, #16141a 100%);
    border-color: rgba(251, 191, 36, 0.5);
    cursor: text;
    box-shadow: 0 2px 12px rgba(251, 191, 36, 0.15);
  }

  .indent-spacer {
    width: var(--indent, 0px);
    flex-shrink: 0;
  }

  .node-chevron {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .node-chevron.visible:hover {
    background: rgba(251, 191, 36, 0.1);
    border-radius: 3px;
  }

  .chevron-icon {
    color: #fbbf24;
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0.85;
    display: inline-block;
    transition: transform 0.18s cubic-out;
    will-change: transform;
  }

  .node-text-wrapper {
    flex: 1;
    min-width: 0;
  }

  .node-text {
    color: #d3c9bb;
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .node-text-editable {
    outline: none;
    cursor: text;
    color: #f4efe6;
  }

  .node-text-editable:focus {
    outline: none;
  }

  .node-children {
    margin: 4px 0 0 0;
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    .node-content:hover,
    .node-content:active {
      transform: none;
    }

    .chevron-icon {
      transition: none;
    }

    .node-children {
      transition: none;
    }
  }

  @media (max-width: 768px) {
    .node-content {
      padding: 10px 12px;
    }

    .indent-spacer {
      width: calc(var(--indent, 0px) * 0.75);
    }
  }
</style>
