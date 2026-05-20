import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [pluginReact(), pluginNodePolyfill()],
  html: {
    template: './public/index.html',
    favicon: './src/assets/car.png',
    title: 'WashApp PRO',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
  dev: {
    assetPrefix: true,
  },
  source: {
    define: {
      'process.env.RSBUILD_XAI_API_KEY': JSON.stringify(process.env.RSBUILD_XAI_API_KEY),
    },
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
});
