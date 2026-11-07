import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

gsap.registerPlugin(ScrollTrigger);

/* ───────── Smooth scroll ───────── */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.095, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
// Resolve elements to an exact pixel position ourselves: Lenis's element targeting also applies
// CSS scroll-margin/padding, which double-counts the offsets used here.
const scrollToTarget = (target: number | HTMLElement, offset = 0) => {
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + offset;
  if (lenis) lenis.scrollTo(y, { duration: 1.5 });
  else window.scrollTo({ top: y, behavior: 'auto' });
};

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
        en.target.classList.add('is-in');
        revealer.unobserve(en.target);
      }
    }),
  { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
);
$$('[data-reveal], [data-split]').forEach((el) => revealer.observe(el));

/* ───────── Counters ───────── */
if (!reduced) {
  $$('[data-counter]').forEach((el) => {
    const target = Number(el.dataset.counter);
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, {
          v: target,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate: () => (el.textContent = String(Math.floor(o.v))),
          onComplete: () => (el.textContent = String(target)),
        });
      },
    });
  });
}

/* ───────── Navigation ───────── */
const navEl = $('[data-nav]');
// The bar turns dark while it floats over a dark section, so it never reads as a grey smear.
let navTick = 0;
const onScroll = () => {
  if (navTick) return;
  navTick = requestAnimationFrame(() => {
    navTick = 0;
    navEl?.classList.toggle('is-scrolled', scrollY > 40);
    const under = document.elementsFromPoint(innerWidth / 2, 40).find((el) => !navEl?.contains(el));
    navEl?.classList.toggle('over-dark', !!under?.closest('[data-nav-dark]'));
  });
};
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
    if (open) lenis?.stop();
    else lenis?.start();
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
        cursor.classList.toggle('on-dark', !!t.closest('[data-cursor-dark]'));
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
$$('[data-accordion]').forEach((acc) => {
  const items = $$('.svc', acc);
  items.forEach((li) => {
    const btn = $('[data-acc-trigger]', li)!;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      items.forEach((o) => {
        const on = o === li ? open : false;
        $('[data-acc-trigger]', o)!.setAttribute('aria-expanded', String(on));
        o.classList.toggle('is-open', on);
      });
      setTimeout(() => ScrollTrigger.refresh(), 950);
    });
  });
});

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
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  const step = () => (cards[1]?.offsetWidth ?? 320) + 24;
  $('[data-gal-prev]', gallery)?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-gal-next]', gallery)?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  let down = false, startX = 0, startLeft = 0, moved = 0, vel = 0, lastX = 0, lastT = 0, raf = 0;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
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

/* ───────── Testimonials: tabs, autoplay, swipe ───────── */
const tWrap = $('[data-testimonials]');
if (tWrap) {
  const slides = $$('[data-t-slide]', tWrap);
  const tabs = $$('[data-t-tab]', tWrap);
  let idx = 0;
  let timer: gsap.core.Tween | null = null;
  let inView = false;
  const show = (i: number) => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      s.classList.toggle('is-active', k === idx);
      s.setAttribute('aria-hidden', String(k !== idx));
    });
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === idx));
      t.tabIndex = k === idx ? 0 : -1;
      const bar = $('.t-progress', t)!;
      gsap.killTweensOf(bar);
      gsap.set(bar, { scaleX: 0 });
    });
    timer?.kill();
    if (!reduced) {
      timer = gsap.to($('.t-progress', tabs[idx])!, { scaleX: 1, duration: 7, ease: 'none', onComplete: () => show(idx + 1) });
      if (!inView) timer.pause();
    }
  };
  tabs.forEach((t, k) => t.addEventListener('click', () => show(k)));
  tabs[0]?.parentElement?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    show(idx + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1));
    tabs[idx].focus();
  });
  tWrap.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && timer?.pause());
  tWrap.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && inView && timer?.resume());
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
  ScrollTrigger.create({
    trigger: tWrap,
    start: 'top 85%',
    end: 'bottom 15%',
    onToggle: (s) => {
      inView = s.isActive;
      if (inView) timer?.resume();
      else timer?.pause();
    },
  });
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
  links.forEach((l) => {
    const id = l.dataset.spyLink!;
    const target = document.getElementById(id);
    if (!target) return;
    ScrollTrigger.create({ trigger: target, start: 'top 60%', end: 'bottom 60%', onToggle: (s) => s.isActive && setActive(id) });
    l.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(target, -150);
      history.replaceState(null, '', `#${id}`);
    });
  });
}

/* ───────── Timelines: drawn line, active step, rolling counter ───────── */
$$('[data-timeline]').forEach((tl) => {
  const fill = $('[data-timeline-fill]', tl);
  const steps = $$('[data-timeline-step]', tl);
  const reel = $('[data-timeline-reel]', tl);
  const list = steps[0]?.parentElement;
  if (!list) return;
  if (fill) {
    if (reduced) gsap.set(fill, { scaleY: 1 });
    else gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 } });
  }
  const activate = (i: number) => {
    steps.forEach((x, k) => x.classList.toggle('is-active', k <= i));
    if (reel) reel.style.transform = `translateY(${(-i * 100) / steps.length}%)`;
  };
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onToggle: (st) => st.isActive && activate(i) }));
  activate(0);
});

/* ───────── Quote: words light up with scroll ───────── */
$$('[data-scrub-words]').forEach((q) => {
  const words = $$('.sw', q);
  if (reduced) {
    words.forEach((w) => w.classList.add('is-lit'));
    return;
  }
  ScrollTrigger.create({
    trigger: q,
    start: 'top 82%',
    end: 'bottom 48%',
    scrub: true,
    onUpdate: (s) => {
      const n = Math.round(s.progress * words.length);
      words.forEach((w, i) => w.classList.toggle('is-lit', i < n));
    },
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
  $$('[data-spin-on-scroll]').forEach((el) =>
    gsap.to(el, { rotate: 300, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 } }),
  );
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
  const lazy = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        lazy.unobserve(en.target);
        import('./spotlight')
          .then((m) => m.mountSpotlight(en.target as HTMLElement, reduced))
          .catch(() => {});
      }),
    { rootMargin: '500px 0px' },
  );
  spots.forEach((s) => lazy.observe(s));
}

// Images and fonts change layout height; keep scroll-driven animations in sync.
addEventListener('load', () => ScrollTrigger.refresh());
