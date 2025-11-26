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
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'GanttChart',
      // fileName: 'gantt-chart',
      // 文件名，不用写后缀名
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'umd', 'cjs']
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {
          'gantt-canvas-chart': 'GanttChart'
        },
        // Rename the output CSS file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'index.css';
          }
          return assetInfo.name as string;
        }
      }
    },
    // Disable minification globally for all builds
    minify: false
  },
  plugins: [banner({
    outDir: resolve(__dirname, './dist'),
    content: bannerString,
  }), dts({
    // Generate type declarations for all files
    rollupTypes: true,
    tsconfigPath: './tsconfig.json',

    // Output directory for type definitions
    outDir: 'dist',
    // Insert declaration files per module
    staticImport: true,

  })]
});