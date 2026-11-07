// Verifies that every piece of copy in src/data/site.ts exists verbatim in the original site
// (archived in _source/). Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as data from '../src/data/site.ts';

const SKIP_KEYS = new Set(['icon', 'chip', 'id', 'image', 'href', 'key', 'url', 'whatsappPhone', 'ogImage', 'initials', '@context', '@type']);

const unescape = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '→')
    .replace(/&copy;/g, '©')
    .replace(/&mdash;/g, '—')
    .replace(/&bull;/g, '•')
    .replace(/&rsquo;/g, '’');

const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const files = ['index', 'about', 'events', 'contact'].map((f) => readFileSync(new URL(`../_source/${f}.html`, import.meta.url), 'utf8'));
files.push(readFileSync(new URL('../_source/script.js', import.meta.url), 'utf8'));
const raw = collapse(unescape(files.join(' ')));
const text = collapse(unescape(files.map((f) => f.replace(/<[^>]+>/g, '')).join(' ')));
const inSource = (s) => raw.includes(collapse(s)) || text.includes(collapse(s));

function collect(node, path, out) {
  if (typeof node === 'string') out.push([path, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => collect(v, `${path}[${i}]`, out));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) if (!SKIP_KEYS.has(k)) collect(v, `${path}.${k}`, out);
  return out;
}

const exportsToCheck = ['site', 'wa', 'nav', 'footerNav', 'footerServices', 'meta', 'jsonLd', 'home', 'eventsPage', 'aboutPage', 'contactPage'];

for (const name of exportsToCheck) {
  test(`${name}: every string is verbatim from the original site`, () => {
    const strings = collect(data[name], name, []);
    const missing = strings.filter(([, s]) => s.trim() && !inSource(s));
    assert.deepEqual(missing, [], `Not found in original:\n${missing.map(([p, s]) => `  ${p}: ${s}`).join('\n')}`);
  });
}

test('emphasised paragraphs join back into the original sentences', () => {
  const paras = [...data.aboutPage.bio.paragraphs, data.aboutPage.dance.paragraph];
  for (const p of paras) {
    const joined = p.map(([t]) => t).join('');
    assert.ok(text.includes(collapse(joined)) || collapse(text).includes(collapse(joined).replace(/ \./g, '.')), `paragraph not found: ${joined.slice(0, 80)}…`);
  }
});

test('the removed template artefact stays removed', () => {
  const all = JSON.stringify(Object.fromEntries(exportsToCheck.map((n) => [n, data[n]])));
  assert.ok(!all.includes('Secondary Performance Credential'));
  assert.ok(!all.includes('youtube.com'));
});

test('inquiry message matches the original format', () => {
  const m = data.buildInquiryMessage({ name: 'A', phone: '1', eventType: 'Destination Event', eventDate: '2026-12-01', message: 'Hi' });
  assert.equal(m, 'Hi Manish! I would like to inquire about Reviere Events planning services.\n\n• Name: A\n• Phone: 1\n• Event Type: Destination Event\n• Tentative Date: 2026-12-01\n• Details: Hi');
  const bare = data.buildInquiryMessage({ name: 'A', phone: '1', eventType: '', eventDate: '', message: '' });
  assert.equal(bare, 'Hi Manish! I would like to inquire about Reviere Events planning services.\n\n• Name: A\n• Phone: 1\n');
});
