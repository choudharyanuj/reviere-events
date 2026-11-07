"""Deterministic walkthrough video: every frame is rendered on a virtual clock, so animation is smooth
even on a machine without a GPU. JS timers/rAF are driven by Playwright's fake clock and CSS
animations/transitions are paused and seeked to the same virtual time each frame.

Usage: python capture.py <base_url> <out_dir> [fps] [scale]
"""
import base64, math, os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip('/')
OUT = sys.argv[2]
FPS = int(sys.argv[3]) if len(sys.argv) > 3 else 30
SCALE = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
LIMIT = float(os.environ.get('LIMIT', '1e9'))  # stop after N seconds (for timing tests)
W, H = 1280, 720
os.makedirs(OUT, exist_ok=True)

SYNC = """
window.__syncAnims = (now) => {
  for (const a of document.getAnimations()) {
    if (a.__v === undefined) { a.__v = now; a.pause(); }
    a.currentTime = Math.max(0, now - a.__v);
  }
};
"""

ease = lambda t: t * t * (3 - 2 * t)
lerp = lambda a, b, t: a + (b - a) * t

class Rec:
    def __init__(self, page):
        self.p, self.n, self.vt, self.t0 = page, len(os.listdir(OUT)), 0.0, time.time()
        # Raw CDP capture: Playwright's screenshot helper waits on page timers, which the fake clock owns.
        self.cdp = page.context.new_cdp_session(page)
        self.mx, self.my = W * 0.5, H * 0.5
    def frame(self):
        step = 1000.0 / FPS
        target = self.vt + step
        self.p.clock.run_for(int(round(target)) - int(round(self.vt)))
        self.vt = target
        self.p.evaluate('window.__syncAnims && window.__syncAnims(performance.now())')
        data = self.cdp.send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 92})['data']
        with open(f'{OUT}/{self.n:05d}.jpg', 'wb') as fh:
            fh.write(base64.b64decode(data))
        self.n += 1
        if self.n % 60 == 0:
            print(f'  {self.n} frames, {self.n / FPS:.1f}s of video, {time.time() - self.t0:.0f}s wall', flush=True)
        if self.n / FPS > LIMIT:
            raise SystemExit(0)
    def hold(self, sec, move_to=None):
        n = int(sec * FPS); sx, sy = self.mx, self.my
        for i in range(n):
            if move_to:
                k = ease((i + 1) / n)
                self.move(lerp(sx, move_to[0], k), lerp(sy, move_to[1], k))
            self.frame()
    def move(self, x, y):
        self.mx, self.my = x, y
        self.p.mouse.move(x, y)
    def path(self, sec, pts):
        """Glide the cursor through a list of points (Catmull-Rom-ish via smoothstep segments)."""
        n = int(sec * FPS); seg = len(pts) - 1
        for i in range(n):
            u = (i + 1) / n * seg; k = min(int(u), seg - 1); t = ease(u - k)
            self.move(lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][1], pts[k + 1][1], t))
            self.frame()
    def scroll(self, sec, px, drift=None):
        n = int(sec * FPS); done = 0
        for i in range(n):
            # bell-shaped wheel profile so Lenis eases in and out
            want = round(px * (0.5 - 0.5 * math.cos(math.pi * (i + 1) / n)))
            d = want - done; done = want
            if d: self.p.mouse.wheel(0, d)
            if drift: self.move(self.mx + drift[0] / n, self.my + drift[1] / n)
            self.frame()
    def drag(self, sec, frm, to):
        self.move(*frm); self.p.mouse.down(); n = int(sec * FPS)
        for i in range(n):
            k = ease((i + 1) / n); self.move(lerp(frm[0], to[0], k), lerp(frm[1], to[1], k)); self.frame()
        self.p.mouse.up()
    def click_at(self, x, y):
        self.move(x, y); self.p.mouse.down(); self.frame(); self.p.mouse.up(); self.frame()
    def type(self, text, per_char=0.07):
        for ch in text:
            self.p.keyboard.type(ch)
            for _ in range(max(1, int(per_char * FPS))): self.frame()
    def center_of(self, selector, nth=0):
        b = self.p.locator(selector).nth(nth).bounding_box()
        return (b['x'] + b['width'] / 2, b['y'] + b['height'] / 2)

