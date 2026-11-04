async def run_test(page, output_dir, page_url):
    import json
    try:
        await page.set_viewport_size({"width": 1440, "height": 1080})
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(2500)
        print("Loaded homepage")
        watch = page.locator('[data-testid="hero-watch-now"]').first
        await watch.scroll_into_view_if_needed()
        await watch.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        print("Player opened")
        frame = page.locator('[data-testid="player-frame"] iframe')
        sandbox = await frame.get_attribute("sandbox")
        allow = await frame.get_attribute("allow")
        print("sandbox=", sandbox)
        print("allow=", allow)
        assert sandbox == "allow-scripts allow-same-origin allow-forms allow-presentation"
        assert all(x in allow for x in ["accelerometer", "autoplay", "encrypted-media", "gyroscope", "picture-in-picture"])
        assert "allow-popups" not in sandbox
        shield = page.locator('[data-testid="click-shield"]')
        assert await shield.is_visible()
        await shield.click()
        assert not await shield.is_visible()
        print("Shield dismissed")
        result = await page.evaluate("""() => { const w = window.open('https://example.com'); return w === null; }""")
        print("popup blocked:", result)
        assert result is True
        badge = await page.locator('[data-testid="popup-defense-badge"]').inner_text()
        print("badge:", badge)
        assert "Popups blocked (1)." in badge
        relax = page.locator('[data-testid="relax-sandbox"]')
        await relax.click()
        await page.wait_for_timeout(500)
        relaxed = await frame.get_attribute("sandbox")
        print("relaxed sandbox=", relaxed)
        assert "allow-popups" in relaxed and "allow-popups-to-escape-sandbox" in relaxed
        assert await relax.inner_text() == "Re-secure Sandbox"
        await relax.click()
        await page.wait_for_timeout(500)
        secured = await frame.get_attribute("sandbox")
        assert "allow-popups" not in secured
        print("Resecure passed")
        # telemetry persistence
        await page.evaluate("""() => window.postMessage({event:'frameXTV:timeupdate', data:{currentTime:42,duration:120}}, '*')""")
        await page.wait_for_timeout(200)
        await page.locator('[data-testid="player-close"]').click()
        await page.wait_for_timeout(400)
        restored = await page.evaluate("""() => { const w=window.open('about:blank'); if(w){w.close(); return true;} return false; }""")
        print("native open restored:", restored)
        assert restored is True
        hist = await page.evaluate("""() => localStorage.getItem('voidstream:history')""")
        print("history:", hist)
        print("PASS desktop defense flow")
    except AssertionError as e:
        print("FINDING: assertion failed", str(e))
    except Exception as e:
        print("FINDING: test error", str(e))
