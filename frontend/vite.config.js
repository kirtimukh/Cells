import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3001
  },
  server: {
    port: 3000,
    // host: 'localhost'
    host: '0.0.0.0'
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    emptyOutDir: true,
    outDir: './dist'
  }
})

// https://stackoverflow.com/questions/74228325/how-to-set-a-custom-output-name-for-script-with-vite-build