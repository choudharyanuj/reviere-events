import { gsap } from 'gsap';
import { buildInquiryMessage } from '../data/inquiry';

declare global {
  interface Window { __rv?: boolean }
}
window.__rv = true;

const WA_PHONE = '918893535829';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));


/* ───────── Scrolling ─────────
   Native scrolling only: trackpad momentum, keyboard keys, nested scrollers (the gallery) and
   scroll restoration all behave as the browser intends. Programmatic jumps glide smoothly. */
// Layout position, ignoring transforms (cards that haven't revealed yet still sit 28px low).
const docTop = (el: HTMLElement) => {
  let y = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
};
const scrollToTarget = (target: number | HTMLElement, offset = 0) => {
  const y = typeof target === 'number' ? target : docTop(target) + offset;
  window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
};

const root = document.documentElement;
let holds = 0;
/* ───────── Exact scroll restoration on reload / Back ─────────
   The browser restores before the web fonts settle the layout, which can land a few hundred px off.
   Restore ourselves once fonts are ready, unless the visitor has already started scrolling. */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
  const key = `rv-scroll:${location.pathname}`;
  addEventListener('pagehide', () => sessionStorage.setItem(key, String(Math.round(scrollY))));
  const saved = Number(sessionStorage.getItem(key) || 0);
  const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
  if (saved > 0 && !location.hash && (navType === 'reload' || navType === 'back_forward')) {
    let userMoved = false;
    const stop = () => (userMoved = true);
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => addEventListener(t, stop, { once: true, passive: true }));
    const go = () => !userMoved && window.scrollTo(0, saved);
    go();
    document.fonts?.ready.then(go);
    addEventListener('load', go, { once: true });
  }
}

/* ───────── WhatsApp (same wa.me deep links as the original site) ───────── */
const openWhatsApp = (message: string) =>
  window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
document.addEventListener('click', (e) => {
  const el = (e.target as Element).closest<HTMLElement>('[data-wa]');
  if (el?.dataset.wa) {
    e.preventDefault();
    openWhatsApp(el.dataset.wa);
  }
});

/* ───────── Reveal on scroll ───────── */
const revealer = new IntersectionObserver(
  (entries) =>
    entries.forEach((en) => {
      if (en.isIntersecting) {
        revealer.unobserve(en.target);
        en.target.classList.add('is-in');
      }
    }),
  { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
);
$$('[data-reveal], [data-split]').forEach((el) => revealer.observe(el));

/* ───────── Scroll-driven effects ─────────
   A plain passive scroll listener batched to one frame. (GSAP ScrollTrigger was dropped: it keeps an
   empty requestAnimationFrame loop running forever, so the page never goes idle.) */
const scrollFx: ((vh: number) => void)[] = [];
let fxQueued = false;
const runFx = () => {
  fxQueued = false;
  const vh = innerHeight;
  for (const fx of scrollFx) fx(vh);
};
const queueFx = () => {
  if (fxQueued) return;
  fxQueued = true;
  requestAnimationFrame(runFx);
};
addEventListener('scroll', queueFx, { passive: true });
addEventListener('resize', queueFx);
addEventListener('load', queueFx);
// 0 → 1 as the element's top passes `start`·vh until its bottom reaches `end`·vh
const progress = (el: Element, vh: number, start: number, end: number) => {
  const r = el.getBoundingClientRect();
  return Math.max(0, Math.min(1, (vh * start - r.top) / Math.max(1, vh * (start - end) + r.height)));
};

/* ───────── Counters ───────── */
if (!reduced) {
  const counterIO = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        counterIO.unobserve(en.target);
        const el = en.target as HTMLElement;
        const target = Number(el.dataset.counter);
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.floor(o.v))),
          onComplete: () => (el.textContent = String(target)),
        });
      }),
    { rootMargin: '0px 0px -8% 0px' },
  );
  $$('[data-counter]').forEach((el) => {
    el.textContent = '0';
    counterIO.observe(el);
  });
}

