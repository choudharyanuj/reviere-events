"""Interaction tests in a real Chromium (motion ON). Usage: python e2e.py <base_url>
window.open is stubbed so WhatsApp hand-offs can be asserted without leaving the page."""
import sys, urllib.parse
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1].rstrip('/')
STUB = "window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; };"
failures = []

def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + (f'  [{detail}]' if detail and not cond else ''))
    if not cond: failures.append(name)

def wa_text(url):
    return urllib.parse.parse_qs(urllib.parse.urlparse(url).query).get('text', [''])[0]

with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])

    def page(path, mobile=False, block3d=True):
        ctx = b.new_context(**({'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True} if mobile else {'viewport': {'width': 1440, 'height': 900}}))
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and not (block3d and ('ERR_FAILED' in m.text)) and errs.append(m.text))
        if block3d:
            pg.route('**/hero3d*', lambda r: r.abort())
        pg.add_init_script(STUB)
        pg.goto(BASE + path, wait_until='load')
        pg.wait_for_timeout(600)
        return ctx, pg, errs

    # ── Home ──
    ctx, pg, errs = page('/')
    check('home: app booted', pg.evaluate('!!window.__rv'))
    pg.locator('[data-hero3d] button[data-wa]').first.click()
    opened = pg.evaluate('window.__opened')
    check('home: hero WhatsApp button opens wa.me with its message',
          len(opened) == 1 and opened[0].startswith('https://wa.me/918893535829') and wa_text(opened[0]) == 'Hi Manish! I visited Reviere Events website and would like to consult on an upcoming event.', str(opened))
    for _ in range(14):
        pg.mouse.wheel(0, 700); pg.wait_for_timeout(250)
    pg.wait_for_timeout(1200)
    # gallery cards sit off-screen sideways until swiped, so they reveal on horizontal scroll instead
    total = pg.locator('[data-reveal]:not(.gal-card)').count(); shown = pg.locator('[data-reveal].is-in:not(.gal-card)').count()
    check('home: every reveal element became visible after scrolling', shown == total, f'{shown}/{total}')
    check('home: counters finished at their targets', pg.locator('[data-counter]').all_inner_texts() == ['50', '7', '150', '100'], str(pg.locator('[data-counter]').all_inner_texts()))
    heads = pg.locator('[data-acc-trigger]')
    heads.nth(2).scroll_into_view_if_needed(); heads.nth(2).click(); pg.wait_for_timeout(300)
    check('home: accordion opens the clicked service and closes the first',
          heads.nth(2).get_attribute('aria-expanded') == 'true' and heads.nth(0).get_attribute('aria-expanded') == 'false')
    pg.evaluate('window.__opened = []')
    pg.locator('#svc-2 [data-wa]').click()
    check('home: service CTA sends that service\'s message', wa_text(pg.evaluate('window.__opened')[0]) == 'Hi Manish! I want to inquire about Private Celebration planning.')
    tabs = pg.locator('[data-t-tab]')
    tabs.nth(1).scroll_into_view_if_needed(); tabs.nth(1).click(); pg.wait_for_timeout(300)
    check('home: testimonial tab switches the quote', pg.locator('[data-t-slide]').nth(1).get_attribute('class').find('is-active') >= 0 and tabs.nth(1).get_attribute('aria-selected') == 'true')
    track = pg.locator('[data-gal-track]')
    track.scroll_into_view_if_needed()
    before = track.evaluate('t => t.scrollLeft')
    pg.locator('[data-gal-next]').click(); pg.wait_for_timeout(900)
    check('home: gallery next-arrow scrolls the highlights', track.evaluate('t => t.scrollLeft') > before)
    box = track.bounding_box()
    pg.mouse.move(box['x'] + box['width'] * 0.7, box['y'] + 200); pg.mouse.down()
    pg.mouse.move(box['x'] + box['width'] * 0.2, box['y'] + 200, steps=8); pg.mouse.up(); pg.wait_for_timeout(1200)
    check('home: gallery can be dragged with the mouse', track.evaluate('t => t.scrollLeft') > before + 200)
    pg.locator('.wa-fab').click()
    check('home: floating WhatsApp button works', wa_text(pg.evaluate('window.__opened')[-1]) == 'Hi Manish! I want to inquire about Event Planning & Management.')
    check('home: no JS errors', not errs, ' | '.join(errs))
    ctx.close()

    # ── Home (phone): menu drawer ──
    ctx, pg, errs = page('/', mobile=True)
    tog = pg.locator('[data-menu-toggle]')
    tog.click(); pg.wait_for_timeout(500)
    check('mobile: menu opens', tog.get_attribute('aria-expanded') == 'true' and 'is-open' in pg.locator('[data-drawer]').get_attribute('class'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    check('mobile: Escape closes menu', tog.get_attribute('aria-expanded') == 'false')
    check('mobile: no horizontal overflow', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), str(pg.evaluate('[document.documentElement.scrollWidth, innerWidth]')))
    check('mobile: no JS errors', not errs, ' | '.join(errs))
    ctx.close()

    # ── Services ──
    ctx, pg, errs = page('/events.html')
    pg.locator('[data-spy-link="security"]').click(); pg.wait_for_timeout(2200)
    top = pg.locator('#security').evaluate('e => e.getBoundingClientRect().top')
    check('services: chip scrolls its service to just under the bars', 100 < top < 220, str(top))
    check('services: chip becomes active', 'is-active' in pg.locator('[data-spy-link="security"]').get_attribute('class'))
    pg.locator('#security [data-wa]').click()
    check('services: security CTA message', wa_text(pg.evaluate('window.__opened')[-1]) == 'Hi Manish! I want to inquire about Security Guard and Bodyguard services for my event.')
    check('services: no JS errors', not errs, ' | '.join(errs))
    ctx.close()

    # ── About ──
    ctx, pg, errs = page('/about.html')
    chip = pg.locator('[data-dance-chip]').nth(1)
    chip.scroll_into_view_if_needed(); chip.click(); pg.wait_for_timeout(300)
    check('about: dance chip swaps the photo', chip.get_attribute('aria-pressed') == 'true' and pg.locator('[data-dance-img="1"].is-active').count() == 1)
    for _ in range(10):
        pg.mouse.wheel(0, 700); pg.wait_for_timeout(250)
    check('about: quote words light up with scroll', pg.locator('.sw.is-lit').count() > 5, str(pg.locator('.sw.is-lit').count()))
    check('about: no JS errors', not errs, ' | '.join(errs))
    ctx.close()

    # ── Contact ──
    ctx, pg, errs = page('/contact.html')
    pg.locator('button[type=submit]').click(); pg.wait_for_timeout(300)
    check('contact: empty submit is blocked and fields flagged', pg.evaluate('window.__opened.length') == 0 and pg.locator('.is-invalid').count() == 3, str(pg.locator('.is-invalid').count()))
    pg.fill('#name', 'Ankit Sharma'); pg.fill('#phone', '+91 90000 00000')
    pg.locator('label:has(input[value="Destination Event"])').click()
    pg.fill('#eventDate', '2027-02-14'); pg.fill('#message', '200 guests, Gaya')
    expected = 'Hi Manish! I would like to inquire about Reviere Events planning services.\n\n• Name: Ankit Sharma\n• Phone: +91 90000 00000\n• Event Type: Destination Event\n• Tentative Date: 2027-02-14\n• Details: 200 guests, Gaya'
    check('contact: live preview shows the exact message', pg.locator('[data-wa-preview]').inner_text().strip() == expected.strip(), repr(pg.locator('[data-wa-preview]').inner_text()))
    pg.locator('button[type=submit]').click(); pg.wait_for_timeout(300)
    opened = pg.evaluate('window.__opened')
    check('contact: submit opens WhatsApp with the original message format', len(opened) == 1 and wa_text(opened[0]) == expected, str(opened))
    check('contact: status line shows', pg.locator('[data-form-status].is-visible').count() == 1)
    check('contact: past dates disabled', pg.locator('#eventDate').get_attribute('min') is not None)
    check('contact: no JS errors', not errs, ' | '.join(errs))
    ctx.close()

    # ── 3D scenes load and run without errors (motion on, not blocked) ──
    for path in ('/', '/about.html'):
        ctx, pg, errs = page(path, block3d=False)
        pg.wait_for_timeout(5000)
        ops = pg.evaluate("[...document.querySelectorAll('[data-hero-canvas]')].map(c => +getComputedStyle(c).opacity)")
        check(f'3d {path}: hero canvas faded in', bool(ops) and ops[0] > 0.5, str(ops))
        if path == '/':
            pg.mouse.move(1000, 450); pg.mouse.down(); pg.mouse.move(400, 420, steps=10); pg.mouse.up()
            check('3d /: dragging to spin the rings selects no text', not pg.evaluate('getSelection().toString()').strip())
        check(f'3d {path}: no JS errors', not errs, ' | '.join(errs))
        ctx.close()
    b.close()

print(f'\n{len(failures)} failure(s)')
sys.exit(1 if failures else 0)
