// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_BASE=/reviere-events for the GitHub Pages preview; production deploys at the domain root.
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.reviereevent.com',
  base,
  // Keep the original URLs (/about.html, /events.html, /contact.html) so existing links keep working.
  build: { format: 'file', inlineStylesheets: 'always' },
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 700 },
  },
});
