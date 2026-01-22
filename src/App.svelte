<script>
  import { onMount } from 'svelte';
  import { saveTree, loadTree, createDefaultTree } from './db.js';
  import { 
    findNodeById, 
    findParentAndIndex, 
    deleteNodeById, 
    cloneNode 
  } from './treeUtils.js';
  import Node from './Node.svelte';
  import ContextMenu from './ContextMenu.svelte';

  let tree = createDefaultTree();
  let history = [];
  let historyIndex = -1;
  let saveTimeout = null;
  let searchQuery = '';
  let clipboard = null;
  let selectedNodeId = null;
  
  // Context menu state
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuNode = null;

  onMount(async () => {
    const saved = await loadTree();
    if (saved) {
      tree = saved;
    }
    pushHistory();
    
    // Close context menu on click outside
    document.addEventListener('click', closeContextMenu);
    document.addEventListener('touchstart', closeContextMenu);
    
    return () => {
      document.removeEventListener('click', closeContextMenu);
      document.removeEventListener('touchstart', closeContextMenu);
    };
  });

  function closeContextMenu() {
    contextMenuVisible = false;
    contextMenuNode = null;
  }

  function pushHistory() {
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    history.push(JSON.parse(JSON.stringify(tree)));
    historyIndex++;
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveTree(tree);
    }, 400);
  }

  function handleSelect(event) {
    selectedNodeId = event.detail.nodeId;
  }

  function handleToggle(event) {
    const { nodeId } = event.detail;
    const node = findNodeById(tree.roots, nodeId);
    if (node) {
      node.collapsed = !node.collapsed;
      tree = tree;
      pushHistory();
    }
  }

  function handleEdit(event) {
    const { nodeId, text } = event.detail;
    const node = findNodeById(tree.roots, nodeId);
    if (node) {
      node.text = text;
      tree = tree;
      pushHistory();
    }
  }

  function handleContextMenu(event) {
    event.detail && event.detail.nodeId && (selectedNodeId = event.detail.nodeId);
    const node = findNodeById(tree.roots, event.detail.nodeId);
    if (node) {
      contextMenuNode = node;
      contextMenuX = event.detail.x;
      contextMenuY = event.detail.y;
      contextMenuVisible = true;
    }
  }

  function handleMenuEdit() {
    if (contextMenuNode) {
      const element = document.querySelector(`[data-node-id="${contextMenuNode.id}"]`);
      if (element) {
        const nodeComponent = element.__svelte_meta;
        // Trigger edit via double click simulation
        setTimeout(() => {
          const textarea = element.querySelector('textarea');
          if (!textarea) {
            // Find and trigger startEdit if available
            const event = new CustomEvent('dblclick');
            element.querySelector('.node-content')?.dispatchEvent(event);
          }
        }, 50);
      }
    }
    closeContextMenu();
  }

  function handleMenuAddChild() {
    if (contextMenuNode) {
      const parent = findNodeById(tree.roots, contextMenuNode.id);
      if (parent) {
        parent.collapsed = false;
        const newNode = {
          id: crypto.randomUUID(),
          text: '',
          collapsed: true,
          children: []
        };
        parent.children.push(newNode);
        tree = tree;
        pushHistory();
        selectedNodeId = newNode.id;
      }
    }
    closeContextMenu();
  }

  function handleMenuDelete() {
    if (contextMenuNode && confirm(`Delete "${contextMenuNode.text}" and all its children?`)) {
      deleteNodeById(tree.roots, contextMenuNode.id);
      selectedNodeId = null;
      tree = tree;
      pushHistory();
    }
    closeContextMenu();
  }

  function handleMenuCopy() {
    if (contextMenuNode) {
      clipboard = JSON.parse(JSON.stringify(contextMenuNode));
    }
    closeContextMenu();
  }

  function handleMenuPaste() {
    if (contextMenuNode && clipboard) {
      const parent = findNodeById(tree.roots, contextMenuNode.id);
      if (parent) {
        parent.collapsed = false;
        const newNode = cloneNode(clipboard);
        parent.children.push(newNode);
        tree = tree;
        pushHistory();
      }
    }
    closeContextMenu();
  }

  function handleMenuMoveUp() {
    if (contextMenuNode) {
      const result = findParentAndIndex(tree.roots, contextMenuNode.id);
      if (result && result.index > 0) {
        const { siblings, index } = result;
        [siblings[index - 1], siblings[index]] = [siblings[index], siblings[index - 1]];
        tree = tree;
        pushHistory();
      }
    }
    closeContextMenu();
  }

  function handleMenuMoveDown() {
    if (contextMenuNode) {
      const result = findParentAndIndex(tree.roots, contextMenuNode.id);
      if (result && result.index < result.siblings.length - 1) {
        const { siblings, index } = result;
        [siblings[index], siblings[index + 1]] = [siblings[index + 1], siblings[index]];
        tree = tree;
        pushHistory();
      }
    }
    closeContextMenu();
  }

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchInTree(tree.roots, searchQuery.toLowerCase());
      tree = tree;
    }
  }

  function searchInTree(nodes, query) {
    let found = false;
    for (const node of nodes) {
      if (node.text.toLowerCase().includes(query)) {
        node.collapsed = false;
        found = true;
      }
      if (node.children && node.children.length > 0) {
        const childFound = searchInTree(node.children, query);
        if (childFound) {
          node.collapsed = false;
          found = true;
        }
      }
    }
    return found;
  }