/* ───────── Navigation ───────── */
const navEl = $('[data-nav]');
const onScroll = () => navEl?.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const navLinks = $('[data-nav-links]');
const pill = $('[data-nav-pill]');
if (navLinks && pill) {
  const links = $$<HTMLAnchorElement>('.nav-link', navLinks);
  const current = links.find((l) => l.getAttribute('aria-current') === 'page') ?? null;
  const moveTo = (a: HTMLElement | null) => {
    links.forEach((l) => l.classList.toggle('is-pill', l === a));
    if (!a) {
      pill.style.opacity = '0';
      return;
    }
    const li = a.parentElement!;
    pill.style.opacity = '1';
    pill.style.width = `${li.offsetWidth}px`;
    pill.style.transform = `translateX(${li.offsetLeft}px)`;
  };
  pill.style.transition = 'none';
  moveTo(current);
  void pill.offsetWidth;
  pill.style.transition = '';
  links.forEach((a) => a.addEventListener('pointerenter', () => moveTo(a)));
  navLinks.addEventListener('pointerleave', () => moveTo(current));
  document.fonts?.ready.then(() => moveTo(current));
}

const menuToggle = $('[data-menu-toggle]');
const drawer = $('[data-drawer]');
if (menuToggle && drawer) {
  const setMenu = (open: boolean) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('is-open', open);
    drawer.toggleAttribute('inert', !open);
    drawer.setAttribute('aria-hidden', String(!open));
    navEl?.classList.toggle('is-solid', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setMenu(false);
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  matchMedia('(min-width: 768px)').addEventListener('change', (m) => m.matches && setMenu(false));
}

$('[data-to-top]')?.addEventListener('click', () => scrollToTarget(0));

/* ───────── Pointer-driven micro-interactions (mouse / trackpad only) ───────── */
if (fine && !reduced) {
  // Magnetic buttons
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });

  // 3D tilt cards with a cursor-following sheen
  $$('[data-tilt]').forEach((el) => {
    const max = el.dataset.tilt === 'soft' ? 5 : 7;
    gsap.set(el, { transformPerspective: 1300 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx(-(py - 0.5) * max * 2);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });

  // Custom cursor
  const cursor = $('[data-cursor-el]');
  const label = $('[data-cursor-label]');
  if (cursor && label) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    let shown = false;
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        if (!shown) {
          gsap.set(cursor, { x: e.clientX, y: e.clientY });
          shown = true;
        }
        xTo(e.clientX);
        yTo(e.clientY);
        const t = e.target as Element;
        const interactive = t.closest('a, button, input, textarea, select, label, [role="tab"]');
        const lab = interactive ? undefined : t.closest<HTMLElement>('[data-cursor]')?.dataset.cursor;
        cursor.classList.toggle('is-hover', !!interactive);
        cursor.classList.toggle('has-label', !!lab);
        if (lab && label.textContent !== lab) label.textContent = lab;
        cursor.classList.remove('is-hidden');
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    $$('iframe').forEach((f) => f.addEventListener('pointerenter', () => cursor.classList.add('is-hidden')));
  }
}

// Glowing borders that follow the pointer across a whole tile grid (works for touch drags too)
$$('[data-glow-group]').forEach((g) => {
  const tiles = $$('.glow-tile', g);
  g.addEventListener('pointermove', (e) => {
    for (const t of tiles) {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', `${e.clientX - r.left}px`);
      t.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
  });
  g.addEventListener('pointerleave', () =>
    tiles.forEach((t) => {
      t.style.setProperty('--mx', '-999px');
      t.style.setProperty('--my', '-999px');
    }),
  );
});

/* ───────── Services index (accordion) ───────── */
// Keeps an element at the same spot on screen while content above it animates open/closed.
// Chrome's own scroll anchoring is paused meanwhile; otherwise both correct the same shift and it doubles.
const holdInPlace = (el: HTMLElement, ms = 1400) => {
  const top0 = el.getBoundingClientRect().top;
  const t0 = performance.now();
  holds++;
  root.style.overflowAnchor = 'none';
  const step = () => {
    const d = el.getBoundingClientRect().top - top0;
    if (Math.abs(d) > 0.5) window.scrollBy(0, d);
    if (performance.now() - t0 < ms) requestAnimationFrame(step);
    else if (--holds === 0) root.style.overflowAnchor = '';
  };
  requestAnimationFrame(step);
};
$$('[data-accordion]').forEach((acc) => {
  const items = $$('.svc', acc);
  items.forEach((li) => {
    const btn = $('[data-acc-trigger]', li)!;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      holdInPlace(btn);
      items.forEach((o) => {
        const on = o === li ? open : false;
        $('[data-acc-trigger]', o)!.setAttribute('aria-expanded', String(on));
        o.classList.toggle('is-open', on);
      });
    });
  });
});

