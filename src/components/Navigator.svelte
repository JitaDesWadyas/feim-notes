<script>
  import { createEventDispatcher } from 'svelte';
  import { getCategoryRoots } from '../lib/graphUtils.js';
  import NavigatorItem from './workspace/NavigatorItem.svelte';
  
  export let categoryId;
  export let nodes;
  export let nodesMap;
  export let childrenByFromId;
  export let parentsByToId;
  export let selectedNodeId = null;
  
  const dispatch = createEventDispatcher();
  
  let expandedPaths = new Set();
  
  $: roots = getCategoryRoots(categoryId, nodes, parentsByToId);
  
  function handleSelect(event) {
    dispatch('select', event.detail);
  }
  
  function handleToggle(event) {
    const { pathKey } = event.detail;
    if (expandedPaths.has(pathKey)) {
      expandedPaths.delete(pathKey);
    } else {
      expandedPaths.add(pathKey);
    }
    expandedPaths = expandedPaths;
  }
  
  function handleContextMenu(event) {
    dispatch('contextmenu', event.detail);
  }
</script>

<div class="navigator">
  <div class="navigator-content">
    {#if roots.length > 0}
      {#each roots as node (node.id)}
        <NavigatorItem 
          {node}
          {nodesMap}
          {childrenByFromId}
          {selectedNodeId}
          {expandedPaths}
          pathNodeIds={[]}
          on:select={handleSelect}
          on:toggle={handleToggle}
          on:contextmenu={handleContextMenu}
        />
      {/each}
    {:else}
      <div class="empty-nav">
        <p>No notes yet</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .navigator {
    height: 100%;
    background: #16141a;
    border-right: 1px solid #4a3a2c;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .navigator-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }
  
  .empty-nav {
    padding: 32px 16px;
    text-align: center;
  }
  
  .empty-nav p {
    color: #a79d8f;
    font-size: 0.875rem;
    font-style: italic;
    margin: 0;
  }
  
  .navigator-content::-webkit-scrollbar {
    width: 8px;
  }
  
  .navigator-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .navigator-content::-webkit-scrollbar-thumb {
    background: #4a3a2c;
    border-radius: 4px;
  }
</style>
