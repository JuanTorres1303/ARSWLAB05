import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Reenvía al backend real (LAB04, sin CORS configurado) para que el
      // navegador vea todo como mismo origen y no bloquee las peticiones.
      '/auth': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
  },
})
