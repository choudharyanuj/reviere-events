// Prefix internal links with the deploy base, so the same build works at the domain root
// (production) and under a sub-path (the GitHub Pages preview).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const u = (path: string) => (path.startsWith('/') ? `${base}${path}` : path);
export const isPreview = import.meta.env.PUBLIC_PREVIEW === '1';
