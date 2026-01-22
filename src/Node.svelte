<script>
  import { createEventDispatcher } from 'svelte';
  
  export let node;
  export let depth = 0;
  export let selectedNodeId = null;
  
  const dispatch = createEventDispatcher();
  
  let editing = false;
  let editText = node.text;
  let longPressTimer = null;
  let touchStartTime = 0;
  
  $: isSelected = selectedNodeId === node.id;
  
  function handleNodeClick(e) {
    if (editing) return;
    
    // Toggle expand/collapse on any click
    if (node.children && node.children.length > 0) {
      dispatch('toggle', { nodeId: node.id });
    }
    
    // Also select the node
    dispatch('select', { nodeId: node.id });
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
      const input = document.querySelector(`[data-node-id="${node.id}"] textarea`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 10);
  }
  
  function commitEdit() {
    if (editText.trim() !== node.text) {
      dispatch('edit', { nodeId: node.id, text: editText.trim() });
    }
    editing = false;
  }
  
  function cancelEdit() {
    editing = false;
    editText = node.text;
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }
  
  function handleDoubleClick(e) {
    if (!editing) {
      e.stopPropagation();
      startEdit();
    }
  }
</script>

<div 
  class="node" 
  data-depth={depth}
  style="--node-depth: {depth}"
  data-node-id={node.id}
>
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
    <!-- Visual caret (non-interactive) -->
    <div class="node-caret">
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
        <textarea 
          bind:value={editText}
          on:keydown={handleKeyDown}
          on:blur={commitEdit}
          on:click={(e) => e.stopPropagation()}
          on:touchstart={(e) => e.stopPropagation()}
          class="node-input"
          rows="1"
        />
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
          {selectedNodeId}
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

  /* Root nodes (FEIM) */
  .node[data-depth="0"] {
    margin: 0 0 24px 0;
  }

  .node[data-depth="0"] .node-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fbbf24;
    letter-spacing: -0.01em;
  }

  /* Section nodes (depth 1) */
  .node[data-depth="1"] {
    margin: 0 0 16px 0;
  }

  .node[data-depth="1"] .node-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fbbf24;
    letter-spacing: -0.01em;
  }

  /* Child notes (depth 2+) */
  .node[data-depth="2"],
  .node[data-depth="3"],
  .node[data-depth="4"],
  .node[data-depth="5"],
  .node[data-depth="6"],
  .node[data-depth="7"],
  .node[data-depth="8"],
  .node[data-depth="9"] {
    margin: 0 0 8px 0;
    padding-left: calc((var(--node-depth, 2) - 1) * 16px);
    position: relative;
  }

  /* No vertical guides - depth shown by indentation only */

  .node-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.15s ease;
    background: #25232a;
    border: 1px solid #4a3a2c;
    border-radius: 4px;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    margin: 4px 0;
  }

  .node-content:hover {
    background: #2d2b32;
    border-color: #5a4634;
  }

  .node-content.selected {
    background: #2d2b32;
    border-color: rgba(251, 191, 36, 0.4);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
  }

  .node-content.editing {
    background: #1a181d;
    border-color: #fbbf24;
    cursor: default;
    box-shadow: 0 0 0 1px #fbbf24;
  }

  .node-caret {
    flex-shrink: 0;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
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
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Child nodes have lighter text */
  .node[data-depth="2"] .node-text,
  .node[data-depth="3"] .node-text,
  .node[data-depth="4"] .node-text,
  .node[data-depth="5"] .node-text,
  .node[data-depth="6"] .node-text,
  .node[data-depth="7"] .node-text,
  .node[data-depth="8"] .node-text,
  .node[data-depth="9"] .node-text {
    color: #d3c9bb;
    font-size: 1rem;
    line-height: 1.6;
  }

  .node-input {
    width: 100%;
    background: #25232a;
    border: 1px solid #fbbf24;
    color: #f4efe6;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    resize: vertical;
    min-height: 2.5rem;
    transition: all 0.15s ease;
  }

  .node-input:focus {
    outline: none;
    border-color: #fbbf24;
    background: #2d2b32;
    box-shadow: 0 0 0 1px #fbbf24;
  }

  .node-children {
    margin: 8px 0 0 0;
  }

  /* Root children spacing */
  .node[data-depth="0"] > .node-children {
    margin: 12px 0 0 0;
  }

  /* Section children spacing */
  .node[data-depth="1"] > .node-children {
    margin: 12px 0 0 0;
  }
</style>
