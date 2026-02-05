import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',

      registerType: 'prompt',
      injectRegister: 'auto',

      manifest: {
        name: 'Surya Wave | Quality Digital Services',
        short_name: 'Surya Wave',
        description: 'High-quality digital services like GATE test papers and final year projects at budget-friendly prices.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/logo-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/logo-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/logo-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/logo-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      // ✅ FIX: Explicitly set worker type to module for dev
      devOptions: {
        enabled: true,
        type: 'module', 
      },
    }),
  ],
})