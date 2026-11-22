import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' permite publicar en GitHub Pages (usuario.github.io/COREOAMA/) o en cualquier carpeta
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
