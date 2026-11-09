"""Detailed desktop QA: service previews, accordion, scrolling, gallery, anchors, history, resize, idle cost.
Usage: python qa_desktop.py <base_url>   (full-site build served with clean URLs, e.g. _tools/serve.py)
Prints one line per check plus measurements; exits 1 if any check fails."""
import sys, time, json
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip('/')
results = []

def check(area, name, ok, detail=''):
    results.append((area, name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'} [{area}] {name}" + (f"  ({detail})" if detail else ''), flush=True)

def wait_for(pg, js, timeout=4.0):
    """Poll until a JS condition holds (the browser may start a keyboard scroll animation late under load)."""
    t0 = time.time()
    while time.time() - t0 < timeout:
        if pg.evaluate(js): return True
        pg.wait_for_timeout(100)
    return False

def settle(pg, timeout=4.0):
    """Wait until scrollY stops changing; return seconds taken."""
    pg.wait_for_timeout(300)
    t0, last, still = time.time(), pg.evaluate('scrollY'), 0
    while time.time() - t0 < timeout:
        pg.wait_for_timeout(50)
        y = pg.evaluate('scrollY')
        still = still + 1 if abs(y - last) < 0.5 else 0
        last = y
        if still >= 4:
            return time.time() - t0 - 0.2
    return timeout

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])

    def page(path, block3d=True, w=1440, h=900):
        ctx = b.new_context(viewport={'width': w, 'height': h})
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and 'ERR_FAILED' not in m.text and errs.append(m.text))
        if block3d:
            pg.route('**/hero3d*', lambda r: r.abort())
        pg.add_init_script("window.open = () => null; window.__qaLog = [];")
        pg.goto(BASE + path, wait_until='load')
        pg.wait_for_timeout(700)
        return ctx, pg, errs

    # Read the preview only after the browser has drawn ~15 more frames, so a fade has really been rendered
    # (this GPU-less test box can stall frame production for seconds; wall-clock waits are not enough).
    preview_op = "new Promise(r => { let n = 0; (function f(){ if (++n < 15) requestAnimationFrame(f); else r(+getComputedStyle(document.querySelector('[data-svc-preview]')).opacity); })(); })"
    preview_state = "(() => { const p = document.querySelector('[data-svc-preview]'); return [p.classList.contains('is-shown'), p.getAttribute('style'), getComputedStyle(p).transitionProperty, __qaLog.slice(-3)]; })()"

    # ───────── A. Service list image previews ─────────
    ctx, pg, errs = page('/')
    heads = pg.locator('[data-acc-trigger]')
    pg.evaluate("document.getElementById('services').scrollIntoView()"); pg.mouse.wheel(0, 350); settle(pg)
    def hover_head(i, dx=0.3):
        hb = heads.nth(i).bounding_box()
        x, y = hb['x'] + hb['width'] * dx, hb['y'] + hb['height'] / 2
        pg.mouse.move(x - 10, y); pg.mouse.move(x, y, steps=4); pg.wait_for_timeout(700)
        return x, y
    hover_head(2)
    check('A preview', 'appears when hovering a closed service title', pg.evaluate(preview_op) > 0.5)
    hover_head(2); heads.nth(2).click(); pg.wait_for_timeout(1200)
    check('A preview', 'hidden once the service is opened (must not cover its details)', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    hover_head(4)
    pg.mouse.wheel(0, 260); settle(pg); pg.wait_for_timeout(400)
    check('A preview', 'hidden after scrolling with the cursor still', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    hover_head(4)
    pg.keyboard.press('PageDown'); settle(pg); pg.wait_for_timeout(400)
    check('A preview', 'hidden after keyboard scrolling', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    pg.keyboard.press('PageUp'); settle(pg)
    hover_head(4)
    pg.mouse.move(4, 450, steps=3); pg.wait_for_timeout(700)
    check('A preview', 'hidden after the cursor leaves the list sideways', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    x, y = hover_head(4, dx=0.985)
    box = pg.evaluate("(() => { const r = document.querySelector('[data-svc-preview]').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()")
    covers = box[0] <= x <= box[2] and box[1] <= y <= box[3] and pg.evaluate(preview_op) > 0.05
    check('A preview', 'never sits under the cursor (e.g. over the +/icon buttons)', not covers, f'cursor {int(x)},{int(y)} preview {[int(v) for v in box]}')
    pg.keyboard.press('Escape'); heads.nth(1).scroll_into_view_if_needed(); settle(pg); pg.wait_for_timeout(300)
    visible = [i for i in range(heads.count()) if 120 < heads.nth(i).bounding_box()['y'] < 820]
    for i in visible[:4]:
        hover_head(i)
    pg.mouse.move(700, 30, steps=6); pg.wait_for_timeout(800)
    check('A preview', 'hidden after sweeping rows then leaving upwards', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    hover_head(1)
    pg.evaluate("window.dispatchEvent(new Event('blur')); document.documentElement.dispatchEvent(new PointerEvent('pointerleave'))"); pg.wait_for_timeout(700)
    check('A preview', 'hidden when the cursor leaves the window', pg.evaluate(preview_op) < 0.05, f'opacity {pg.evaluate(preview_op):.2f} state {pg.evaluate(preview_state)}')
    check('A preview', 'no JS errors', not errs, ' | '.join(errs[:3]))
    ctx.close()

    # ───────── B. Accordion ─────────
    ctx, pg, errs = page('/')
    heads = pg.locator('[data-acc-trigger]')
    heads.nth(4).scroll_into_view_if_needed(); settle(pg)
    pg.evaluate("new Promise(r => { let n = 0; (function f(){ if (++n < 60) requestAnimationFrame(f); else r(); })(); })")  # let the row finish revealing
    hb = heads.nth(4).bounding_box(); top_before = hb['y']
    pg.mouse.click(hb['x'] + hb['width'] * 0.3, hb['y'] + hb['height'] / 2)  # a real mouse click: no auto-scrolling by the test tool
    pg.wait_for_timeout(1300)
    pg.evaluate("new Promise(r => { let n = 0; (function f(){ if (++n < 90) requestAnimationFrame(f); else r(); })(); })")
    top_after = heads.nth(4).bounding_box()['y']
    check('B accordion', 'opening a row does not shift it away from the cursor', abs(top_after - top_before) < 30, f'title moved {top_after - top_before:+.0f}px')
    check('B accordion', 'clicked row opens', heads.nth(4).get_attribute('aria-expanded') == 'true')
    heads.nth(4).click(); pg.wait_for_timeout(1100)
    check('B accordion', 'clicking an open row closes it', heads.nth(4).get_attribute('aria-expanded') == 'false')
    ctx.close()

    # ───────── C. Scrolling ─────────
    ctx, pg, errs = page('/')
    for _ in range(6): pg.mouse.wheel(0, 120)
    t = settle(pg, 6)
    check('C scroll', 'page settles quickly after the wheel stops (no floaty lag)', t < 0.45, f'{t:.2f}s to settle')
    y1 = pg.evaluate('scrollY'); pg.mouse.wheel(0, 400); pg.mouse.wheel(0, -400); settle(pg)
    check('C scroll', 'down-then-up returns to the same place (no drift)', abs(pg.evaluate('scrollY') - y1) < 5, f'{pg.evaluate("scrollY") - y1:+.0f}px')
    pg.keyboard.press('End'); wait_for(pg, 'scrollY >= document.documentElement.scrollHeight - innerHeight - 5', 12); settle(pg, 6)
    maxy = pg.evaluate('document.documentElement.scrollHeight - innerHeight')
    check('C scroll', 'End key reaches the bottom', pg.evaluate('scrollY') >= maxy - 5, f'{pg.evaluate("scrollY"):.0f}/{maxy:.0f}')
    pg.keyboard.press('Home'); wait_for(pg, 'scrollY < 5', 12); settle(pg, 6)
    check('C scroll', 'Home key returns to the top', pg.evaluate('scrollY') < 5, f'{pg.evaluate("scrollY"):.0f}')
    pg.evaluate("window.scrollTo(0, 3000)"); settle(pg)
    pg.reload(wait_until='load'); pg.wait_for_timeout(1200)
    check('C scroll', 'reload keeps the scroll position', abs(pg.evaluate('scrollY') - 3000) < 80, f'{pg.evaluate("scrollY"):.0f}')
    # gallery
    track = pg.locator('[data-gal-track]')
    track.scroll_into_view_if_needed(); settle(pg)
    tb = track.bounding_box(); gx, gy = tb['x'] + tb['width'] / 2, tb['y'] + tb['height'] / 2
    pg.mouse.move(gx, gy)
    y0, l0 = pg.evaluate('scrollY'), track.evaluate('t => t.scrollLeft')
    pg.mouse.wheel(0, 300); settle(pg)
    check('C gallery', 'vertical wheel over the gallery scrolls the page', pg.evaluate('scrollY') > y0 + 100 and abs(track.evaluate('t => t.scrollLeft') - l0) < 5,
          f'page {pg.evaluate("scrollY") - y0:+.0f}px, gallery {track.evaluate("t => t.scrollLeft") - l0:+.0f}px')
    track.scroll_into_view_if_needed(); settle(pg)
    tb = track.bounding_box(); pg.mouse.move(tb['x'] + tb['width'] / 2, tb['y'] + tb['height'] / 2)
    y0, l0 = pg.evaluate('scrollY'), track.evaluate('t => t.scrollLeft')
    pg.mouse.wheel(300, 0); pg.wait_for_timeout(900)
    check('C gallery', 'sideways trackpad swipe scrolls the gallery, not the page', track.evaluate('t => t.scrollLeft') > l0 + 50 and abs(pg.evaluate('scrollY') - y0) < 5,
          f'gallery {track.evaluate("t => t.scrollLeft") - l0:+.0f}px, page {pg.evaluate("scrollY") - y0:+.0f}px')
    check('C scroll', 'no horizontal page overflow', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    # history
    pg.evaluate("window.scrollTo(0, 2200)"); settle(pg)
    pg.locator('.nav-link[href$="/events"]').first.click(); pg.wait_for_load_state('load'); pg.wait_for_timeout(600)
    pg.go_back(wait_until='load'); pg.wait_for_timeout(1200)
    check('C scroll', 'Back button returns to the previous scroll position', abs(pg.evaluate('scrollY') - 2200) < 120, f'{pg.evaluate("scrollY"):.0f}')
    check('C scroll', 'no JS errors', not errs, ' | '.join(errs[:3]))
    ctx.close()

    # anchors from another page
    ctx, pg, errs = page('/events#security')
    pg.wait_for_timeout(800)
    top = pg.locator('#security').evaluate('e => e.getBoundingClientRect().top')
    bars = pg.evaluate("(() => document.querySelector('[data-spy] nav').getBoundingClientRect().bottom)()")
    check('C anchors', 'link to /events#security lands just below the sticky bars', bars - 5 < top < bars + 120, f'card top {top:.0f}, bars end {bars:.0f}')
    ctx.close()

    # ───────── D. Idle / scroll cost (3D blocked, so this is DOM + CSS work only) ─────────
    def idle_cost(path, anchor=None, secs=3):
        ctx, pg, errs = page(path)
        if anchor:
            pg.evaluate(f"document.querySelector('{anchor}').scrollIntoView()"); settle(pg)
        pg.wait_for_timeout(1500)
        cdp = ctx.new_cdp_session(pg); cdp.send('Performance.enable')
        m = lambda: {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        a = m(); pg.wait_for_timeout(secs * 1000); bm = m()
        task = (bm['TaskDuration'] - a['TaskDuration']) / secs * 1000
        styles = (bm['RecalcStyleCount'] - a['RecalcStyleCount']) / secs
        ctx.close()
        return task, styles
    for label, path, anchor in (('home hero', '/', None), ('home services', '/', '#services'), ('home highlights', '/', '#highlights'), ('events', '/events', None)):
        task, styles = idle_cost(path, anchor)
        check('D idle', f'{label}: little main-thread work while idle', task < 60 and styles < 30, f'{task:.0f}ms busy per second, {styles:.0f} style recalcs/s')

    ctx, pg, errs = page('/')
    pg.evaluate("window.__lt = []; new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push(e.duration))).observe({type: 'longtask', buffered: false})")
    for _ in range(40):
        pg.mouse.wheel(0, 220); pg.wait_for_timeout(60)
    settle(pg, 6)
    lt = pg.evaluate('__lt')
    check('D scroll', 'scrolling the whole home page causes few long tasks', len(lt) <= 3 and (max(lt) if lt else 0) < 120, f'{len(lt)} long tasks, max {max(lt) if lt else 0:.0f}ms')
    ctx.close()

    # ───────── E. Hero 3D and resize ─────────
    ctx = b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=2)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + '/', wait_until='load')
    pg.wait_for_timeout(4000)
    dpr = pg.evaluate("(() => { const c = document.querySelector('[data-hero-canvas]'); return c.width / c.getBoundingClientRect().width; })()")
    check('E 3d', 'hero renders at a sensible pixel ratio for laptops (<= 1.5)', dpr <= 1.51, f'{dpr:.2f}x')
    pg.set_viewport_size({'width': 1024, 'height': 768}); pg.wait_for_timeout(1200)
    cw = pg.evaluate("(() => { const c = document.querySelector('[data-hero-canvas]'); const r = c.getBoundingClientRect(); return [r.width, innerWidth]; })()")
    check('E resize', 'hero canvas follows a window resize', abs(cw[0] - cw[1]) < 2, f'{cw}')
    check('E resize', 'no horizontal overflow at 1024px', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    check('E 3d', 'no JS errors with 3D running', not errs, ' | '.join(errs[:3]))
    ctx.close()

    # ───────── F. Content ─────────
    for path in ('/', '/events', '/about', '/contact'):
        ctx, pg, errs = page(path)
        html = pg.content()
        check('F content', f'{path}: alternative number 77629 08507 removed', '77629' not in html and '7762908507' not in html)
        ctx.close()
    b.close()

fails = [r for r in results if not r[2]]
print(f"\n{len(results) - len(fails)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
