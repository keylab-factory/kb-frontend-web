import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // En desarrollo, las llamadas a /api se reenvían al servidor Express
    proxy: { '/api': 'http://localhost:4000' },
  },
});
