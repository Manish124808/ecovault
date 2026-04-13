import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // expose to network (for mobile testing on same WiFi)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react:   ['react', 'react-dom', 'react-router-dom'],
          firebase:['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts:  ['chart.js'],
          pdf:     ['jspdf'],
        },
      },
    },
  },
});
