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

  server: {
    port: 5173,
    strictPort: false,
    hmr: { overlay: true },
  },
})
