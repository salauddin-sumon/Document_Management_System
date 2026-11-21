import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Own ports, so this project never clashes with other projects on 5173 / 5000:
//   website http://localhost:5180  →  API http://localhost:5050 (PORT in server/.env)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    strictPort: true, // fail clearly instead of silently moving to another port
    // Forward /api calls to Express so cookies work on the same origin
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
})
