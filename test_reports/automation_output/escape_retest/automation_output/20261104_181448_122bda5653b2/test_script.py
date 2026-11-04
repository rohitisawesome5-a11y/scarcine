async def run_test(page, output_dir, page_url):
    import asyncio

    try:
        await page.set_viewport_size({"width": 1920, "height": 1080})
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-browser"]', timeout=15000)
        print("PASS: home and mood browser loaded")

        # Verify mood chip and grid
        chip = page.locator('[data-testid="genre-chip-28"]')
        await chip.scroll_into_view_if_needed()
        await chip.click()
        await page.wait_for_selector('[data-testid="genre-grid"]', timeout=12000)
        print("PASS: Action mood chip opens genre grid")

        # Find an existing playable card and open player
        cards = page.locator('button[data-testid^="media-card-play-"]')
        count = await cards.count()
        if count == 0:
            cards = page.locator('button[data-testid^="media-card-"]')
            count = await cards.count()
        assert count > 0, "no playable media cards found"
        await cards.first.scroll_into_view_if_needed()
        await cards.first.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=12000)
        print("PASS: player modal opened")

        # Wait for cast API and click a cast member
        await page.wait_for_selector('[data-testid^="cast-member-"]', timeout=15000)
        cast = page.locator('[data-testid^="cast-member-"]').first
        await cast.scroll_into_view_if_needed()
        await cast.click()
        await page.wait_for_selector('[data-testid="person-modal"]', timeout=12000)
        print("PASS: person modal opened over player")

        for run in range(1, 4):
            # Fresh nested state each run; first run currently open, subsequent runs reopen.
            if run > 1:
                await page.locator('[data-testid="player-close"]').click()
                await page.wait_for_timeout(300)
                await cards.first.scroll_into_view_if_needed()
                await cards.first.click()
                await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
                await page.wait_for_selector('[data-testid^="cast-member-"]', timeout=15000)
                await page.locator('[data-testid^="cast-member-"]').first.click()
                await page.wait_for_selector('[data-testid="person-modal"]', timeout=10000)
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            assert await page.locator('[data-testid="person-modal"]').count() == 0, f"run {run}: person remained after Escape"
            assert await page.locator('[data-testid="player-modal"]').count() == 1, f"run {run}: player closed with person"
            print(f"PASS: Escape run {run} closed person only")
            await page.keyboard.press("Escape")
            await page.wait_for_timeout(300)
            assert await page.locator('[data-testid="player-modal"]').count() == 0, f"run {run}: player remained after second Escape"
            print(f"PASS: Escape run {run} then closed player")

        # Search trigger regression
        search = page.locator('[data-testid="nav-search-trigger"]')
        if await search.count():
            await search.click()
            await page.wait_for_selector('[data-testid="search-input"]', timeout=5000)
            print("PASS: search overlay opens")
            await page.keyboard.press("Escape")
        else:
            print("FINDING: nav search trigger testid missing")

        # Mobile overflow
        await page.set_viewport_size({"width":390,"height":844})
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-browser"]', timeout=15000)
        overflow = await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not overflow, "horizontal overflow at 390px"
        print("PASS: no horizontal overflow at mobile width")

        real_errors = [e for e in console_errors if 'localhost' not in e.lower() and 'posthog' not in e.lower() and 'websocket' not in e.lower()]
        print("PASS: no relevant console errors" if not real_errors else f"FINDING: relevant console errors: {real_errors}")
    except AssertionError as e:
        print(f"FINDING: {e}")
    except Exception as e:
        print(f"FINDING: test execution failed: {e}")
