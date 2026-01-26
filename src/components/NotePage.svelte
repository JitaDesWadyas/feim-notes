<script>
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let node;
  export let nodesMap;
  export let childrenByFromId;
  export let linksOutByFromId;
  export let linksInByToId;
  
  const dispatch = createEventDispatcher();
  
  let contentEl;
  let saveTimeout;
  let isFocused = false;
  
  $: childEdges = childrenByFromId.get(node.id) || [];
  $: children = childEdges.map(e => nodesMap.get(e.toId)).filter(Boolean);
  $: outgoingLinks = (linksOutByFromId.get(node.id) || []).map(e => nodesMap.get(e.toId)).filter(Boolean);
  $: incomingLinks = (linksInByToId.get(node.id) || []).map(e => nodesMap.get(e.fromId)).filter(Boolean);
  
  onMount(() => {
    if (contentEl) {
      contentEl.innerText = node.contentMd;
    }
  });
  
  $: if (contentEl && !isFocused && node.contentMd !== undefined) {
    const currentText = contentEl.innerText || '';
    if (currentText !== node.contentMd) {
      contentEl.innerText = node.contentMd;
    }
  }
  
  function handleTitleInput(e) {
    const newTitle = e.target.innerText || '';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      dispatch('updatetitle', { nodeId: node.id, title: newTitle });
    }, 400);
  }
  
  function handleContentInput(e) {
    const newContent = e.target.innerText || '';
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      dispatch('updatecontent', { nodeId: node.id, content: newContent });
    }, 600);
  }
  
  function handleFocus() {
    isFocused = true;
  }
  
  function handleBlur() {
    isFocused = false;
  }
  
  function handleChildClick(childNode) {
    dispatch('selectnode', { nodeId: childNode.id });
  }
  
  function handleLinkClick(linkedNode) {
    dispatch('selectnode', { nodeId: linkedNode.id });
  }
  
  function handlePanelClick(e) {
    // Stop propagation so clicking panels doesn't deselect
    e.stopPropagation();
  }
</script>

<div class="note-page" transition:fade={{ duration: 180 }} on:click|stopPropagation>
  <div class="note-header">
    <h2 
      class="note-title" 
      contenteditable="true"
      on:input={handleTitleInput}
      on:blur={() => {}}
    >{node.title || 'Untitled'}</h2>
  </div>
  
  <div class="note-content-wrapper">
    <div 
      class="note-content"
      contenteditable="true"
      bind:this={contentEl}
      on:input={handleContentInput}
      on:focus={handleFocus}
      on:blur={handleBlur}
      placeholder="Start writing..."
    ></div>
  </div>
  
  {#if children.length > 0 || outgoingLinks.length > 0 || incomingLinks.length > 0}
    <div class="note-panels">
      {#if children.length > 0}
        <div class="panel">
          <h3 class="panel-title">Sub-notes ({children.length})</h3>
          <div class="panel-list">
            {#each children as child (child.id)}
              <button class="panel-item" on:click={() => handleChildClick(child)}>
                {child.title || 'Untitled'}
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if outgoingLinks.length > 0}
        <div class="panel">
          <h3 class="panel-title">Links ({outgoingLinks.length})</h3>
          <div class="panel-list">
            {#each outgoingLinks as linked (linked.id)}
              <button class="panel-item" on:click={() => handleLinkClick(linked)}>
                {linked.title || 'Untitled'}
              </button>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if incomingLinks.length > 0}
        <div class="panel">
          <h3 class="panel-title">Backlinks ({incomingLinks.length})</h3>
          <div class="panel-list">
            {#each incomingLinks as linked (linked.id)}
              <button class="panel-item" on:click={() => handleLinkClick(linked)}>
                {linked.title || 'Untitled'}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .note-page {
    height: 100%;
    overflow-y: auto;
    background: #0f0e11;
    padding: 32px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .note-header {
    margin-bottom: 32px;
  }
  
  .note-title {
    font-size: 2rem;
    font-weight: 700;
    color: #fbbf24;
    margin: 0;
    padding: 8px;
    border: none;
    outline: none;
    background: transparent;
    cursor: text;
    min-height: 2.5rem;
    word-wrap: break-word;
  }
  
  .note-title:focus {
    outline: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 4px;
  }
  
  .note-content-wrapper {
    margin-bottom: 48px;
  }
  
  .note-content {
    min-height: 300px;
    padding: 16px;
    font-size: 1rem;
    line-height: 1.7;
    color: #f4efe6;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    outline: none;
    cursor: text;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  
  .note-content:focus {
    border-color: rgba(251, 191, 36, 0.2);
    background: rgba(22, 20, 26, 0.5);
  }
  
  .note-content:empty:before {
    content: attr(placeholder);
    color: #a79d8f;
    opacity: 0.5;
  }
  
  .note-panels {
    border-top: 1px solid #4a3a2c;
    padding-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .panel {
    background: #16141a;
    border: 1px solid #4a3a2c;
    border-radius: 6px;
    padding: 16px;
  }
  
  .panel-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #a79d8f;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 12px 0;
  }
  
  .panel-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .panel-item {
    width: 100%;
    padding: 8px 12px;
    background: rgba(37, 35, 42, 0.5);
    border: 1px solid rgba(74, 58, 44, 0.5);
    border-radius: 4px;
    color: #d3c9bb;
    font-size: 0.875rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .panel-item:hover {
    background: rgba(45, 43, 50, 0.8);
    border-color: #fbbf24;
    color: #fbbf24;
  }
  
  @media (max-width: 768px) {
    .note-page {
      padding: 16px;
    }
    
    .note-title {
      font-size: 1.5rem;
    }
    
    .note-content {
      min-height: 200px;
      font-size: 0.9375rem;
    }
  }
</style>
