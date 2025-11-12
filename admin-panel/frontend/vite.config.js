import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Build configuration for production
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // Server configuration (for preview)
  preview: {
    port: 8080,
    host: '0.0.0.0',
  },
})

