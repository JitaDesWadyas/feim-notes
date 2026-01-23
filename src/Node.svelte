<script>
  import { createEventDispatcher } from 'svelte';
  
  export let node;
  export let depth = 0;
  export let maxDepth = 0;
  export let selectedNodeId = null;
  export let isAnyNodeEditing = false;
  export let localMaxDepth = 0; // Max depth within this root's subtree
  
  const dispatch = createEventDispatcher();
  
  // Calculate local max depth for this subtree
  function calculateLocalMaxDepth(n, currentDepth = 0) {
    let max = currentDepth;
    if (n.children && n.children.length > 0) {
      for (const child of n.children) {
        max = Math.max(max, calculateLocalMaxDepth(child, currentDepth + 1));
      }
    }
    return max;
  }
  
  // For root nodes, calculate their own max depth
  $: if (depth === 0) {
    localMaxDepth = calculateLocalMaxDepth(node);
  }
  
  // Calculate line width percentage based on depth relative to local max
  $: lineWidthPercent = localMaxDepth > 0 ? ((depth + 1) / (localMaxDepth + 1)) * 100 : 0;
  
  let editing = false;
  let editText = node.text;
  let longPressTimer = null;
  let touchStartTime = 0;
  let clickTimeout = null;
  let textareaElement = null;
  
  // Update global editing state
  $: isAnyNodeEditing = editing;
  
  $: isSelected = selectedNodeId === node.id;
  
  // Auto-resize textarea
  function autoResize(element) {
    // Not needed for contenteditable
  }
  
  $: if (editing && textareaElement) {
    // Not needed for contenteditable
  }
  
  function handleInput(e) {
    // Convert innerHTML to plain text preserving line breaks
    const element = e.target;
    editText = element.innerText || element.textContent || '';
  }
  
  function handleNodeClick(e) {
    // Don't do anything if ANY node is being edited
    if (isAnyNodeEditing) {
      return;
    }
    
    // Stop propagation to prevent deselection
    e.stopPropagation();
    
    // Delay single click to check if double-click comes
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      // Check again before executing
      if (isAnyNodeEditing) return;
      
      // Single click - toggle expand/collapse
      if (node.children && node.children.length > 0) {
        dispatch('toggle', { nodeId: node.id });
      }
      
      // Also select the node
      dispatch('select', { nodeId: node.id });
    }, 250);
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
    
    // If released quickly, it's a tap
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
        // Set innerText to preserve line breaks
        input.innerText = editText;
        input.focus();
        
        // Scroll into view for mobile keyboard
        setTimeout(() => {
          input.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
        
        // Move cursor to end
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
    // Cancel any pending click actions on ALL nodes
    clearTimeout(clickTimeout);
  }
  
  function handleBlur(e) {
    // Small delay to allow the blur to complete before committing
    // This prevents the click that caused the blur from triggering expand/collapse
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
    // Allow Enter for new lines (removed the Enter-to-commit behavior)
  }
  
  function handleDoubleClick(e) {
    if (!editing) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(clickTimeout); // Cancel the pending single click
      startEdit();
    }
  }
</script>

<div 
  class="node" 
  data-depth={depth}
  style="--node-depth: {depth}; --line-width: {lineWidthPercent}%;"
  data-node-id={node.id}
>
  <!-- Vertical line for root groups (only on depth 0 with children) -->
  {#if depth === 0 && node.children && node.children.length > 0 && !node.collapsed}
    <div class="root-vertical-line"></div>
  {/if}

  <div 
    class="node-content"
    class:selected={isSelected}
    class:editing={editing}
    class:has-children={node.children && node.children.length > 0}
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
    <!-- Visual caret -->
    <div class="node-caret" on:click={handleNodeClick} on:dblclick={(e) => { if (!editing) e.stopPropagation(); }}>
      {#if node.children && node.children.length > 0}
        <span class="caret-icon">
          {node.collapsed ? '▸' : '▾'}
        </span>
      {:else}
        <span class="caret-placeholder"></span>
      {/if}
    </div>
    
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
  
  {#if !node.collapsed && node.children && node.children.length > 0}
    <div class="node-children">
      {#each node.children as child (child.id)}
        <svelte:self 
          node={child} 
          depth={depth + 1}
          {maxDepth}
          localMaxDepth={depth === 0 ? localMaxDepth : localMaxDepth}
          {selectedNodeId}
          bind:isAnyNodeEditing
          on:select
          on:toggle
          on:edit
          on:contextmenu
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .node {
    position: relative;
  }

  /* Vertical line for root groups */
  .root-vertical-line {
    position: absolute;
    left: -1px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #fbbf24;
    border-radius: 1px;
    box-shadow: 0 0 4px rgba(251, 191, 36, 0.4);
    z-index: 10;
  }

  /* Root nodes (depth 0) */
  .node[data-depth="0"] {
    margin: 0 0 24px 0;
  }

  .node[data-depth="0"] .node-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
    letter-spacing: -0.01em;
  }

  /* All child nodes - same styling and spacing */
  .node[data-depth="1"],
  .node[data-depth="2"],
  .node[data-depth="3"],
  .node[data-depth="4"],
  .node[data-depth="5"],
  .node[data-depth="6"],
  .node[data-depth="7"],
  .node[data-depth="8"],
  .node[data-depth="9"],
  .node[data-depth="10"] {
    margin: 0 0 12px 0;
    position: relative;
  }

  /* All child nodes have the same text style */
  .node[data-depth="1"] .node-text,
  .node[data-depth="2"] .node-text,
  .node[data-depth="3"] .node-text,
  .node[data-depth="4"] .node-text,
  .node[data-depth="5"] .node-text,
  .node[data-depth="6"] .node-text,
  .node[data-depth="7"] .node-text,
  .node[data-depth="8"] .node-text,
  .node[data-depth="9"] .node-text,
  .node[data-depth="10"] .node-text {
    color: #d3c9bb;
    font-size: 1rem;
    line-height: 1.6;
  }

  .node-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: linear-gradient(135deg, #35333c 0%, #16141a 100%);
    border: 1px solid #4a3a2c;
    border-radius: 4px;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    margin: 4px 0;
  }

  /* Depth indicator lines - ONLY top border */
  .node-content::before {
    content: '';
    position: absolute;
    left: 0;
    top: -1px;
    height: 2px;
    width: var(--line-width, 0%);
    background: #fbbf24;
    border-radius: 1px;
    box-shadow: 0 0 4px rgba(251, 191, 36, 0.4);
    transition: all 0.15s ease;
  }

  .node-content.selected::before {
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
  }

  .node-content:hover {
    background: linear-gradient(135deg, #3d3b46 0%, #1c1a20 100%);
    border-color: #5a4634;
  }

  .node-content.selected {
    background: linear-gradient(135deg, #3d3b46 0%, #1e1c26 100%);
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
  }

  .node-content.editing {
    background: linear-gradient(135deg, #35333c 0%, #16141a 100%);
    border-color: rgba(251, 191, 36, 0.4);
    cursor: text;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
  }

  .node-caret {
    flex-shrink: 0;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
  }

  .caret-icon {
    color: #fbbf24;
    font-size: 0.875rem;
    line-height: 1;
    opacity: 0.85;
  }

  .caret-placeholder {
    width: 20px;
    display: inline-block;
  }

  .node-text-wrapper {
    flex: 1;
    min-width: 0;
  }

  .node-text {
    color: #f4efe6;
    font-size: 1rem;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .node-text-editable {
    outline: none;
    cursor: text;
  }

  .node-text-editable:focus {
    outline: none;
  }

  .node-children {
    margin: 12px 0 0 0;
  }
</style>
