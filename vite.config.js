// frontend/vite.config.js

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
        // ✅ Specific display override for TWA wrappers & Desktop
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          { src: '/logo-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/logo-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/logo-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/logo-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        // ✅ MANDATORY FOR PLAY STORE: Categories
        categories: ["education", "productivity", "utilities"],
        // ✅ Recommended: Screenshots for Rich Install UI (Uncomment and add images to public folder)
        /*
        screenshots: [
          {
            "src": "/screenshot-mobile.png",
            "sizes": "1080x1920",
            "type": "image/png",
            "form_factor": "narrow",
            "label": "Surya Wave Home"
          },
          {
            "src": "/screenshot-desktop.png",
            "sizes": "1920x1080",
            "type": "image/png",
            "form_factor": "wide",
            "label": "Surya Wave Dashboard"
          }
        ],
        */
        related_applications: [
          {
            platform: "play",
            url: "https://play.google.com/store/apps/details?id=com.suryawave.app",
            id: "com.suryawave.app"
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module', 
      },
    }),
  ],
})