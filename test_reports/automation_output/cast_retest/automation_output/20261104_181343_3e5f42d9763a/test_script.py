async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":1920,"height":1080})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/movies", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-chip-28"]', timeout=15000)
        await page.locator('[data-testid="genre-chip-28"]').click(); await page.wait_for_selector('[data-testid="genre-grid"]', timeout=15000); await page.wait_for_timeout(1000)
        await page.locator('[data-testid^="card-play-"]').first.click(); await page.wait_for_selector('[data-testid="player-cast"] button', timeout=15000)
        await page.locator('[data-testid^="cast-member-"]').first.click(); await page.wait_for_selector('[data-testid="person-name"]', timeout=15000)
        print("PASS: Person modal loaded")
        known=page.locator('[data-testid="person-grid"] [data-testid^="card-play-"]').first
        await known.scroll_into_view_if_needed(); await known.click(); await page.wait_for_timeout(700)
        if await page.locator('[data-testid="person-modal"]').count()==0 and await page.locator('[data-testid="player-modal"]').count()==1: print("PASS: Known-for card closes person and opens player")
        else: print("FINDING: Known-for card handoff failed")
        await page.locator('[data-testid="player-close"]').click(); await page.wait_for_timeout(300)
        # reopen and close button
        await page.locator('[data-testid="genre-chip-28"]').click(); await page.wait_for_timeout(300); await page.locator('[data-testid^="card-play-"]').first.click(); await page.wait_for_selector('[data-testid="player-cast"] button', timeout=15000); await page.locator('[data-testid^="cast-member-"]').first.click(); await page.wait_for_selector('[data-testid="person-name"]', timeout=15000)
        await page.locator('[data-testid="person-close"]').click(); await page.wait_for_timeout(300)
        if await page.locator('[data-testid="person-modal"]').count()==0: print("PASS: Person close button works")
        else: print("FINDING: Person close button failed")
    except Exception as e:
        print("FINDING: Test execution error",repr(e)); raise
