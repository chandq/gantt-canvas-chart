import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

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
          // $ganttCanvas: 'ganttCanvasChart'
        }
      }
    },
    // Disable minification globally for all builds
    minify: false
  },
  plugins: [dts()]
});