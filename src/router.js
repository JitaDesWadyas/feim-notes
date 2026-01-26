import { writable, derived } from 'svelte/store';

function createRouter() {
  const { subscribe, set, update } = writable({
    view: 'overview', // 'overview' | 'workspace'
    categoryId: null,
    noteId: null,
    path: []
  });

  function navigateToOverview() {
    set({ view: 'overview', categoryId: null, noteId: null, path: [] });
    window.history.pushState({ view: 'overview' }, '', '#/');
  }

  function navigateToWorkspace(categoryId, categoryName, noteId = null) {
    const newState = { 
      view: 'workspace', 
      categoryId, 
      noteId,
      path: [categoryName] 
    };
    set(newState);
    const url = noteId 
      ? `#/workspace/${categoryId}/${noteId}`
      : `#/workspace/${categoryId}`;
    window.history.pushState(newState, '', url);
  }

  function navigateToNote(categoryId, noteId) {
    update(state => ({ ...state, noteId }));
    const url = `#/workspace/${categoryId}/${noteId}`;
    window.history.replaceState({ ...window.history.state, noteId }, '', url);
  }

  function handlePopState(event) {
    if (event.state) {
      set(event.state);
    } else {
      set({ view: 'overview', categoryId: null, noteId: null, path: [] });
    }
  }

  function initFromURL() {
    const hash = window.location.hash;
    if (hash.startsWith('#/workspace/')) {
      const parts = hash.replace('#/workspace/', '').split('/');
      const categoryId = parts[0];
      const noteId = parts[1] || null;
      set({ view: 'workspace', categoryId, noteId, path: [] });
    } else {
      set({ view: 'overview', categoryId: null, noteId: null, path: [] });
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePopState);
  }

  return {
    subscribe,
    navigateToOverview,
    navigateToWorkspace,
    navigateToNote,
    initFromURL,
    set,
    update
  };
}

export const router = createRouter();
export const currentView = derived(router, $router => $router.view);
export const currentCategoryId = derived(router, $router => $router.categoryId);
export const currentNoteId = derived(router, $router => $router.noteId);
export const currentPath = derived(router, $router => $router.path);
