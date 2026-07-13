import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path: em produção (GitHub Pages) o app fica em /coach-fitness/
// Em dev continua na raiz.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/coach-fitness/' : '/',
}))
