import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';
import pkg from './package.json';
import banner from 'vite-plugin-banner'

// banner
const bannerString =
  '/*!\n' +
  ` * ${pkg.name} v${pkg.version}\n` +
  ` * (c) 2025-present chandq\n` +
  ' * Released under the MIT License.\n' +
  ' */\n';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, './docs'),
    rollupOptions: {
      external: [],
      input: resolve(__dirname, 'index.html'),
    },
    // Disable minification globally for all builds
    minify: false
  },
  plugins: [banner({
    outDir: resolve(__dirname, './docs'),
    content: bannerString,
  })]
});