<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Navigator from './Navigator.svelte';
  import NotePage from './NotePage.svelte';
  import { router, currentNoteId } from '../router.js';
  import { buildAdjacencyMaps } from '../lib/graphUtils.js';
  
  export let category;
  export let nodes;
  export let edges;
  export let selectedNodeId = null;
  
  const dispatch = createEventDispatcher();
  
  let mobileDrawerOpen = false;
  let isMobile = false;
  
  $: nodesMap = new Map(nodes.map(n => [n.id, n]));
  $: categoryNodes = nodes.filter(n => n.categoryId === category.id);
  $: categoryEdges = edges.filter(e => e.categoryId === category.id);
  $: maps = buildAdjacencyMaps(categoryEdges);
  $: ({ childrenByFromId, parentsByToId, linksOutByFromId, linksInByToId } = maps);
  $: currentNode = selectedNodeId ? nodesMap.get(selectedNodeId) : null;
  
  $: if (typeof window !== 'undefined') {
    checkMobile();
    window.addEventListener('resize', checkMobile);
  }
  
  function checkMobile() {
    isMobile = window.innerWidth < 768;
  }
  
  function handleSelect(event) {
    selectedNodeId = event.detail.nodeId;
    router.navigateToNote(category.id, selectedNodeId);
    
    if (isMobile) {
      mobileDrawerOpen = false;
    }
    
    dispatch('select', event.detail);
  }
  
  function handleMainClick(e) {
    // Prevent clicks in main pane from clearing selection
    e.stopPropagation();
  }
  
  function handleToggle(event) {
    // Handled by Navigator component
  }
  
  function handleContextMenu(event) {
    dispatch('contextmenu', event.detail);
  }
  
  function handleUpdateTitle(event) {
    dispatch('updatetitle', event.detail);
  }
  
  function handleUpdateContent(event) {
    dispatch('updatecontent', event.detail);
  }
  
  function handleSelectNode(event) {
    handleSelect(event);
  }
  
  function toggleDrawer() {
    mobileDrawerOpen = !mobileDrawerOpen;
  }
  
  function closeDrawer() {
    mobileDrawerOpen = false;
  }
</script>

<div class="workspace">
  <!-- Mobile header -->
  {#if isMobile}
    <div class="mobile-header">
      <button class="hamburger" on:click={toggleDrawer}>
        <span class="hamburger-icon">☰</span>
      </button>
      <h2 class="mobile-title">{currentNode?.title || category.title}</h2>
    </div>
  {/if}
  
  <!-- Desktop layout -->
  <div class="workspace-content" class:mobile={isMobile}>
    {#if !isMobile}
      <div class="sidebar">
        <Navigator 
          categoryId={category.id}
          nodes={categoryNodes}
          {nodesMap}
          {childrenByFromId}
          {parentsByToId}
          {selectedNodeId}
          on:select={handleSelect}
          on:toggle={handleToggle}
          on:contextmenu={handleContextMenu}
        />
      </div>
    {/if}
    
    <div class="main-pane" on:click={handleMainClick}>
      {#if currentNode}
        <NotePage 
          node={currentNode}
          {nodesMap}
          {childrenByFromId}
          {linksOutByFromId}
          {linksInByToId}
          on:updatetitle={handleUpdateTitle}
          on:updatecontent={handleUpdateContent}
          on:selectnode={handleSelectNode}
        />
      {:else}
        <div class="empty-main">
          <p>Select a note from the navigator</p>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Mobile drawer -->
  {#if isMobile && mobileDrawerOpen}
    <div class="drawer-backdrop" on:click={closeDrawer} transition:fade={{ duration: 200 }}></div>
    <div class="drawer" transition:fly={{ x: -280, duration: 250, easing: quintOut }}>
      <Navigator 
        categoryId={category.id}
        nodes={categoryNodes}
        {nodesMap}
        {childrenByFromId}
        {parentsByToId}
        {selectedNodeId}
        on:select={handleSelect}
        on:toggle={handleToggle}
        on:contextmenu={handleContextMenu}
      />
    </div>
  {/if}
</div>

<style>
  .workspace {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0f0e11;
  }
  
  .mobile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    background: #1a181d;
    border-bottom: 1px solid #4a3a2c;
  }
  
  .hamburger {
    background: transparent;
    border: none;
    color: #fbbf24;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    display: flex;
    align-items: center;
  }
  
  .hamburger-icon {
    line-height: 1;
  }
  
  .mobile-title {
    flex: 1;
    font-size: 1rem;
    font-weight: 600;
    color: #f4efe6;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .workspace-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .workspace-content.mobile {
    flex-direction: column;
  }
  
  .sidebar {
    width: 280px;
    flex-shrink: 0;
  }
  
  .main-pane {
    flex: 1;
    overflow: hidden;
  }
  
  .empty-main {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  
  .empty-main p {
    color: #a79d8f;
    font-size: 1rem;
    font-style: italic;
  }
  
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
  }
  
  .drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 280px;
    background: #16141a;
    z-index: 1001;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
  }
  
  @media (prefers-reduced-motion: reduce) {
    .drawer {
      transition: none;
    }
  }
</style>