/* ───────── Ticker leans into the scroll direction ───────── */
const marquee = $('[data-marquee]');
if (marquee) new IntersectionObserver(([en]) => marquee.classList.toggle('is-offscreen', !en.isIntersecting)).observe(marquee);
if (marquee && !reduced) {
  const skewTo = gsap.quickTo(marquee, 'skewX', { duration: 0.6, ease: 'power3' });
  let lastY = scrollY, lastT = performance.now(), rest = 0;
  addEventListener('scroll', () => {
    const now = performance.now();
    const v = (scrollY - lastY) / Math.max(8, now - lastT); // px per ms
    lastY = scrollY;
    lastT = now;
    skewTo(Math.max(-12, Math.min(12, -v * 6)));
    clearTimeout(rest);
    rest = window.setTimeout(() => skewTo(0), 120);
  }, { passive: true });
}

/* ───────── Highlights gallery: drag, inertia, arrows, parallax ───────── */
const gallery = $('[data-gallery]');
if (gallery) {
  const track = $('[data-gal-track]', gallery)!;
  const progress = $('[data-gal-progress]', gallery);
  const cards = $$('.gal-card', track);
  const imgs = cards.map((c) => $('.gal-img', c));

  const update = () => {
    const vis = track.clientWidth / track.scrollWidth;
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    if (progress) {
      progress.style.width = `${Math.min(1, vis) * 100}%`;
      progress.style.transform = `translateX(${(p * (1 - vis) * 100) / vis}%)`;
    }
    const tr = track.getBoundingClientRect();
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = (r.left + r.width / 2 - (tr.left + tr.width / 2)) / tr.width;
      imgs[i]?.style.setProperty('--px', `${-6.5 - d * 6}%`);
    });
  };
  // Desktop: pinned scene driven by CSS scroll-driven animations; the runway equals the sideways travel.
  const pinMQ = matchMedia('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const canPin = CSS.supports('animation-timeline: view()');
  const pinned = () => gallery.classList.contains('is-pinned');
  const layout = () => {
    const pin = canPin && pinMQ.matches;
    gallery.classList.toggle('is-pinned', pin);
    if (pin) {
      track.scrollLeft = 0;
      gallery.style.setProperty('--gal-run', `${Math.max(0, track.scrollWidth - track.clientWidth)}px`);
      if (progress) progress.style.transform = '';
    } else {
      gallery.style.removeProperty('--gal-run');
      update();
    }
  };
  track.addEventListener('scroll', () => !pinned() && update(), { passive: true });
  addEventListener('resize', layout);
  pinMQ.addEventListener('change', layout);
  layout();

  const step = () => (cards[1]?.offsetWidth ?? 320) + 24;
  $('[data-gal-prev]', gallery)?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-gal-next]', gallery)?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  let down = false, startX = 0, startLeft = 0, moved = 0, vel = 0, lastX = 0, lastT = 0, raf = 0;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || pinned()) return;
    down = true;
    startX = lastX = e.clientX;
    startLeft = track.scrollLeft;
    moved = 0;
    vel = 0;
    lastT = performance.now();
    cancelAnimationFrame(raf);
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) track.classList.add('is-dragging');
    track.scrollLeft = startLeft - dx;
    const now = performance.now();
    vel = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX;
    lastT = now;
  });
  const end = () => {
    if (!down) return;
    down = false;
    let v = -vel * 16;
    const glide = () => {
      track.scrollLeft += v;
      v *= 0.93;
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide);
      else track.classList.remove('is-dragging');
    };
    raf = requestAnimationFrame(glide);
  };
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', end);
}

/* ───────── Testimonials: tabs, autoplay, swipe ─────────
   The progress bar is a CSS animation (runs on the compositor); JS only advances when it ends. */
