import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  base: '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    https: false
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  },
  publicDir: 'public'
});
