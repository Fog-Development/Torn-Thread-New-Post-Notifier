import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, renameSync, rmSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') {
            return 'service-worker.js';
          }
          return '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            return 'popup.css';
          }
          if (name.endsWith('.html')) {
            return 'popup.html';
          }
          return '[name][extname]';
        }
      }
    }
  },
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        // Copy manifest
        copyFileSync(
          resolve(__dirname, 'src/manifest-dist.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Move popup.html to dist root (Vite places it in src/popup/)
        const popupHtmlSource = resolve(__dirname, 'dist/src/popup/popup.html');
        const popupHtmlDest = resolve(__dirname, 'dist/popup.html');
        if (existsSync(popupHtmlSource)) {
          copyFileSync(popupHtmlSource, popupHtmlDest);
          // Clean up the src directory
          rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
        }

        // Copy icons
        const iconsDir = resolve(__dirname, 'dist/assets/icons');
        mkdirSync(iconsDir, { recursive: true });

        ['icon-16.png', 'icon-48.png', 'icon-128.png', 'icon-256.png'].forEach(icon => {
          copyFileSync(
            resolve(__dirname, `src/assets/icons/${icon}`),
            resolve(__dirname, `dist/assets/icons/${icon}`)
          );
        });
      }
    }
  ]
});
