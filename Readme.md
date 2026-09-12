Theomelios is a react-based Bible presentation/exploration app that lets you present the bible to a secondary screen.

Its functionalities may become similar to xyphos or easyworship or VideoPsalm.

Development is (partially) done with AI

## Setup & Running

### Prerequisites
- Node.js (v18+ recommended, v26+ requires workaround below)
- npm or yarn
- Linux desktop environment with GL support

### Setup
```bash
npm install
```

### Running in Development
```bash
./run.sh
```

**Important:** If Electron fails to launch with `ENOENT` or `spawn` errors, the `node_modules/electron/path.txt` file may have a trailing newline added by npm. The `run.sh` script handles this automatically, but if running manually:
```bash
printf "electron" > node_modules/electron/path.txt
npm run electron:dev
```

### Running Manually
```bash
npm run electron:dev
```

This starts Vite with the `electron` mode, which uses `vite-plugin-electron` to automatically launch Electron with hot-reload.


