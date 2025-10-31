import { defineConfig } from 'vite';
import { notre } from 'notre';

export default defineConfig({
  plugins: [
    notre({
      preset: 'node-server' // or 'static', 'vercel', etc
    })
  ]
});