import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: "public",

  server: {
    proxy: {
      "/voice": "http://localhost:8787",
      "/report": "http://localhost:8787"
    }
  }
})

