import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // Firebase ilə yalnız bir React nüsxəsi olsun deyə
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
    ],
  },

  build: {
    rollupOptions: {
      output: {
        // Vendor kitabxanalarini ayrica chunk-a cixar: bunlar nadir deyisir,
        // ona gore brauzer kesi deploy-dan deploy-a saxlanilir.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('/react/') || id.includes('/react-dom/') ||
              id.includes('scheduler')) return 'react'
        },
      },
    },
    // Chunk-lar artiq bolundukden sonra xebardarliq hedd-i realdir
    chunkSizeWarningLimit: 700,
  },

  server: {
    port: 5173,
    strictPort: false,
    hmr: { overlay: true },
  },
})
