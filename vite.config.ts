import { defineConfig } from 'vitest/config';

export default defineConfig({
  // './' makes every file path relative, so the built site works no matter
  // which sub-folder GitHub Pages serves it from (e.g. /sc5-ready/).
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // The map library is ~1 MB (287 KB compressed) but loads only on the map page.
    chunkSizeWarningLimit: 1200,
  },
  // Map worker is a modern module worker.
  worker: { format: 'es' },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
