import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Base path: em produção (GitHub Pages) o app fica em /coach-fitness/
// Em dev continua na raiz.
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/coach-fitness/' : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: true },
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: base,
          start_url: base,
          scope: base,
          name: 'Coach Fitness',
          short_name: 'Coach Fitness',
          description: 'Treino, medidas e nutrição em um só lugar',
          theme_color: '#22dd0a',
          background_color: '#0a0a0b',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],
  }
})