def open_page(ctx, path):
    page = ctx.new_page()
    page.add_init_script(SYNC + "window.open = () => null;")
    page.clock.install()
    page.goto(BASE + path, wait_until='load')
    # Freeze virtual time: from here on, rAF/timers only advance inside Rec.frame()
    page.clock.pause_at(int(time.time() * 1000) + 2000)
    # let the 3D module download/compile in real time, nudging the virtual clock so idle callbacks fire
    for _ in range(40):
        page.clock.run_for(50); page.wait_for_timeout(100)
        ready = page.evaluate("(() => { const c = document.querySelector('[data-hero-canvas]'); return !c || c.style.opacity !== '' })()")
        if ready: break
    return page

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars'])
    ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=SCALE)

    # ───────── Home ─────────
    pg = open_page(ctx, '/')
    r = Rec(pg)
    r.move(W * 0.3, H * 0.55)
    r.hold(2.2)                                                    # entrance: type rises, rings fade in
    r.path(2.6, [(W * 0.3, H * 0.55), (W * 0.55, H * 0.4), (W * 0.72, H * 0.5), (W * 0.62, H * 0.62)])  # petals part around cursor
    r.drag(1.3, (W * 0.78, H * 0.62), (W * 0.42, H * 0.58))       # spin the rings
    r.hold(0.8)
    r.click_at(W * 0.66, H * 0.42); r.hold(0.9)                   # tap: petal burst + ring pulse
    r.click_at(W * 0.84, H * 0.3); r.hold(1.1)
    r.scroll(2.6, 900, drift=(-200, 80))                           # fly through the ring, counters
    r.hold(0.6)
    r.scroll(1.6, 620)                                            # services index
    rows = [r.center_of('[data-acc-trigger]', k) for k in (1, 2, 3, 4)]
    r.path(3.2, [(W * 0.35, rows[0][1]), (W * 0.42, rows[1][1]), (W * 0.36, rows[2][1]), (W * 0.45, rows[3][1])])  # previews follow the cursor
    head = r.center_of('[data-acc-trigger]', 3)
    r.hold(0.7, move_to=head)
    r.click_at(*head); r.hold(1.6)                                # open "Stage Shows & Dance"
    r.scroll(2.4, 1150)                                           # into the vendor grid
    r.path(2.4, [(W * 0.2, H * 0.62), (W * 0.45, H * 0.7), (W * 0.7, H * 0.58), (W * 0.88, H * 0.72)])  # glow borders follow
    r.scroll(2.2, 1000)                                           # highlights
    track = pg.locator('[data-gal-track]').bounding_box()
    y = track['y'] + track['height'] * 0.45
    r.hold(0.5, move_to=(W * 0.75, y))
    r.drag(1.6, (W * 0.75, y), (W * 0.22, y)); r.hold(1.0)        # drag the gallery
    r.scroll(1.8, 820)                                            # testimonials
    tab = r.center_of('[data-t-tab]', 1)
    r.hold(0.7, move_to=tab); r.click_at(*tab); r.hold(2.0)       # switch quote
    r.scroll(2.0, 860)                                            # spotlight CTA
    r.path(3.0, [(W * 0.25, H * 0.45), (W * 0.75, H * 0.4), (W * 0.4, H * 0.55)])  # beams lean toward the cursor
    r.scroll(1.8, 1200); r.hold(1.0)                              # footer
    pg.close()

    # ───────── Contact: live WhatsApp preview ─────────
    pg = open_page(ctx, '/contact.html')
    r = Rec(pg)
    r.move(W * 0.4, H * 0.5)
    r.hold(1.6)
    r.scroll(1.6, 470)
    r.hold(0.4)
    name = r.center_of('#name'); r.hold(0.5, move_to=name); r.click_at(*name); r.type('Ankit Sharma')
    ph = r.center_of('#phone'); r.hold(0.4, move_to=ph); r.click_at(*ph); r.type('+91 90000 00000', 0.05)
    chip = r.center_of('label:has(input[value="Wedding Planning & Reception"]) span')
    r.hold(0.5, move_to=chip); r.click_at(*chip); r.hold(0.4)
    r.scroll(0.9, 260)
    msg = r.center_of('#message'); r.hold(0.4, move_to=msg); r.click_at(*msg); r.type('Sangeet + reception, ~300 guests, Patna', 0.05)
    sub = r.center_of('button[type=submit]'); r.hold(0.6, move_to=sub); r.hold(1.6)
    pg.close()
    b.close()
print('done', len(os.listdir(OUT)), 'frames')
