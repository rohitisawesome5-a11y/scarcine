async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844}); await page.wait_for_load_state("domcontentloaded"); await page.wait_for_timeout(1800)
        await page.locator('[data-testid="hero-watch-now"]').first.click(); await page.wait_for_selector('[data-testid="player-modal"]',timeout=10000)
        overflow=await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        print("mobile overflow",overflow)
        assert not overflow
        await page.locator('[data-testid="click-shield"]').click()
        await page.locator('[data-testid="server-pill-archer"]').click(); await page.wait_for_timeout(200)
        src=await page.locator('[data-testid="player-frame"] iframe').get_attribute("src")
        print("server src",src); assert "server=archer" in src
        await page.evaluate("window.postMessage({event:'frameXTV:timeupdate',data:{currentTime:42,duration:120}}, '*')")
        await page.wait_for_timeout(300)
        hist=await page.evaluate("localStorage.getItem('voidstream:history')")
        print("history persisted",bool(hist),hist)
        assert hist and '42' in hist
        print("PASS mobile, server switch, telemetry")
    except AssertionError as e: print("FINDING: assertion failed",str(e))
    except Exception as e: print("FINDING: test error",str(e))
