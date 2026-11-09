// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_BASE=/reviere-events for the GitHub Pages preview; production deploys at the domain root.
const base = process.env.SITE_BASE || '/';

// Until launch, production builds only the under-construction notice (./construction), with none of the
// site's CSS, scripts or images. Set LAUNCHED = true to put the full site live. PUBLIC_FULL_SITE=1 builds
// the full site regardless (preview and test builds).
const LAUNCHED = false;
const fullSite = LAUNCHED || process.env.PUBLIC_FULL_SITE === '1';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.reviereevent.com',
  base,
  srcDir: fullSite ? './src' : './construction',
  outDir: process.env.OUT_DIR || './dist',
  // Keep the original URLs (/about.html, /events.html, /contact.html) so existing links keep working.
  build: { format: 'file', inlineStylesheets: 'always' },
  trailingSlash: 'ignore',
  prefetch: fullSite ? { prefetchAll: true, defaultStrategy: 'hover' } : false,
  vite: {
    plugins: [tailwindcss()],
    build: { chunkSizeWarningLimit: 700 },
  },
});
