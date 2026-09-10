#!/usr/bin/env node
const { spawn } = require('child_process');

console.log('Step 1: Starting Vite dev server...\n');
const vite = spawn('npx', ['vite', '--mode', 'electron'], { 
  shell: true, 
  stdio: 'inherit' 
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

// Wait for Vite to be ready (watching for file changes message)
setTimeout(() => {
  console.log('\nStep 2: Launching Electron with debugger on port 9229...\n');
  
  const electron = spawn(
    'node',
    ['--inspect=5858', '--remote-debugging-port=9229', require('path').join(__dirname, '..', 'node_modules', 'electron', 'cli.js'), '.'],
    {
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: 'http://localhost:5173/',
      },
      stdio: 'inherit',
    }
  );

  electron.on('close', () => {
    vite.kill();
    process.exit(0);
  });

  electron.on('error', (err) => {
    console.error('Failed to start Electron:', err);
    vite.kill();
    process.exit(1);
  });
}, 5000);
