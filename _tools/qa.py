"""Visual QA: screenshots + console errors for each page. Usage: python qa.py <base_url> <out_dir> [pages...]"""
import os, sys, json, time
from playwright.sync_api import sync_playwright

base, out = sys.argv[1].rstrip('/'), sys.argv[2]
pages = sys.argv[3:] or ['/', '/events.html', '/about.html', '/contact.html']
os.makedirs(out, exist_ok=True)
LIB = os.path.expanduser('~/.tools/libs/root/usr/lib64')
env = {**os.environ, 'LD_LIBRARY_PATH': LIB}
views = {'desktop': dict(viewport={'width': 1440, 'height': 900}, device_scale_factor=1),
         'mobile': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=1, is_mobile=True, has_touch=True)}
only = os.environ.get('VIEWS', 'desktop,mobile').split(',')
report = {}
with sync_playwright() as p:
    b = p.chromium.launch(env=env, args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'])
    for vname in only:
        ctx = b.new_context(**views[vname], reduced_motion=os.environ.get('MOTION', 'reduce'))
        for path in pages:
            pg = ctx.new_page()
            errs = []
            pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
            pg.goto(base + path, wait_until='networkidle')
            pg.wait_for_timeout(2500)
            name = (path.strip('/').replace('.html', '') or 'home')
            pg.screenshot(path=f'{out}/{vname}-{name}-top.png')
            h = pg.evaluate('document.documentElement.scrollHeight')
            vh = views[vname]['viewport']['height']
            # step through the page so scroll-triggered reveals fire, grabbing viewport shots
            y, i = 0, 0
            while y < h:
                y += int(vh * 0.85)
                pg.mouse.wheel(0, int(vh * 0.85))
                pg.wait_for_timeout(900)
                i += 1
                if os.environ.get('STEPS'):
                    pg.screenshot(path=f'{out}/{vname}-{name}-s{i:02d}.png')
            pg.wait_for_timeout(800)
            pg.screenshot(path=f'{out}/{vname}-{name}-full.png', full_page=True)
            webgl = pg.evaluate("""() => [...document.querySelectorAll('canvas')].map(c => ({o: getComputedStyle(c).opacity, w: c.width, h: c.height}))""")
            report[f'{vname}{path}'] = {'errors': errs, 'height': h, 'canvases': webgl}
            pg.close()
        ctx.close()
    b.close()
print(json.dumps(report, indent=1))
