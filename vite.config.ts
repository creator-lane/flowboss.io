import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Bundle strategy:
// - Dashboard pages are already lazy-loaded via React.lazy() in App.tsx, so
//   each route ships its own chunk.
// - `manualChunks` below splits heavy third-party deps into their own chunks
//   so they (a) don't bloat the entry bundle, and (b) survive across deploys
//   in the browser cache — only chunks whose source changes get new hashes,
//   so a typical "fix a typo" release revalidates ~5% of total JS instead of
//   redownloading React + Supabase SDK + icon set from scratch.
// - esbuild drops `console.log` and `debugger` in prod builds; dev builds are
//   untouched so we can still debug locally.

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  esbuild: {
    // Strip console.log / debugger from production builds. We keep
    // console.warn + console.error so prod issues still surface in Sentry-
    // style tooling. Dev builds ignore this (vite only applies on build).
    drop: ['console', 'debugger'],
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
  },
  build: {
    // Bump from default 500 kB — with vendor splitting the entry chunk
    // should be well under this, but the warning is noisy otherwise.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React runtime — stable across releases, benefits most from caching.
          'react-vendor': ['react', 'react-dom'],
          // Router — separately cached so route-structure-only changes don't
          // evict it.
          'router-vendor': ['react-router-dom'],
          // TanStack Query — large, rarely bumped.
          'query-vendor': ['@tanstack/react-query'],
          // Supabase client — the biggest single vendor, very stable.
          'supabase-vendor': ['@supabase/supabase-js'],
          // Lucide icons — ~300 kB of SVG paths. Tree-shakes by import but
          // still worth its own chunk since every page uses ~10–20 icons.
          'icons-vendor': ['lucide-react'],
          // date-fns — modular but heavy in aggregate.
          'date-vendor': ['date-fns'],
        },
      },
    },
  },
});
