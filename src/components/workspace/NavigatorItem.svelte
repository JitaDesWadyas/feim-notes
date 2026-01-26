<script>
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { getChildren, isInPath } from '../../lib/graphUtils.js';
  
  export let node;
  export let edge = null;
  export let nodesMap;
  export let childrenByFromId;
  export let selectedNodeId = null;
  export let pathNodeIds = [];
  export let expandedPaths = new Set();
  export let depth = 0;
  
  const dispatch = createEventDispatcher();
  
  $: pathKey = edge ? `${edge.fromId}-${edge.id}` : `root-${node.id}`;
  $: isExpanded = expandedPaths.has(pathKey);
  $: isSelected = selectedNodeId === node.id;
  $: childEdges = getChildren(node.id, childrenByFromId);
  $: hasChildren = childEdges.length > 0;
  $: isCycle = isInPath(node.id, pathNodeIds);
  $: newPath = [...pathNodeIds, node.id];
  
  function handleToggle(e) {
    e.stopPropagation();
    if (hasChildren && !isCycle) {
      dispatch('toggle', { pathKey });
    }
  }
  
  function handleSelect(e) {
    e.stopPropagation();
    dispatch('select', { nodeId: node.id });
  }
  
  function handleContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    dispatch('contextmenu', { 
      nodeId: node.id, 
      edge: edge,
      x: e.clientX, 
      y: e.clientY 
    });
  }
</script>

<div class="nav-item" style="--depth: {depth}">
  <div
    class="nav-row"
    class:selected={isSelected}
    class:has-children={hasChildren}
  >
    <button 
      class="chevron" 
      class:visible={hasChildren && !isCycle}
      on:click={handleToggle}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      {#if hasChildren && !isCycle}
        <span class="chevron-icon" style="transform: rotate({isExpanded ? 90 : 0}deg)">▸</span>
      {/if}
    </button>
    
    <button 
      class="nav-content"
      on:click={handleSelect}
      on:contextmenu={handleContextMenu}
    >
      <span class="nav-title">{node.title || 'Untitled'}</span>
      
      {#if isCycle}
        <span class="cycle-badge">↻</span>
      {/if}
    </button>
  </div>
  
  {#if isExpanded && hasChildren && !isCycle}
    <div class="nav-children" transition:slide={{ duration: 180, easing: quintOut }}>
      {#each childEdges as childEdge (childEdge.id)}
        {@const childNode = nodesMap.get(childEdge.toId)}
        {#if childNode}
          <svelte:self 
            node={childNode}
            edge={childEdge}
            {nodesMap}
            {childrenByFromId}
            {selectedNodeId}
            pathNodeIds={newPath}
            {expandedPaths}
            depth={depth + 1}
            on:select
            on:toggle
            on:contextmenu
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .nav-item {
    margin: 0;
  }
  
  .nav-row {
    display: flex;
    align-items: center;
    gap: 4px;
    border-bottom: 1px solid rgba(74, 58, 44, 0.3);
  }
  
  .nav-row.selected .nav-content {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border-left: 2px solid #fbbf24;
  }
  
  .chevron {
    flex-shrink: 0;
    width: 20px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: calc(var(--depth, 0) * 16px);
  }
  
  .chevron:not(.visible) {
    opacity: 0;
    pointer-events: none;
  }
  
  .nav-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #d3c9bb;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    min-width: 0;
  }
  
  .nav-content:hover {
    background: rgba(45, 43, 50, 0.5);
    color: #f4efe6;
  }
  
  .chevron-icon {
    color: #fbbf24;
    font-size: 0.625rem;
    line-height: 1;
    display: inline-block;
    transition: transform 0.18s ease;
    will-change: transform;
  }
  
  .nav-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .cycle-badge {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: #a79d8f;
    opacity: 0.7;
  }
  
  .nav-children {
    overflow: hidden;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .chevron-icon {
      transition: none;
    }
  }
</style>
