
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Shims process.env for browser compatibility with @google/genai
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
