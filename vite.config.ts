import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 纯静态站点：base 用相对路径，可以直接部署到任意子目录 / 静态托管。
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5191,
    strictPort: true,
    watch: { ignored: ['**/.selftest-tmp/**', '**/.e2e-out/**', '**/dist/**'] },
  },
  preview: { host: '127.0.0.1', port: 4191, strictPort: true },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
