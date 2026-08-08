/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// El plugin PWA solo se activa en dev/build, no durante los tests (Vitest).
const enTest = !!process.env.VITEST;

// En GitHub Pages la app se sirve bajo /<nombre-repo>/. Derivamos el base
// automáticamente del repositorio en CI, de modo que si el repo se renombra
// (p. ej. a "SileNole"), el despliegue se ajusta solo. En local/dev es "/".
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    ...(enTest
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['apple-touch-icon.png', 'coleccion.json'],
            manifest: {
              name: 'SileNole — Cromos La Liga 26/27',
              short_name: 'SileNole',
              description:
                'Sigue tu colección de cromos Panini La Liga Este 26/27: qué tienes y qué te falta.',
              lang: 'es',
              theme_color: '#0b7a3b',
              background_color: '#0b7a3b',
              display: 'standalone',
              orientation: 'portrait',
              start_url: '.',
              scope: '.',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icon-512-maskable.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              // Precachea la app y el catálogo para que funcione sin conexión.
              globPatterns: ['**/*.{js,css,html,png,svg,json}'],
            },
          }),
        ]),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
