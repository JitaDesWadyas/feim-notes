# FEIM Notes

A minimal offline-first outliner app with dark background and amber text/accent. Build a nested notes tree with full undo/redo, drag & drop, copy/paste, and search functionality.

## Features

- **Nested Tree Structure**: Organize notes in unlimited hierarchy
- **Offline-First**: Uses IndexedDB for local storage, works without internet
- **Sticky Parent Context Header**: When scrolling deep into nested nodes, parent context stays visible at top
- **Fast Actions**: Expand all, Collapse all, Copy/Paste subtrees, Drag & Drop reordering
- **Full Undo/Redo**: All operations are undoable
- **Search**: Highlights matches and auto-expands ancestors
- **Export/Import**: Backup and restore your notes as JSON
- **PWA**: Installable as Progressive Web App
- **Android APK**: Can be built and installed on Android devices

## Quick Start (Linux)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open browser to `http://localhost:5173`

### 3. Build for Production (Web)
```bash
npm run build
```
Output in `dist/` directory

### 4. Build Android APK

**Prerequisites:**
- Java JDK 17+ installed
- Android SDK installed (or let Capacitor/Gradle download it)
- `ANDROID_HOME` environment variable set (if SDK pre-installed)

**Build APK:**
```bash
npm run android:apk
```

This command will:
1. Build the web app with Vite
2. Sync assets to Android with Capacitor
3. Build debug APK with Gradle
4. Output APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**First-time Android setup only:**
If `android/` folder doesn't exist, initialize Capacitor first:
```bash
npm run android:init
```

### 5. Install APK on Device
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or copy the APK to your Android device and install manually.

## Usage

### Basic Operations
- **Add child node**: Click the `+` button on any node
- **Edit text**: Click on the node text to edit inline
- **Expand/Collapse**: Click the caret (▸/▾) to toggle
- **Delete**: Click the trash icon (🗑️) - confirms before deleting

### Advanced Operations
- **Expand All / Collapse All**: Top toolbar buttons
- **Copy Subtree**: Click 📋 on any node
- **Paste Subtree**: Click 📥 (appears when clipboard has content)
- **Drag & Drop**: Use the drag handle (⋮⋮) to move nodes
  - Drop zones: before, after, or into another node
- **Search**: Enter query in search box, press Enter or 🔍
- **Undo / Redo**: Use toolbar buttons
- **Export JSON**: Download full tree as JSON file
- **Import JSON**: Load previously exported JSON

### Sticky Parent Context
When you click or edit a node deep in the tree, if that parent scrolls out of view:
- A sticky header appears showing the parent context
- Contains: parent text, "+ Child" button, "↑ Up" button
- Click "↑ Up" to go to grandparent context
- Header disappears when parent is visible again

## Data Model

```json
{
  "version": 1,
  "roots": [
    {
      "id": "uuid",
      "text": "Node text",
      "collapsed": false,
      "children": []
    }
  ]
}
```

## Default Tree Structure

Initial tree on first launch:
```
FEIM
├── 00 Inbox
├── 10 Lore
├── 20 Regions
├── 30 NPC
├── 40 Monsters
├── 50 Items / Discs
├── 60 Quests / Campaign
└── 90 Dev TODO
```

## Tech Stack

- **Frontend**: Svelte 5 + Vite
- **Storage**: IndexedDB via `idb` library
- **Android**: Capacitor
- **Build**: Gradle (Android), Vite (Web)

## Architecture

- `src/App.svelte` - Main app container with toolbar and state management
- `src/Node.svelte` - Recursive node component with drag/drop and inline editing
- `src/db.js` - IndexedDB persistence layer
- `src/treeUtils.js` - Tree manipulation utilities
- `public/sw.js` - Service worker for offline caching
- `public/manifest.json` - PWA manifest

## Performance

- Efficient keyed rendering with Svelte
- Debounced autosave (400ms)
- Handles 1000+ nodes smoothly
- Minimal re-renders on state changes

## Color Scheme (FEIM Style)

- Background: `#1a1a1a`
- Text/Accent: `#ffbf00` (amber)
- Hover: `#ffd633` (lighter amber)
- Toolbar: `#0d0d0d`
- Controls: `#2a2a2a`

## License

ISC

---

**Built with ❤️ for FEIM worldbuilding**
