import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
const normalizePath = (filePath = '') => filePath.replace(/\\/g, '/');

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  root: 'public',
  base: './',
  resolve: {
    alias: {
      '@immersive': resolve(__dirname, 'public/immersive'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react-reconciler': resolve(__dirname, 'node_modules/react-reconciler'),
    },
    dedupe: ['react', 'react-dom', 'react-reconciler', '@react-three/fiber', '@react-three/drei'],
  },
  esbuild: {
    sourcemap: false,
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        home: resolve(__dirname, 'public/home.html'),
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        manualChunks: (id) => {
          const modulePath = normalizePath(id);

          if (modulePath.includes('/public/immersive/')) {
            return 'immersive';
          }

          if (modulePath.includes('/node_modules/')) {
            if (modulePath.includes('/@react-three/') || modulePath.includes('/three/')) {
              return 'vendor-three';
            }
            if (
              modulePath.includes('/react/') ||
              modulePath.includes('/react-dom/') ||
              modulePath.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (modulePath.includes('/firebase/')) {
              return 'vendor-firebase';
            }
            return 'vendor';
          }
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-reconciler',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
    ],
  },
});