const tWrap = $('[data-testimonials]');
if (tWrap) {
  const slides = $$('[data-t-slide]', tWrap);
  const tabs = $$('[data-t-tab]', tWrap);
  let idx = 0;
  let inView = false, hovering = false;
  const syncPause = () => tWrap.classList.toggle('is-paused', !inView || hovering || reduced);
  const show = (i: number) => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === idx);
      s.setAttribute('aria-hidden', String(k !== idx));
    });
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === idx));
      t.tabIndex = k === idx ? 0 : -1;
    });
  };
  tabs.forEach((t, k) => {
    t.addEventListener('click', () => show(k));
    $('.t-progress', t)?.addEventListener('animationend', () => !reduced && k === idx && show(idx + 1));
  });
  tabs[0]?.parentElement?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    show(idx + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1));
    tabs[idx].focus();
  });
  tWrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; syncPause(); } });
  tWrap.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hovering = false; syncPause(); } });
  const stage = $('[data-t-stage]', tWrap)!;
  let sx = 0, sy = 0;
  stage.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
  });
  stage.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - sy)) show(idx + (dx < 0 ? 1 : -1));
  });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; syncPause(); }, { threshold: 0.25 }).observe(tWrap);
  syncPause();
  show(0);
}

/* ───────── Services page: scroll-spy chips ───────── */
const spy = $('[data-spy]');
if (spy) {
  const links = $$<HTMLAnchorElement>('[data-spy-link]', spy);
  const bar = $('nav', spy)!;
  const setActive = (id: string) =>
    links.forEach((l) => {
      const on = l.dataset.spyLink === id;
      l.classList.toggle('is-active', on);
      if (on) bar.scrollTo({ left: l.offsetLeft - bar.clientWidth / 2 + l.offsetWidth / 2, behavior: 'smooth' });
    });
  const offset = () => -((navEl?.offsetHeight ?? 72) + bar.offsetHeight + 24);
  const targets = links.map((l) => [l.dataset.spyLink!, document.getElementById(l.dataset.spyLink!)] as const).filter(([, t]) => t);
  let activeId = '';
  let lockedUntil = 0;
  scrollFx.push((vh) => {
    if (performance.now() < lockedUntil) return; // a chip was just clicked: keep its highlight while we scroll there
    const hits = targets.filter(([, t]) => {
      const r = t!.getBoundingClientRect();
      return r.top <= vh * 0.6 && r.bottom >= vh * 0.6;
    });
    // Two cards share each row on desktop; keep the current highlight if it's still on that line.
    if (!hits.length || hits.some(([id]) => id === activeId)) return;
    setActive((activeId = hits[0][0]));
  });
  links.forEach((l) => {
    const target = document.getElementById(l.dataset.spyLink!);
    if (!target) return;
    l.addEventListener('click', (e) => {
      e.preventDefault();
      setActive((activeId = l.dataset.spyLink!));
      lockedUntil = performance.now() + 1500;
      scrollToTarget(target, offset());
      history.replaceState(null, '', `#${l.dataset.spyLink}`);
    });
  });
  // Arriving from another page with #wedding etc.: land exactly below the sticky bars.
  const arrival = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (arrival && targets.some(([, t]) => t === arrival)) {
    const go = () => window.scrollTo({ top: docTop(arrival) + offset(), behavior: 'auto' });
    go();
    document.fonts?.ready.then(go);
    addEventListener('load', go, { once: true });
  }
}

/* ───────── Timelines: drawn line, active step, rolling counter ───────── */
$$('[data-timeline]').forEach((tl) => {
  const fill = $('[data-timeline-fill]', tl);
  const steps = $$('[data-timeline-step]', tl);
  const reel = $('[data-timeline-reel]', tl);
  const list = steps[0]?.parentElement;
  if (!list) return;
  let current = -1;
  const activate = (i: number) => {
    if (i === current) return;
    current = i;
    steps.forEach((x, k) => x.classList.toggle('is-active', k <= i));
    if (reel) reel.style.transform = `translateY(${(-i * 100) / steps.length}%)`;
  };
  if (fill) fill.style.transition = 'transform 120ms linear';
  scrollFx.push((vh) => {
    if (fill) fill.style.transform = `scaleY(${reduced ? 1 : progress(list, vh, 0.62, 0.62)})`;
    let i = 0;
    steps.forEach((s, k) => s.getBoundingClientRect().top <= vh * 0.62 && (i = k));
    activate(i);
  });
});

/* ───────── Quote: words light up with scroll ───────── */
$$('[data-scrub-words]').forEach((q) => {
  const words = $$('.sw', q);
  if (reduced) {
    words.forEach((w) => w.classList.add('is-lit'));
    return;
  }
  let lit = -1;
  scrollFx.push((vh) => {
    const n = Math.round(progress(q, vh, 0.82, 0.48) * words.length);
    if (n === lit) return;
    lit = n;
    words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
  });
});

