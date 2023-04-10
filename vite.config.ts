import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'package/main.ts',
      name: 'PotatoSlider'
    },
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    }
  },
  plugins: [],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3000
  }
});
