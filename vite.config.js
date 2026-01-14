import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Timeline',
      // The proper extensions will be added
      fileName: 'timeline',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
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
