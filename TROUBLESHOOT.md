# Quick Start Guide

## If You See White Screen

1. **Open Browser Console** (F12)
2. **Check for errors** - any red text?
3. **Clear browser storage**: 
   - F12 → Application tab → Clear storage → Clear site data
4. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

## Expected First Run

- You should see "No categories yet. Click + to create one."
- Header should show "FEIM Notes" with a + button

## If Still White

1. Check the network tab - is `main.js` loading?
2. Check console for:
   - Module import errors
   - Database errors
   - Syntax errors

## Working Test

```bash
# Build first
npm run build

# Then run dev
npm run dev
```

Visit `http://localhost:5173` (or whatever port Vite shows)

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅  
- Safari: ✅
- Needs modern browser with ES modules support

## Common Issues

**Issue**: "Cannot find module"
**Fix**: Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Issue**: White screen but no console errors
**Fix**: Check if JavaScript is enabled in browser

**Issue**: "Failed to load graph"
**Fix**: Clear IndexedDB in browser dev tools

## Success Indicators

✅ You see the overview page
✅ You can click the + button
✅ A modal/card appears to create category
✅ No console errors

If none of this works, check:
- Is the dev server actually running? (check terminal)
- Is the port correct? (Vite shows the URL)
- Firewall blocking localhost?
