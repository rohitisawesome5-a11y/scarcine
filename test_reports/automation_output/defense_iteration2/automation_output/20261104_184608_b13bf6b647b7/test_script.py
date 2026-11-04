async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width": 1440, "height": 1080})
        await page.wait_for_load_state("domcontentloaded"); await page.wait_for_timeout(1800)
        await page.locator('[data-testid="hero-watch-now"]').first.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        frame=page.locator('[data-testid="player-frame"] iframe')
        assert await frame.get_attribute("sandbox") == "allow-scripts allow-same-origin allow-forms allow-presentation"
        assert "allow-popups" not in (await frame.get_attribute("sandbox"))
        assert await page.locator('[data-testid="click-shield"]').is_visible()
        await page.locator('[data-testid="click-shield"]').click()
        assert not await page.locator('[data-testid="click-shield"]').is_visible()
        assert await page.evaluate("window.open('https://example.com')") is None
        await page.wait_for_function("document.querySelector('[data-testid=popup-defense-badge]').innerText.includes('Popups blocked (1).')")
        print("Trap and counter passed")
        relax=page.locator('[data-testid="relax-sandbox"]'); await relax.click(); await page.wait_for_timeout(600)
        s=await frame.get_attribute("sandbox"); assert "allow-popups" in s and "allow-popups-to-escape-sandbox" in s
        assert await page.evaluate("""() => { const w=window.open('about:blank'); if(w) {w.close(); return true}; return false }""") is True
        assert await relax.inner_text() == "Re-secure Sandbox"
        await relax.click(); await page.wait_for_timeout(600)
        s=await frame.get_attribute("sandbox"); assert "allow-popups" not in s
        assert await page.evaluate("window.open('https://example.com')") is None
        print("Relax/re-secure passed")
        await page.evaluate("window.postMessage({event:'frameXTV:timeupdate',data:{currentTime:42,duration:120}}, '*')")
        await page.wait_for_timeout(250)
        await page.locator('[data-testid="player-close"]').click(); await page.wait_for_timeout(300)
        assert await page.evaluate("""() => {const w=window.open('about:blank'); if(w){w.close();return true} return false}""") is True
        hist=await page.evaluate("localStorage.getItem('voidstream:history')")
        print("close restore passed; history present:", bool(hist))
        await page.set_viewport_size({"width":390,"height":844}); await page.wait_for_timeout(300)
        await page.locator('[data-testid="hero-watch-now"]').first.click(); await page.wait_for_selector('[data-testid="player-modal"]')
        overflow=await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        badge_box=await page.locator('[data-testid="popup-defense-badge"]').bounding_box()
        print("mobile overflow:",overflow,"badge:",badge_box)
        assert not overflow
        print("PASS focused defense suite")
    except AssertionError as e: print("FINDING: assertion failed",str(e))
    except Exception as e: print("FINDING: test error",str(e))
