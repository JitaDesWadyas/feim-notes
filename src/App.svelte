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
  let maxDepth = 0;
  let isAnyNodeEditing = false;
  
  // Calculate max depth in tree
  function calculateMaxDepth(nodes, currentDepth = 0) {
    let max = currentDepth;
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childMax = calculateMaxDepth(node.children, currentDepth + 1);
        max = Math.max(max, childMax);
      }
    }
    return max;
  }
  
  $: maxDepth = calculateMaxDepth(tree.roots);
  
  // Context menu state
  let contextMenuVisible = false;
  let contextMenuX = 0;
  let contextMenuY = 0;
  let contextMenuNode = null;
  let longPressTimer = null;
  let settingsMenuVisible = false;

  onMount(async () => {
    const saved = await loadTree();
    if (saved) {
      tree = saved;
    }
    
    // Ensure roots array exists
    if (!tree.roots) {
      tree.roots = [];
    }
    
    pushHistory();
    
    // Close context menu on click outside
    document.addEventListener('click', closeContextMenu);
    document.addEventListener('touchstart', closeContextMenu);
    
    // Set header height CSS variable
    function updateHeaderHeight() {
      const header = document.querySelector('.header');
      if (header) {
        const height = header.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--header-h', `${height}px`);
      }
    }
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);
    
    return () => {
      document.removeEventListener('click', closeContextMenu);
      document.removeEventListener('touchstart', closeContextMenu);
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
    };
  });

  function closeContextMenu() {
    contextMenuVisible = false;
    contextMenuNode = null;
    settingsMenuVisible = false;
    selectedNodeId = null;
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
    }, 1000); // Increased from 400ms to reduce save frequency
  }

  function handleSelect(event) {
    event.stopPropagation?.();
    selectedNodeId = event.detail.nodeId;
  }

  function handleToggle(event) {
    const { nodeId } = event.detail;
    const node = findNodeById(tree.roots, nodeId);
    if (node) {
      node.collapsed = !node.collapsed;
      tree = tree;
      scheduleSave(); // Don't push to history for simple expand/collapse
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

  function isRootNode(nodeId) {
    return tree.roots.some(root => root.id === nodeId);
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

  function handleMenuAddSibling() {
    if (contextMenuNode) {
      const result = findParentAndIndex(tree.roots, contextMenuNode.id);
      if (result) {
        const { siblings, index } = result;
        const newNode = {
          id: crypto.randomUUID(),
          text: '',
          collapsed: true,
          children: []
        };
        siblings.splice(index + 1, 0, newNode);
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
        tree = { ...tree }; // Force reactivity
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
        tree = { ...tree }; // Force reactivity
        pushHistory();
      }
    }
    closeContextMenu();
  }

  function handleHeaderTouchStart(e) {
    longPressTimer = setTimeout(() => {
      showHeaderContextMenu(e.touches[0].clientX, e.touches[0].clientY);
    }, 500);
  }

  function handleHeaderTouchEnd(e) {
    clearTimeout(longPressTimer);
  }

  function handleHeaderTouchMove() {
    clearTimeout(longPressTimer);
  }

  function handleHeaderContextMenu(e) {
    e.preventDefault();
    showHeaderContextMenu(e.clientX, e.clientY);
  }

  function showHeaderContextMenu(x, y) {
    if (tree.roots && tree.roots.length > 0) {
      contextMenuNode = tree.roots[0];
      contextMenuX = x;
      contextMenuY = y;
      contextMenuVisible = true;
    }
  }

  function handleUndo() {
    if (historyIndex > 0) {
      historyIndex--;
      tree = JSON.parse(JSON.stringify(history[historyIndex]));
      scheduleSave();
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      tree = JSON.parse(JSON.stringify(history[historyIndex]));
      scheduleSave();
    }
  }

  function handleAddRootChild() {
    const newNode = {
      id: crypto.randomUUID(),
      text: '',
      collapsed: true,
      children: []
    };
    
    // Add as a new root node
    tree.roots.push(newNode);
    tree = tree;
    pushHistory();
    selectedNodeId = newNode.id;
    
    // Auto-edit the new node
    setTimeout(() => {
      const element = document.querySelector(`[data-node-id="${newNode.id}"]`);
      if (element) {
        const event = new CustomEvent('dblclick');
        element.querySelector('.node-content')?.dispatchEvent(event);
      }
    }, 50);
  }

  function toggleSettingsMenu(e) {
    e.stopPropagation();
    settingsMenuVisible = !settingsMenuVisible;
  }

  function handleExportJSON() {
    const dataStr = JSON.stringify(tree, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feim-notes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    settingsMenuVisible = false;
  }

  function handleImportJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (imported.roots && Array.isArray(imported.roots)) {
              tree = imported;
              await saveTree(tree);
              pushHistory();
              alert('Import successful!');
            } else {
              alert('Invalid JSON format');
            }
          } catch (err) {
            alert('Error parsing JSON file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    settingsMenuVisible = false;
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
    
    <div class="header-actions">
      <button class="action-btn" on:click={handleUndo} disabled={historyIndex <= 0} title="Undo">
        <span class="action-icon">↶</span>
      </button>
      
      <button class="action-btn" on:click={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
        <span class="action-icon">↷</span>
      </button>
      
      <button class="action-btn primary" on:click={handleAddRootChild} title="Add new note">
        <span class="action-icon">+</span>
      </button>
      
      <div class="settings-wrapper">
        <button class="action-btn" on:click={toggleSettingsMenu} title="Settings">
          <span class="action-icon">⚙</span>
        </button>
        
        {#if settingsMenuVisible}
          <div class="settings-menu" on:click|stopPropagation on:touchstart|stopPropagation>
            <button class="settings-item" on:click={handleExportJSON}>
              <span class="settings-icon">📤</span>
              <span>Export JSON</span>
            </button>
            <button class="settings-item" on:click={handleImportJSON}>
              <span class="settings-icon">📥</span>
              <span>Import JSON</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
    
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
  <div class="tree-area" on:click={() => selectedNodeId = null}>
    {#each tree.roots as node (node.id)}
      <Node 
        {node} 
        depth={0}
        {maxDepth}
        {selectedNodeId}
        bind:isAnyNodeEditing
        on:select={handleSelect}
        on:toggle={handleToggle}
        on:edit={handleEdit}
        on:contextmenu={handleContextMenu}
      />
    {/each}
    
    <!-- Spacer to ensure always scrollable -->
    <div class="scroll-spacer"></div>
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
      on:addSibling={handleMenuAddSibling}
      on:delete={handleMenuDelete}
      on:copy={handleMenuCopy}
      on:paste={handleMenuPaste}
      on:moveUp={handleMenuMoveUp}
      on:moveDown={handleMenuMoveDown}
    />
  {/if}
</div>

<style>
  :global(html) {
    overflow-y: scroll;
  }

  :global(body) {
    background: #0f0e11;
    color: #f4efe6;
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    touch-action: manipulation;
    min-height: 100vh;
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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
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
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
    position: sticky;
    top: 0;
    z-index: 1000;
    overflow: visible;
  }

  h1 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    color: #fbbf24;
    letter-spacing: -0.01em;
    text-transform: none;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-btn {
    background: #25232a;
    border: 1px solid #4a3a2c;
    color: #d3c9bb;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 1.125rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    min-width: 36px;
    height: 36px;
  }

  .action-btn:hover:not(:disabled) {
    background: #2d2b32;
    border-color: #5a4634;
    color: #f4efe6;
  }

  .action-btn:active:not(:disabled) {
    background: #1a181d;
  }

  .action-btn.primary {
    background: #fbbf24;
    border-color: #fbbf24;
    color: #0f0e11;
  }

  .action-btn.primary:hover {
    background: #fcd34d;
    border-color: #fcd34d;
    color: #0f0e11;
  }

  .action-btn.primary:active {
    background: #f59e0b;
    border-color: #f59e0b;
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .action-icon {
    line-height: 1;
    font-size: 1.125rem;
  }

  .settings-wrapper {
    position: relative;
    z-index: 1060;
  }

  .settings-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #1a181d;
    border: 1px solid #4a3a2c;
    border-radius: 4px;
    box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.5);
    min-width: 180px;
    padding: 8px;
    z-index: 1070;
    backdrop-filter: blur(8px);
  }

  .settings-item {
    width: 100%;
    background: transparent;
    border: none;
    color: #d3c9bb;
    padding: 10px 14px;
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

  .settings-item:hover {
    background: #25232a;
    color: #f4efe6;
  }

  .settings-icon {
    font-size: 1rem;
    width: 18px;
    text-align: center;
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
    padding: 24px 32px 24px 32px;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    background: #0f0e11;
    position: relative;
    z-index: 1;
  }

  .scroll-spacer {
    height: 100vh;
    min-height: 600px;
    pointer-events: none;
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
      flex: 1;
    }

    .header-actions {
      order: 2;
      flex-shrink: 0;
    }

    .action-btn {
      padding: 6px 10px;
      min-width: 32px;
      height: 32px;
    }

    .action-icon {
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
