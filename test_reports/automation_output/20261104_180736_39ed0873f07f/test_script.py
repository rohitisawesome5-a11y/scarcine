async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":1920,"height":1080})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="domcontentloaded", timeout=30000)
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(4000)
        cards=page.locator('[data-testid^="card-play-"]')
        print("play cards", await cards.count())
        if await cards.count():
            await cards.first.scroll_into_view_if_needed(); await cards.first.click(); await page.wait_for_selector('[data-testid="player-modal"]',timeout=10000)
            src=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src'); print("movie src",src)
            await page.click('[data-testid="server-pill-archer"]'); await page.wait_for_timeout(300)
            src2=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src'); print("archer src",src2)
            await page.evaluate("window.postMessage({event:'frameXTV:timeupdate',data:{currentTime:600,duration:7200}}, '*')")
            await page.wait_for_timeout(700)
            hist=await page.evaluate("localStorage.getItem('voidstream:history')")
            print("history",hist)
            await page.click('[data-testid="player-close"]'); await page.wait_for_timeout(300)
            # bookmark first card
            bm=page.locator('[data-testid^="card-bookmark-"]').first; await bm.scroll_into_view_if_needed(); await bm.click(); await page.wait_for_timeout(300)
            print("bookmarks",await page.evaluate("localStorage.getItem('voidstream:bookmarks')"))
        await page.set_viewport_size({"width":390,"height":844}); await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/",wait_until="domcontentloaded",timeout=30000); await page.wait_for_timeout(2500)
        overflow=await page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        print("mobile overflow",overflow)
        error_text = await page.evaluate("""() => { const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]')); return errorElements.map(el => el.textContent).join(", "); }""")
        print("errors",error_text or "none")
    except Exception as e:
        print("TEST ERROR",repr(e)); raise
