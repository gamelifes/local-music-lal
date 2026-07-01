import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fix-android-loading',
      transformIndexHtml(html) {
        return html
          .replace(/ crossorigin/g, '')
          .replace(/<link rel="modulepreload"[^>]*>\n?/g, '')
          .replace(/type="module"/g, '')
          .replace(/\n{3,}/g, '\n\n')
      }
    }
  ],
})
