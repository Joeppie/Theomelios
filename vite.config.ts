import { defineConfig, config } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isElectron = mode === 'electron';

  return {
    plugins: [
      react(),
      ...(isElectron ? [
        electron([
          {
            entry: 'src/main/main.ts',
            onstart({ startup }) {
              startup();
            },
            electronArgs: ['--remote-debugging-port=9229'],
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron'],
                },
              },
            },
          },
          {
            entry: 'src/preload/preload.ts',
            onstart({ startup }) {
              startup();
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron'],
                },
              },
            },
          },
        ]),
        renderer(),
      ] : []),
    ],
    resolve: {
      alias: {
        '@main': path.resolve(__dirname, 'src/main'),
        '@preload': path.resolve(__dirname, 'src/preload'),
        '@renderer': path.resolve(__dirname, 'src/renderer'),
        '@domain': path.resolve(__dirname, 'src/domain'),
        '@schema': path.resolve(__dirname, 'src/schema'),
      },
    },
    root: path.resolve(__dirname),
    build: {
      outDir: 'dist',
      target: 'esnext',
    },
    publicDir: isElectron ? false : 'public',
  };
});
