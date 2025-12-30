import { defineConfig } from 'vite';
import { resolve } from 'path';

const isSiteBuild = process.env.BUILD_SITE === 'true';

export default defineConfig({
  base: isSiteBuild ? './' : '/',
  build: {
    // If it's a site build, we want Vite's default behavior (building index.html)
    // If not, we build the library
    lib: isSiteBuild ? false : {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Timeline',
      fileName: 'timeline',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'timeline.css';
          return assetInfo.name;
        },
      },
    },
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
