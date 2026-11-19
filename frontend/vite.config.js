import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Where the backend runs. Override with VITE_PROXY_TARGET when it is not on this machine.
const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000'

const proxy = {
  '/api': { target: apiTarget, changeOrigin: true },
  '/uploads': { target: apiTarget, changeOrigin: true },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Listen on the network (not only localhost) so other devices and tunnels can open the site.
    host: true,
    allowedHosts: true,
    proxy,
  },
  // `vite preview` serves the production build; it needs the same /api proxy as `vite dev`.
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
    proxy,
  },
})
