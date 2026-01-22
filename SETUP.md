# FEIM Notes - Setup on Your PC

## What's Been Done ✅

The complete FEIM Notes app has been built with all features:
- ✅ Svelte + Vite web app with dark/amber FEIM styling
- ✅ Nested tree structure with expand/collapse
- ✅ Sticky parent context header (shows when parent scrolls out of view)
- ✅ Inline editing, add child, delete operations
- ✅ Drag & drop to reorder and move nodes (desktop + mobile)
- ✅ Copy/paste subtrees
- ✅ Full undo/redo for all operations
- ✅ Search with auto-expand ancestors
- ✅ Export/Import JSON
- ✅ IndexedDB offline storage with autosave
- ✅ PWA with service worker
- ✅ Capacitor Android project initialized
- ✅ Default FEIM tree structure
- ✅ Git repository initialized

## What You Need to Do on Your PC 🚀

### 1. Push to GitHub (if you want)
```bash
cd feim-notes
git remote add origin https://github.com/YOUR_USERNAME/feim-notes.git
git branch -M main
git push -u origin main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open browser to `http://localhost:5173`

### 4. Build Android APK

**Prerequisites:**
- Install Java JDK 17 (if not already installed)
- Install Android SDK or let Gradle download it

**On Windows:**
- Download Android Studio or just the command line tools
- Set `ANDROID_HOME` environment variable to SDK location
- OR create `android/local.properties` with: `sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk`

**On macOS/Linux:**
```bash
# If you have Android Studio, find SDK location:
# Usually: ~/Library/Android/sdk (macOS)
#          ~/Android/Sdk (Linux)

# Create android/local.properties:
echo "sdk.dir=/path/to/your/android/sdk" > android/local.properties
```

**Build the APK:**
```bash
npm run android:apk
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Install on Android Device
```bash
# Via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or copy the APK to your phone and install manually
```

## Quick Setup Script for Android SDK (Linux/macOS)

If you don't have Android Studio, run this to install just the SDK:

```bash
# Download command line tools
cd ~
curl -O https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p ~/android-sdk/cmdline-tools
mv cmdline-tools ~/android-sdk/cmdline-tools/latest

# Accept licenses and install platform tools
export ANDROID_HOME=~/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# Add to your android/local.properties
cd /path/to/feim-notes
echo "sdk.dir=$HOME/android-sdk" > android/local.properties

# Now build APK
npm run android:apk
```

## Project Structure

```
feim-notes/
├── src/
│   ├── App.svelte          # Main app with toolbar, state management
│   ├── Node.svelte         # Recursive tree node component
│   ├── db.js               # IndexedDB persistence
│   ├── treeUtils.js        # Tree operations utilities
│   └── main.js             # Entry point
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icon-*.png          # App icons
├── android/                # Capacitor Android project
├── index.html
├── vite.config.js
├── capacitor.config.json
├── package.json
└── README.md               # Full documentation

```

## All Features Working

**Tree Operations:**
- Click text to edit inline (Enter saves, Esc cancels)
- Click caret (▸/▾) to expand/collapse
- Click "+" to add child node
- Drag handle (⋮⋮) to move nodes via drag & drop

**Sticky Header:**
- Appears when editing deep nodes and parent scrolls out of view
- Shows parent title, "+ Child" button, "↑ Up" button
- Click to add child to active context
- Click up to go to parent's parent

**Top Bar Actions:**
- Search: finds text and auto-expands ancestors
- Expand All / Collapse All
- Undo / Redo (works for everything)
- Export JSON / Import JSON
- Copy subtree (📋) / Paste (📥)
- Delete node with confirmation (🗑️)

**Data Storage:**
- All saved to IndexedDB automatically
- Autosave debounced (400ms)
- No backend required
- Works fully offline

## Notes

- The web app works perfectly in development mode
- To build production web app: `npm run build` (output in `dist/`)
- The Android project is ready - just needs Android SDK to build
- Default tree has FEIM structure with Inbox, Lore, Regions, etc.
- All colors are dark (#1a1a1a) with amber accents (#ffbf00)

## Troubleshooting

**If Gradle build fails:**
- Make sure Java 17+ is installed: `java -version`
- Make sure `android/local.properties` has correct SDK path
- Try running from Android Studio to let it auto-configure

**If web app doesn't load:**
- Check console for errors
- Try clearing IndexedDB in browser DevTools
- Ensure all npm dependencies installed

Enjoy building with FEIM Notes! 🎉