/* ───────── About: dance style chips swap the photo; badge spins with scroll ───────── */
const dance = $('[data-dance]');
if (dance) {
  const chips = $$('[data-dance-chip]', dance);
  const imgs = $$('[data-dance-img]', dance);
  const pick = (chip: HTMLElement) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    imgs.forEach((im) => im.classList.toggle('is-active', im.dataset.danceImg === chip.dataset.danceChip));
  };
  chips.forEach((c) => {
    c.addEventListener('click', () => pick(c));
    c.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && pick(c));
  });
}
if (!reduced) {
  $$('[data-spin-on-scroll]').forEach((el) => {
    el.style.transition = 'transform 300ms linear';
    scrollFx.push((vh) => (el.style.transform = `rotate(${progress(el, vh, 1, 0) * 300}deg)`));
  });
}

/* ───────── Contact: live WhatsApp preview, validation, copy buttons ───────── */
const form = $<HTMLFormElement>('[data-inquiry]');
if (form) {
  const preview = $('[data-wa-preview]');
  const time = $('[data-wa-time]');
  const status = $('[data-form-status]', form);
  let typingTimer = 0;
  const read = () => {
    const fd = new FormData(form);
    const s = (k: string) => String(fd.get(k) ?? '').trim();
    return { name: s('name'), phone: s('phone'), eventType: s('eventType'), eventDate: s('eventDate'), message: s('message') };
  };
  const render = () => {
    if (!preview) return;
    preview.textContent = buildInquiryMessage(read());
    preview.classList.add('is-typing');
    clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => preview.classList.remove('is-typing'), 900);
  };
  if (time) time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = $<HTMLInputElement>('#eventDate', form);
  if (date) date.min = new Date().toISOString().split('T')[0];
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = read();
    const checks: [Element | null, boolean][] = [
      [$('#name', form)?.closest('.field') ?? null, !!f.name],
      [$('#phone', form)?.closest('.field') ?? null, !!f.phone],
      [$('[data-event-type]', form), !!f.eventType],
    ];
    let firstBad: Element | null = null;
    for (const [el, ok] of checks) {
      el?.classList.toggle('is-invalid', !ok);
      el?.querySelector('input')?.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = el;
    }
    if (firstBad) {
      (firstBad.querySelector('input') as HTMLInputElement | null)?.focus({ preventScroll: true });
      scrollToTarget(firstBad as HTMLElement, -160);
      if (!reduced) gsap.fromTo(firstBad, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    status?.classList.add('is-visible');
    openWhatsApp(buildInquiryMessage(f));
  });
  form.addEventListener('input', (e) => {
    const field = (e.target as Element).closest('.field, [data-event-type]');
    if (field?.classList.contains('is-invalid')) field.classList.remove('is-invalid');
  });
}

const toast = $('[data-toast]');
let toastTimer = 0;
const showToast = (msg: string) => {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
};
$$('[data-copy]').forEach((b) =>
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy!);
      showToast(`Copied ${b.dataset.copy}`);
    } catch {
      showToast('Copy not available');
    }
  }),
);

/* ───────── Pause decorative CSS loops while their section is off screen ───────── */
$$('[data-hero3d]').forEach((h) => new IntersectionObserver(([en]) => h.classList.toggle('is-offscreen', !en.isIntersecting)).observe(h));

/* ───────── 3D scenes, loaded after first paint so they never delay the page ───────── */
const hero = $('[data-hero3d]');
const heroCanvas = hero && $<HTMLCanvasElement>('[data-hero-canvas]', hero);
if (hero && heroCanvas) {
  const start = () =>
    import('./hero3d')
      .then((m) => m.mountHero(hero, heroCanvas, { variant: hero.dataset.hero3d === 'home' ? 'home' : 'page', reduced }))
      .catch(() => {}); // 3D is decoration: if it can't load, the CSS glow backdrop stays.
  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
  else setTimeout(start, 400);
}

const spots = $$('[data-spotlight]');
if (spots.length) {
  // Prepare the stage lights while the visitor is still near the top (at idle), so nothing has to be
  // built mid-scroll. Their render loops only run while they are on screen.
  const mountAll = () => {
    import('./spotlight')
      .then((m) => spots.forEach((s) => m.mountSpotlight(s, reduced)))
      .catch(() => {});
  };
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(mountAll, { timeout: 2500 }) : setTimeout(mountAll, 800));
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}

queueFx();
document.fonts?.ready.then(queueFx);
