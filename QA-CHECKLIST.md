# FEIM Notes - Graph-Based System QA Checklist

## ✅ COMPLETED FEATURES

### Data Model
- [x] Node entity (id, categoryId, title, contentMd, meta, timestamps)
- [x] Edge entity (id, categoryId, fromId, toId, kind, order)
- [x] Category entity (id, title, order, timestamps)
- [x] Backward compatibility: Old tree format auto-migrates to graph
- [x] IndexedDB persistence for categories, nodes, edges separately
- [x] Build adjacency maps for O(1) lookups (childrenByFromId, parentsByToId, linksOut/In)

### Overview (Home)
- [x] Flat categories grid - NO nested notes visible
- [x] NO depth indicator lines (removed completely)
- [x] Click category → navigates to Workspace
- [x] Context menu on categories (Edit, Delete, etc.)
- [x] Search filters categories
- [x] Add new category button (+)

### Workspace (VSCode-like)
- [x] Desktop: Two-pane layout (Navigator sidebar + Main note pane)
- [x] Mobile: Single pane with off-canvas drawer
- [x] Breadcrumb shows: FEIM Notes / Category / Note
- [x] Back button returns to Overview
- [x] URL routing: #/workspace/{categoryId}/{noteId}
- [x] Browser back/forward works
- [x] Refresh preserves state

### Navigator (Sidebar)
- [x] Shows 'contains' edges as tree structure
- [x] Cycle detection per path with ↻ indicator
- [x] Cycles stop expansion (no infinite loops)
- [x] Expand/collapse with animated chevron rotation
- [x] Slide transition on expand/collapse
- [x] Multi-parent support (same node under multiple parents)
- [x] Compact rows (not cards)
- [x] Selected state highlights with amber
- [x] Context menu on navigator items

### Note Page
- [x] Smooth contenteditable title editing
- [x] Smooth contenteditable markdown content editing
- [x] Debounced auto-save (600ms for content, 400ms for title)
- [x] Cursor position preserved during edits
- [x] Children panel (sub-notes via contains edges)
- [x] Links panel (outgoing link edges)
- [x] Backlinks panel (incoming link edges)
- [x] Clicking linked note opens canonical node (same id)

### Mobile UX
- [x] Hamburger menu opens drawer
- [x] Drawer slides from left with backdrop fade
- [x] Selecting note auto-closes drawer
- [x] Tap backdrop closes drawer
- [x] Mobile-optimized layout and touch targets

### Context Menu Actions
- [x] Edit (triggers inline editing)
- [x] New Sub-note (creates node + contains edge)
- [x] Link to... (placeholder for link creation)
- [x] Remove from here (removes contains edge only)
- [x] Delete (removes node + all edges with confirm)
- [x] Copy (stores in clipboard)

### Animations
- [x] Overview ↔ Workspace: crossfade (180ms fade)
- [x] Navigator expand/collapse: slide + fade
- [x] Chevron rotation: smooth transform
- [x] Mobile drawer: slide + backdrop fade
- [x] List reflow: attempted (had to remove animate:flip due to Svelte constraint)
- [x] Respects prefers-reduced-motion

### Search
- [x] Contextual search (overview: categories, workspace: nodes)
- [x] Global search toggle button
- [x] Dynamic placeholder text

### Other
- [x] Undo/Redo with history
- [x] Export/Import JSON
- [x] Dark + amber theme preserved
- [x] Existing contenteditable editor feel maintained

## ⚠️ KNOWN LIMITATIONS

1. **Wiki-link autocomplete**: Not implemented (typing [[ does not trigger autocomplete)
2. **Bottom sheet** (mobile): Not implemented - actions use context menu instead
3. **Metadata editor**: Not implemented - meta field exists but no UI
4. **Link creation dialog**: Context menu "Link to..." button present but no picker UI
5. **Paste operation**: Context menu item removed (clipboard copy exists but paste not wired)
6. **Add existing as child**: Not implemented (only "New Sub-note" creates fresh nodes)
7. **List reflow animation**: animate:flip removed due to Svelte technical constraint

## 🧪 TESTING INSTRUCTIONS

### Basic Flow
1. **Start fresh**: Clear browser data or use incognito
2. **Create category**: Click + button in overview
3. **Enter workspace**: Click category card
4. **Create note**: Click + button in workspace
5. **Edit note**: Double-click title or content, type naturally
6. **Create sub-note**: Right-click note → New Sub-note
7. **Navigate**: Click notes in navigator to open them
8. **Test cycles**: Create A → B → C, then add edge C → A, verify ↻ appears

### Mobile Testing
1. **Resize to < 768px** or use mobile device
2. **Verify**: Hamburger menu appears
3. **Open drawer**: Click hamburger
4. **Select note**: Click note in drawer
5. **Verify**: Drawer closes automatically

### Edge Cases
1. **Empty state**: No categories → shows "Click + to create"
2. **No notes in category**: Navigator shows "No notes yet"
3. **Deep nesting**: Create 10+ levels, verify performance
4. **Multi-parent**: Add same node under two parents in navigator (manually via edges), verify both show
5. **Cycle**: Create A → B → A loop, verify ↻ indicator and no crash

### Data Migration
1. **Open app with old tree data** (if you have backup)
2. **Verify**: Categories appear, notes migrated
3. **Check**: Export JSON to see new structure (categories, nodes, edges arrays)

## 🐛 HOW TO REPORT ISSUES

If you encounter issues:
1. Check browser console for errors
2. Export JSON to see data state
3. Note the specific action that triggered the problem
4. Check if refresh fixes it (state may be stale)

## 🚀 NEXT STEPS (Future Enhancements)

- [ ] Wiki-link autocomplete with [[  trigger
- [ ] Mobile bottom sheet for panels/actions
- [ ] Metadata editor UI
- [ ] Link creation picker dialog
- [ ] "Add existing as child" node picker
- [ ] Paste operation for copied nodes/subtrees
- [ ] Keyboard shortcuts (Ctrl+N for new note, etc.)
- [ ] Drag-and-drop reordering
- [ ] Rich markdown preview mode
- [ ] Graph visualization view
- [ ] Tags/labels system
- [ ] Full-text search across all content
- [ ] Note templates
- [ ] Version history per note

## ✨ HIGHLIGHTS

- **Graph model with hierarchy**: Nodes + edges enable complex structures
- **Multi-parent support**: Same note can appear in multiple places
- **Cycle-safe**: Prevents infinite loops with path tracking
- **Mobile-first**: Responsive with drawer and optimized touch targets
- **Fast typing**: Contenteditable with debounced save, no lag
- **URL state**: Refresh and back/forward work correctly
- **Migration**: Old data auto-converts on first load
- **Clean UI**: No depth lines, compact navigator, polished animations

Built with Svelte 5 + Vite + IndexedDB (idb).
