import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/presage': {
        target: 'https://api.physiology.presagetech.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/presage/, ''),
        secure: true,
      },
    },
  },
})
