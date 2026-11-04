async def run_test(page, output_dir, page_url):
    import asyncio
    try:
        await page.set_viewport_size({"width":1920,"height":1080})
        errors=[]
        page.on("console", lambda msg: errors.append(msg.text) if msg.type=="error" else None)
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-browser"]', timeout=15000)
        await page.locator('[data-testid="genre-chip-28"]').click()
        await page.wait_for_selector('[data-testid="genre-grid"]', timeout=12000)
        info = await page.evaluate("""() => Array.from(document.querySelectorAll('[data-testid=genre-grid] button')).slice(0,5).map(x => ({testid:x.getAttribute('data-testid'), text:x.innerText.slice(0,40), aria:x.getAttribute('aria-label')}))""")
        print(f"INFO: genre buttons {info}")
        cards=page.locator('[data-testid="genre-grid"] button').first
        await cards.scroll_into_view_if_needed(); await cards.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=12000)
        print("PASS: player opened")
        await page.wait_for_selector('[data-testid^="cast-member-"]', timeout=15000)
        await page.locator('[data-testid^="cast-member-"]').first.click()
        await page.wait_for_selector('[data-testid="person-modal"]', timeout=12000)
        print("PASS: person opened")
        for run in range(1,4):
            await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
            assert await page.locator('[data-testid="person-modal"]').count()==0, f"run {run} person not closed"
            assert await page.locator('[data-testid="player-modal"]').count()==1, f"run {run} player wrongly closed"
            print(f"PASS: run {run} first Escape closes person only")
            await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
            assert await page.locator('[data-testid="player-modal"]').count()==0, f"run {run} player not closed"
            print(f"PASS: run {run} second Escape closes player")
            if run<3:
                await cards.scroll_into_view_if_needed(); await cards.click(); await page.wait_for_selector('[data-testid="player-modal"]', timeout=12000)
                await page.wait_for_selector('[data-testid^="cast-member-"]', timeout=15000); await page.locator('[data-testid^="cast-member-"]').first.click(); await page.wait_for_selector('[data-testid="person-modal"]', timeout=12000)
        search=page.locator('[data-testid="nav-search-trigger"]')
        if await search.count():
            await search.click(); await page.wait_for_selector('[data-testid="search-input"]', timeout=5000); print("PASS: search opens")
        else: print("FINDING: search trigger testid missing")
        await page.set_viewport_size({"width":390,"height":844}); await page.reload(wait_until="domcontentloaded"); await page.wait_for_selector('[data-testid="genre-browser"]', timeout=15000)
        assert not await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth"), "mobile horizontal overflow"
        print("PASS: mobile no horizontal overflow")
        relevant=[x for x in errors if not any(k in x.lower() for k in ['localhost','posthog','websocket'])]
        assert not relevant, f"relevant console errors {relevant}"
        print("PASS: no relevant console errors")
    except AssertionError as e: print(f"FINDING: {e}")
    except Exception as e: print(f"FINDING: execution failed {e}")
