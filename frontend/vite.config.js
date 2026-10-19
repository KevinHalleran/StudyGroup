import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    // Mirrors Static Web Apps, which routes /api to the Functions host.
    proxy: {
      '/api': 'http://127.0.0.1:7071'
    }
  },
  test: {
    include: ['src/**/*.test.js']
  }
});
