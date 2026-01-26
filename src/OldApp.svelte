<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { saveTree, loadTree, createDefaultTree } from './db.js';
  import { 
    findNodeById, 
    findParentAndIndex, 
    deleteNodeById, 
    cloneNode 
  } from './treeUtils.js';
  import { router, currentView, currentCategoryId } from './router.js';
  import OverviewCard from './OverviewCard.svelte';
  import CategoryView from './CategoryView.svelte';
  import ContextMenu from './ContextMenu.svelte';

  let tree = createDefaultTree();
  let history = [];
  let historyIndex = -1;
  let saveTimeout = null;
  let searchQuery = '';
  let clipboard = null;
  let selectedNodeId = null;
  let isAnyNodeEditing = false;
  let globalSearchMode = false;
  
  // Get current category for drill-down view
  $: currentCategory = $currentCategoryId 
    ? findNodeById(tree.roots, $currentCategoryId)
    : null;
  
  // Filter categories for overview (with search)
  $: filteredCategories = searchQuery && !globalSearchMode
    ? tree.roots.filter(cat => 
        cat.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tree.roots;
  
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
    
    // Initialize router from URL
    router.initFromURL();
    
    // Update router path if we have a category ID
    if ($currentCategoryId) {
      const cat = findNodeById(tree.roots, $currentCategoryId);
      if (cat) {
        router.update(state => ({ ...state, path: [cat.text] }));
      } else {
        // Category not found, go to overview
        router.navigateToOverview();
      }
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
      // Use a small delay to allow context menu to close first
      setTimeout(() => {
        const element = document.querySelector(`[data-node-id="${contextMenuNode.id}"]`);
        if (element) {
          // Simulate double-click on the card/node content
          const event = new Event('dblclick', { bubbles: true });
          const contentEl = element.querySelector('.card-content') || 
                           element.querySelector('.node-content');
          if (contentEl) {
            contentEl.dispatchEvent(event);
          }
        }
      }, 100);
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
    
    if ($currentView === 'category' && currentCategory) {
      // Add as child to current category
      currentCategory.children.push(newNode);
      currentCategory.collapsed = false;
      tree = tree;
      pushHistory();
      selectedNodeId = newNode.id;
    } else {
      // Add as a new root node (category)
      tree.roots.push(newNode);
      tree = tree;
      pushHistory();
      selectedNodeId = newNode.id;
    }
    
    // Auto-edit the new node
    setTimeout(() => {
      const element = document.querySelector(`[data-node-id="${newNode.id}"]`);
      if (element) {
        const event = new Event('dblclick', { bubbles: true });
        const contentEl = element.querySelector('.card-content') || 
                         element.querySelector('.node-content');
        if (contentEl) {
          contentEl.dispatchEvent(event);
        }
      }
    }, 100);
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
      if (globalSearchMode) {
        // Global search: expand all matching nodes
        searchInTree(tree.roots, searchQuery.toLowerCase());
        tree = tree;
      }
      // Otherwise, search is handled by view filtering
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
  
  function toggleGlobalSearch() {
    globalSearchMode = !globalSearchMode;
    if (!globalSearchMode) {
      searchQuery = '';
    }
  }
  
  function getSearchPlaceholder() {
    if (globalSearchMode) {
      return 'Search all notes (global)...';
    }
    if ($currentView === 'category') {
      return 'Search in category...';
    }
    return 'Search categories...';
  }
</script>

<svelte:body on:contextmenu|preventDefault />

<div class="app">
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      {#if $currentView === 'category'}
        <button 
          class="nav-btn" 
          on:click={() => router.navigateToOverview()}
          title="Back to overview"
        >
          <span class="action-icon">←</span>
        </button>
      {/if}
      
      <h1>FEIM Notes</h1>
      
      {#if $currentView === 'category' && currentCategory}
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{currentCategory.text}</span>
      {/if}
    </div>
    
    <div class="header-actions">
      <button class="action-btn" on:click={handleUndo} disabled={historyIndex <= 0} title="Undo">
        <span class="action-icon">↶</span>
      </button>
      
      <button class="action-btn" on:click={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
        <span class="action-icon">↷</span>
      </button>
      
      <button 
        class="action-btn primary" 
        on:click={handleAddRootChild} 
        title={$currentView === 'category' ? 'Add note to category' : 'Add new category'}
      >
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
        placeholder={getSearchPlaceholder()}
        bind:value={searchQuery}
        on:keydown={handleSearch}
        class="search-input"
      />
      
      <button 
        class="search-mode-toggle"
        class:active={globalSearchMode}
        on:click={toggleGlobalSearch}
        title={globalSearchMode ? 'Switch to contextual search' : 'Switch to global search'}
      >
        <span class="toggle-icon">{globalSearchMode ? '🌐' : '📍'}</span>
      </button>
    </div>
  </header>

  <!-- Main Content Area with View Switching -->
  <main class="main-content">
    {#if $currentView === 'overview'}
      <div class="overview" in:fade={{ duration: 180 }}>
        {#if filteredCategories.length > 0}
          <div class="categories-grid">
            {#each filteredCategories as category (category.id)}
              <div animate:flip={{ duration: 180, easing: quintOut }}>
                <OverviewCard 
                  {category}
                  {selectedNodeId}
                  on:select={handleSelect}
                  on:edit={handleEdit}
                  on:contextmenu={handleContextMenu}
                />
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-state">
            <p>
              {searchQuery 
                ? 'No categories match your search' 
                : 'No categories yet. Click + to create one.'}
            </p>
          </div>
        {/if}
      </div>
    {:else if $currentView === 'category' && currentCategory}
      <div in:fade={{ duration: 180 }}>
        <CategoryView 
          category={currentCategory}
          {selectedNodeId}
          bind:isAnyNodeEditing
          {searchQuery}
          on:select={handleSelect}
          on:toggle={handleToggle}
          on:edit={handleEdit}
          on:contextmenu={handleContextMenu}
        />
      </div>
    {/if}
  </main>

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
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }
  
  .breadcrumb-separator {
    color: #4a3a2c;
    font-size: 1rem;
    user-select: none;
  }
  
  .breadcrumb-current {
    color: #f4efe6;
    font-size: 1rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }
  
  .nav-btn {
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
    min-width: 36px;
    height: 36px;
  }
  
  .nav-btn:hover {
    background: #2d2b32;
    border-color: #fbbf24;
    transform: translateX(-2px);
  }
  
  .nav-btn:active {
    background: #1a181d;
    transform: translateX(0);
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
    transform: scale(0.95);
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
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .search-input {
    flex: 1;
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
  
  .search-mode-toggle {
    background: #25232a;
    border: 1px solid #4a3a2c;
    color: #d3c9bb;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    min-width: 36px;
    height: 36px;
  }
  
  .search-mode-toggle:hover {
    background: #2d2b32;
    border-color: #5a4634;
  }
  
  .search-mode-toggle.active {
    background: #fbbf24;
    border-color: #fbbf24;
    color: #0f0e11;
  }
  
  .toggle-icon {
    font-size: 1rem;
    line-height: 1;
  }

  .main-content {
    flex: 1;
    position: relative;
    z-index: 1;
  }
  
  .overview {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .empty-state {
    padding: 80px 32px;
    text-align: center;
  }
  
  .empty-state p {
    color: #a79d8f;
    font-size: 1rem;
    font-style: italic;
    margin: 0;
  }

  @media (max-width: 768px) {
    .header {
      padding: 12px 16px;
      flex-wrap: wrap;
      height: auto;
      gap: 12px;
    }
    
    .header-left {
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .nav-btn {
      min-width: 32px;
      height: 32px;
      padding: 6px 10px;
    }

    h1 {
      font-size: 1rem;
    }
    
    .breadcrumb-separator {
      font-size: 0.875rem;
    }
    
    .breadcrumb-current {
      font-size: 0.875rem;
      max-width: 150px;
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
    
    .search-mode-toggle {
      min-width: 32px;
      height: 32px;
    }
    
    .overview {
      padding: 16px;
    }
    
    .categories-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    .nav-btn:hover,
    .action-btn:active {
      transform: none;
    }
  }
</style>
