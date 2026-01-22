<script>
  import { createEventDispatcher } from 'svelte';
  import { findParentAndIndex } from './treeUtils.js';
  
  export let selectedNode = null;
  export let tree = null;
  export let hasClipboard = false;
  
  const dispatch = createEventDispatcher();
  
  $: breadcrumb = selectedNode && tree ? getBreadcrumb(selectedNode.id) : [];
  
  function getBreadcrumb(nodeId) {
    const path = [];
    let current = findNodeById(tree.roots, nodeId);
    
    function findNodeById(nodes, id) {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    }
    
    function buildPath(nodes, targetId, currentPath = []) {
      for (const node of nodes) {
        const newPath = [...currentPath, node.text];
        if (node.id === targetId) {
          return newPath;
        }
        if (node.children) {
          const found = buildPath(node.children, targetId, newPath);
          if (found) return found;
        }
      }
      return null;
    }
    
    return buildPath(tree.roots, nodeId) || [];
  }
  
  function handleAddChild() {
    dispatch('addChild');
  }
  
  function handleEdit() {
    dispatch('edit');
  }
  
  function handleDelete() {
    dispatch('delete');
  }
  
  function handleCopy() {
    dispatch('copy');
  }
  
  function handlePaste() {
    dispatch('paste');
  }
  
  function handleMoveUp() {
    dispatch('moveUp');
  }
  
  function handleMoveDown() {
    dispatch('moveDown');
  }
</script>

<div class="action-panel">
  {#if selectedNode}
    <div class="panel-header">
      <h3>Selected Note</h3>
    </div>
    
    <div class="panel-content">
      <div class="selected-node-info">
        <div class="node-title">{selectedNode.text || '(empty)'}</div>
        {#if breadcrumb.length > 0}
          <div class="breadcrumb">
            {breadcrumb.join(' › ')}
          </div>
        {/if}
      </div>
      
      <div class="actions">
        <button class="action-btn" on:click={handleAddChild}>
          <span class="icon">+</span>
          <span>Add Child</span>
        </button>
        
        <button class="action-btn" on:click={handleEdit}>
          <span class="icon">✎</span>
          <span>Edit</span>
        </button>
        
        <button class="action-btn" on:click={handleCopy}>
          <span class="icon">📋</span>
          <span>Copy</span>
        </button>
        
        {#if hasClipboard}
          <button class="action-btn" on:click={handlePaste}>
            <span class="icon">📥</span>
            <span>Paste</span>
          </button>
        {/if}
        
        <div class="action-divider"></div>
        
        <button class="action-btn" on:click={handleMoveUp}>
          <span class="icon">↑</span>
          <span>Move Up</span>
        </button>
        
        <button class="action-btn" on:click={handleMoveDown}>
          <span class="icon">↓</span>
          <span>Move Down</span>
        </button>
        
        <div class="action-divider"></div>
        
        <button class="action-btn danger" on:click={handleDelete}>
          <span class="icon">🗑</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  {:else}
    <div class="panel-empty">
      <p>Select a note to see actions</p>
    </div>
  {/if}
</div>

<style>
  .action-panel {
    height: 100%;
    background: linear-gradient(to bottom, rgba(30, 26, 22, 0.98), rgba(25, 22, 18, 0.98));
    border-left: 1px solid rgba(100, 85, 70, 0.3);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
  }

  .panel-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(100, 85, 70, 0.25);
    background: rgba(35, 30, 25, 0.5);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(180, 160, 130, 0.75);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .panel-content {
    padding: 1.5rem;
  }

  .selected-node-info {
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(40, 35, 30, 0.5);
    border: 1px solid rgba(100, 85, 70, 0.3);
    border-radius: 6px;
  }

  .node-title {
    color: rgba(240, 230, 210, 0.98);
    font-size: 1.05rem;
    line-height: 1.6;
    margin-bottom: 0.75rem;
    word-wrap: break-word;
    font-weight: 500;
  }

  .breadcrumb {
    color: rgba(160, 145, 120, 0.65);
    font-size: 0.8rem;
    line-height: 1.5;
    word-wrap: break-word;
    font-style: italic;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .action-btn {
    width: 100%;
    background: rgba(45, 40, 35, 0.6);
    border: 1px solid rgba(120, 100, 80, 0.35);
    color: rgba(230, 215, 195, 0.95);
    padding: 0.85rem 1.15rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.92rem;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    transition: all 0.2s ease;
    text-align: left;
    font-weight: 500;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .action-btn:hover {
    background: rgba(60, 52, 43, 0.75);
    border-color: rgba(180, 140, 80, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    color: rgba(245, 235, 220, 1);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .action-btn.danger {
    border-color: rgba(180, 80, 70, 0.4);
    color: rgba(240, 180, 170, 0.9);
  }

  .action-btn.danger:hover {
    background: rgba(80, 40, 35, 0.6);
    border-color: rgba(200, 90, 75, 0.6);
    color: rgba(255, 200, 190, 1);
  }

  .action-btn .icon {
    font-size: 1.15rem;
    width: 22px;
    text-align: center;
    opacity: 0.9;
  }

  .action-divider {
    height: 1px;
    background: linear-gradient(to right, 
      transparent, 
      rgba(120, 100, 80, 0.25) 50%, 
      transparent);
    margin: 0.75rem 0;
  }

  .panel-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
  }

  .panel-empty p {
    color: rgba(140, 125, 105, 0.6);
    font-size: 0.95rem;
    text-align: center;
    font-style: italic;
    line-height: 1.6;
  }
</style>
