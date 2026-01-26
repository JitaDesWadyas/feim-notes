<script>
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { slide, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import CategoryNode from './CategoryNode.svelte';
  import { findNodeById } from './treeUtils.js';
  import { router } from './router.js';

  export let category;
  export let selectedNodeId = null;
  export let isAnyNodeEditing = false;
  export let searchQuery = '';

  const dispatch = createEventDispatcher();

  $: filteredChildren = searchQuery 
    ? filterNodes(category?.children || [], searchQuery.toLowerCase())
    : category?.children || [];

  function filterNodes(nodes, query) {
    const results = [];
    for (const node of nodes) {
      if (node.text.toLowerCase().includes(query)) {
        results.push(node);
      } else if (node.children && node.children.length > 0) {
        const childMatches = filterNodes(node.children, query);
        if (childMatches.length > 0) {
          results.push({ ...node, children: childMatches });
        }
      }
    }
    return results;
  }

  function handleSelect(event) {
    dispatch('select', event.detail);
  }

  function handleToggle(event) {
    dispatch('toggle', event.detail);
  }

  function handleEdit(event) {
    dispatch('edit', event.detail);
  }

  function handleContextMenu(event) {
    dispatch('contextmenu', event.detail);
  }
</script>

<div class="category-view">
  <div class="category-content">
    {#if category}
      <div class="category-header">
        <h2 class="category-title">{category.text}</h2>
        <p class="category-count">
          {filteredChildren.length} 
          {filteredChildren.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {#if filteredChildren.length > 0}
        <div class="notes-list">
          {#each filteredChildren as node (node.id)}
            <div animate:flip={{ duration: 180, easing: quintOut }}>
              <CategoryNode 
                {node}
                depth={0}
                {selectedNodeId}
                bind:isAnyNodeEditing
                on:select={handleSelect}
                on:toggle={handleToggle}
                on:edit={handleEdit}
                on:contextmenu={handleContextMenu}
              />
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-state" transition:fade={{ duration: 120 }}>
          <p>
            {searchQuery 
              ? 'No notes match your search' 
              : 'No notes in this category yet'}
          </p>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .category-view {
    flex: 1;
  }

  .category-content {
    padding: 24px 32px;
    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
  }

  .category-header {
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #4a3a2c;
  }

  .category-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #fbbf24;
    margin: 0 0 8px 0;
    letter-spacing: -0.02em;
  }

  .category-count {
    font-size: 0.875rem;
    color: #a79d8f;
    margin: 0;
    font-weight: 500;
  }

  .notes-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .empty-state {
    padding: 64px 32px;
    text-align: center;
  }

  .empty-state p {
    color: #a79d8f;
    font-size: 1rem;
    font-style: italic;
    margin: 0;
  }

  @media (max-width: 768px) {
    .category-content {
      padding: 16px;
    }

    .category-header {
      margin-bottom: 24px;
    }

    .category-title {
      font-size: 1.5rem;
    }

    .empty-state {
      padding: 48px 16px;
    }
  }
</style>
