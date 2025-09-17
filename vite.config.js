import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'https://api.megajumpparktickets.eu'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000
  }
})

