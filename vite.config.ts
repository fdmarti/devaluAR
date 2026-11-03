import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      "/api/inflacion": {
        target: "https://hacecuentas.com",
        changeOrigin: true,
        rewrite: () => "/datasets/inflacion-argentina-historica-mensual.json",
      },
    },
  },
});