</script>

<svelte:body on:contextmenu|preventDefault />

<div class="app">
  <!-- Header -->
  <header class="header">
    <h1>FEIM Notes</h1>
    <div class="search-container">
      <input 
        type="search" 
        placeholder="Search..." 
        bind:value={searchQuery}
        on:keydown={handleSearch}
        class="search-input"
      />
    </div>
  </header>

  <!-- Tree Area (full width) -->
  <div class="tree-area">
    {#each tree.roots as node (node.id)}
      <Node 
        {node} 
        depth={0}
        {selectedNodeId}
        on:select={handleSelect}
        on:toggle={handleToggle}
        on:edit={handleEdit}
        on:contextmenu={handleContextMenu}
      />
    {/each}
  </div>

  <!-- Context Menu -->
  {#if contextMenuVisible && contextMenuNode}
    <ContextMenu 
      x={contextMenuX}
      y={contextMenuY}
      node={contextMenuNode}
      hasClipboard={!!clipboard}
      on:edit={handleMenuEdit}
      on:addChild={handleMenuAddChild}
      on:delete={handleMenuDelete}
      on:copy={handleMenuCopy}
      on:paste={handleMenuPaste}
      on:moveUp={handleMenuMoveUp}
      on:moveDown={handleMenuMoveDown}
    />
  {/if}
</div>

<style>
  :global(body) {
    background: #0f0e11;
    color: #f4efe6;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    /* FEIM OTT texture */
    background-image: 
      radial-gradient(1200px 800px at 15% -15%, rgba(160, 140, 110, 0.05), transparent 60%),
      radial-gradient(900px 700px at 85% 120%, rgba(90, 70, 45, 0.18), transparent 60%),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.015) 0px, rgba(255, 255, 255, 0.015) 1px, transparent 1px, transparent 3px),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.012) 0px, rgba(255, 255, 255, 0.012) 1px, transparent 1px, transparent 4px);
    background-size: cover, cover, 3px 3px, 4px 4px;
  }

  :global(body)::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.35;
    mix-blend-mode: soft-light;
    background-image:
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 40%),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0px, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 5px),
      repeating-linear-gradient(90deg, rgba(120, 90, 55, 0.035) 0px, rgba(120, 90, 55, 0.035) 1px, transparent 1px, transparent 6px);
    z-index: 0;
  }

  .app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* FEIM OTT exact header style */
  .header {
    flex-shrink: 0;
    background: #1a181d;
    border-bottom: 1px solid #4a3a2c;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 24px;
    height: 56px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
  }

  h1 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    color: #fbbf24;
    letter-spacing: -0.01em;
    text-transform: none;
    position: relative;
  }

  .search-container {
    flex: 1;
    max-width: 420px;
  }

  .search-input {
    width: 100%;
    background: #25232a;
    border: 1px solid #4a3a2c;
    color: #f4efe6;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 1rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    transition: all 0.15s ease;
  }

  .search-input::placeholder {
    color: #a79d8f;
  }

  .search-input:focus {
    outline: none;
    border-color: #fbbf24;
    background: #2d2b32;
    box-shadow: 0 0 0 1px #fbbf24;
  }

  .tree-area {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px 32px;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    background: #0f0e11;
    position: relative;
    z-index: 1;
  }

  .tree-area::-webkit-scrollbar {
    width: 10px;
  }

  .tree-area::-webkit-scrollbar-track {
    background: #0f0e11;
  }

  .tree-area::-webkit-scrollbar-thumb {
    background: #25232a;
    border: 2px solid #0f0e11;
    border-radius: 4px;
  }

  .tree-area::-webkit-scrollbar-thumb:hover {
    background: #2d2b32;
  }

  @media (max-width: 768px) {
    .header {
      padding: 12px 16px;
      flex-wrap: wrap;
      height: auto;
      gap: 12px;
    }

    h1 {
      font-size: 1rem;
    }

    .search-container {
      max-width: 100%;
      order: 3;
      flex-basis: 100%;
    }

    .tree-area {
      padding: 16px;
    }
  }
</style>
