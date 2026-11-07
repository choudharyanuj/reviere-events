from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox'])
    for w,h in ((1280,720),(1366,768),(1440,900),(1920,1080),(390,844),(375,667)):
        pg = b.new_page(viewport={'width':w,'height':h}, reduced_motion='reduce')
        pg.route('**/hero3d*', lambda r: r.abort())
        pg.goto('http://127.0.0.1:4321/', wait_until='load'); pg.wait_for_timeout(400)
        r = pg.evaluate("(() => { const s=document.querySelector('[data-hero3d]'); const btn=s.querySelector('.btn'); return [Math.round(s.getBoundingClientRect().height), Math.round(btn.getBoundingClientRect().bottom)] })()")
        print(f'{w}x{h}: hero height {r[0]}, primary button bottom {r[1]} -> {"above fold" if r[1] <= h else "BELOW FOLD"}')
        pg.close()
    b.close()
