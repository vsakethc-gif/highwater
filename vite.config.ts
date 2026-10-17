import { defineConfig } from 'vitest/config';

export default defineConfig({
  // './' makes every file path relative, so the built site works no matter
  // which sub-folder GitHub Pages serves it from (e.g. /sc5-ready/).
  base: './',
  build: { outDir: 'dist', sourcemap: true },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
