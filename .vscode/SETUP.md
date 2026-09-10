# VS Code Setup for Bible Researcher

## 1. Install Required VS Code Extensions

Install these from the Extensions panel (Ctrl+Shift+X):

### Required
- **TypeScript and JavaScript Language Features** (built-in)
- **ESLint** - `dbaeumer.vscode-eslint`
- **Prettier** - `esbenp.prettier-vscode`

### Recommended
- **ES6 String Hooks** - `huangyuan.es6-string-hooks` (string interpolation)
- **Material Icon Theme** - `pkief.material-icon-theme` (file icons)
- **Error Lens** - `alefragnani.error-lens` (inline error highlighting)
- **GitLens** - `eamodio.gitlens` (git integration)

## 2. Open Workspace

In VS Code:
1. `File` → `Open Workspace from File...`
2. Select `bible-researcher.code-workspace`
3. Or run: `code bible-researcher.code-workspace`

## 3. Install Dependencies (if not already installed)

```bash
npm install
```

## 4. Run & Debug

### Option A: Debug (Recommended)
1. Press `F5` or go to `Run and Debug` → `🚀 Run App (Dev)`
2. This starts Vite dev server + Electron with debuggers attached
3. Set breakpoints by clicking left of line numbers
4. Use Chrome DevTools for renderer debugging (toggle with Ctrl+Shift+I in the app)

### Option B: Quick Run
```bash
npm run dev
# Open second terminal
electron .
```

### Option C: Use Task Runner
1. `Ctrl+Shift+B` - Run build task
2. Tasks are in `.vscode/tasks.json`

## 5. Debugging Tips

### Breakpoints
- Click left margin to set breakpoint (red dot)
- Run with `F5` to start debugger
- Use `F9` to toggle breakpoint
- Use `F10` to step over, `F11` to step into

### Renderer Debugging (React UI)
1. Run the app
2. Press `Ctrl+Shift+I` in the Electron window
3. Use Sources tab for React component debugging
4. Install **React Developer Tools** Chrome extension for better debugging

### Main Process Debugging
- Breakpoints in `src/main/` files work automatically when running with `F5`
- Console output appears in Debug Console panel

## 6. Hot Reload

- **Renderer (React)**: Auto-reloads when you save files
- **Main process**: Auto-reloads via electron's file watcher
- **Vite**: HMR works automatically

## 7. TypeScript Errors

- Errors show inline with Error Lens extension
- Check Problems panel: `View` → `Problems`
- Run type check: `Ctrl+Shift+B` → `TypeScript: Compile`

## 8. Useful Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+B` | Run build task |
| `F5` | Start debug session |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+`` | Toggle terminal |
| `Ctrl+P` | Quick open file |
| `Ctrl+Shift+F` | Search in files |
| `F12` | Go to definition |
