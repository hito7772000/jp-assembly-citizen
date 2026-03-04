import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  publicDir: "public",

  server: {
    proxy: {
      "/voice": "http://localhost:8787",
      "/report": "http://localhost:8787"
    }
  }
})