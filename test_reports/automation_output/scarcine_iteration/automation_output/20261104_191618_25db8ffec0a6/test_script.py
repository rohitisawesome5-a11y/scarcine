async def run_test(page, output_dir, page_url):
    import asyncio

    try:
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="hero-billboard"]', timeout=15000)
        await page.wait_for_timeout(3000)
        title = await page.title()
        assert title == "Scarcine — Zero-Auth Streaming", f"Unexpected title: {title}"
        logo = await page.locator('[data-testid="nav-logo"]').inner_text()
        assert "SCARCINE" in logo
        footer = await page.locator("footer").inner_text()
        assert "SCARCINE" in footer and "VoidStream" not in footer
        manifest = await page.evaluate("""async () => await (await fetch('/manifest.json')).json()""")
        assert manifest["name"] == "Scarcine — Zero-Auth Streaming" and manifest["short_name"] == "Scarcine"
        body_text = await page.locator("body").inner_text()
        assert "VoidStream" not in body_text and "VOIDSTREAM" not in body_text
        print("PASS branding/document/manifest")

        dots = page.locator('[data-testid="hero-dots"] button')
        count = await dots.count()
        assert count == 8, f"Expected 8 dots, got {count}"
        hero_title = page.locator('[data-testid="hero-title"]')
        before = await hero_title.inner_text()
        await page.locator('[data-testid="hero-dot-2"]').click()
        await page.wait_for_timeout(500)
        clicked = await hero_title.inner_text()
        assert clicked != before, "Dot click did not change hero title"
        eyebrow = await page.locator('[data-testid="hero-billboard"] p').first.inner_text()
        assert "Trending №3 this week" in eyebrow, eyebrow
        await page.mouse.move(720, 850)
        parked = await hero_title.inner_text()
        await page.wait_for_timeout(8500)
        rotated = await hero_title.inner_text()
        assert rotated != parked, "Hero did not auto-rotate away from hero hover"
        print("PASS hero dots and auto-rotation")

        current_hero = await hero_title.inner_text()
        await page.locator('[data-testid="hero-watch-now"]').click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        assert await page.locator('[data-testid="player-title"]').inner_text() == current_hero
        assert await page.locator('[data-testid="player-fullscreen"]').is_visible()
        for tid in ["popup-defense-badge", "click-shield", "server-pill-pekka", "mode-sub", "mode-dub"]:
            assert await page.locator(f'[data-testid="{tid}"]').is_visible(), tid
        await page.locator('[data-testid="player-fullscreen"]').click()
        await page.wait_for_timeout(800)
        fs = await page.evaluate("""() => ({fs: !!document.fullscreenElement, id: document.fullscreenElement && document.fullscreenElement.getAttribute('data-testid')})""")
        assert fs["fs"] and fs["id"] == "player-frame", fs
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(300)
        assert await page.locator('[data-testid="player-modal"]').is_visible(), "Escape closed modal during fullscreen"
        print("PASS player fullscreen and Escape guard")
        await page.locator('[data-testid="player-fullscreen"]').click()
        await page.wait_for_timeout(500)
        fs2 = await page.evaluate("() => !!document.fullscreenElement")
        assert not fs2, "Exit fullscreen did not clear fullscreenElement"
        await page.locator('[data-testid="player-close"]').click()

        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="hero-billboard"]', timeout=15000)
        await page.wait_for_timeout(2500)
        overflow = await page.evaluate("() => document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not overflow, "Horizontal overflow at mobile home"
        print("PASS mobile home no horizontal overflow")

        errors = await page.evaluate("""() => Array.from(document.querySelectorAll('.error, [class*='error'], [id*='error']')).map(el => el.textContent).join(', ')""")
        print("No error messages found on the page" if not errors else f"Found error message: {errors}")
        print("SCARCINE ITERATION PASSED")
    except AssertionError as e:
        print(f"FINDING: {e}")
    except Exception as e:
        print(f"SCRIPT ERROR: {e}")
        raise
