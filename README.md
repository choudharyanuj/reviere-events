# Reviere Events — website

A rebuild of [reviereevent.com](https://www.reviereevent.com) with the same copy. It adds a minimal,
interactive design: a WebGL hero (gold rings you can spin, marigold petals you can scatter), stage
spotlights, scroll-driven motion, and a contact form that previews the WhatsApp message as you type.

## Stack

Astro 7 (static output), Tailwind CSS 4, Three.js, GSAP + ScrollTrigger, Lenis, and native
cross-document View Transitions. Fonts are self-hosted: Instrument Serif and Geist.

The 3D code loads only after the page has rendered, and only on devices with WebGL2. Phones with
little memory or few CPU cores get fewer petals and a lower render resolution. With reduced motion
turned on, the site renders a single still frame. Without JavaScript, every piece of content is
still visible.

## Editing content

All text, phone numbers, WhatsApp messages and links live in `src/data/site.ts`. Images live in
`src/assets/images/`. Replace a file there with a real event photo of the same name and it is
resized and converted to AVIF/WebP on build.

## Commands

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site in dist/
node --test tests/content.test.mjs   # every string is checked against the original site in _source/
```

Browser interaction tests (Playwright, Python): `python _tools/e2e.py http://localhost:4321` against a
running build.

## Deploying

**Production (Vercel, same as the current site):** import the repo and choose framework preset
**Astro**. The build command is `npm run build` and the output directory is `dist`. The pages are
still `/about.html`, `/events.html` and `/contact.html`, so existing links and search results keep
working.

**Sub-path preview (GitHub Pages):**
`SITE_BASE=/reviere-events PUBLIC_PREVIEW=1 npm run build`. A preview build tells search engines
not to index it.
