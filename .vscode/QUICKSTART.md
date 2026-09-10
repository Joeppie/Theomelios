# Bible Researcher - VS Code Debugging

## Quick Start

### Easiest: Use the built-in electron:dev command
```bash
npm run electron:dev
```
This starts Vite + Electron together. Open browser to `http://localhost:5173/` to see the app.

### VS Code Debug (F5)
1. Press `F5`
2. Select `Electron: Dev`
3. This starts electron and attaches the debugger
4. **Important**: Make sure vite is already running (`npm run dev` in a terminal)

### Full Debug Setup
1. Open **Terminal** → **New Terminal**
2. Run: `npm run dev` (keeps running)
3. Press `F5` → `Electron: Dev`
4. The app opens in Electron window

### React DevTools
While app is running, press `Ctrl+Shift+I` inside the Electron window to open DevTools.

## Breakpoints
- Click left margin in any `.ts`/`.tsx` file
- Press `F5` to start debugging
- `F10` step over, `F11` step into

## Extensions
`Ctrl+Shift+X` → Install:
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
