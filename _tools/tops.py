from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for name, opts in (('d', dict(viewport={'width':1440,'height':900})), ('m', dict(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True))):
        ctx = b.new_context(reduced_motion='reduce', **opts); pg = ctx.new_page()
        pg.goto('http://127.0.0.1:4321/', wait_until='networkidle'); pg.wait_for_timeout(2500)
        pg.screenshot(path=f'shots/final-{name}.png'); ctx.close()
    b.close()
