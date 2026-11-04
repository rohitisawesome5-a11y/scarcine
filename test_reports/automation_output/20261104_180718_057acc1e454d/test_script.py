async def run_test(page, output_dir, page_url):
    import json
    try:
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(5000)
        print("Loaded URL", page.url)
        for tid in ["nav-search-trigger", "hero-watch-now"]:
            try:
                await page.wait_for_selector(f'[data-testid="{tid}"]', timeout=10000)
                print("PASS visible", tid)
            except Exception as e:
                print("FINDING missing", tid, str(e))
        for text in ["Trending Today", "Top Rated Movies", "Popular TV Series"]:
            print("section", text, await page.get_by_text(text, exact=True).count())
        await page.click('[data-testid="nav-search-trigger"]')
        await page.wait_for_selector('[data-testid="search-overlay"]')
        print("PASS search opened")
        await page.fill('[data-testid="search-input"]', "batman")
        await page.wait_for_timeout(1800)
        print("search results cards", await page.locator('[data-testid^="card-play-"]').count())
        await page.click('[data-testid="search-clear"]')
        print("clear value", await page.input_value('[data-testid="search-input"]'))
        await page.keyboard.press("Escape")
        print("overlay after escape", await page.locator('[data-testid="search-overlay"]').count())
        await page.keyboard.press("Control+KeyK")
        await page.wait_for_selector('[data-testid="search-overlay"]')
        print("PASS ctrl+k opened")
        await page.keyboard.press("Escape")
        # nav
        await page.click('[data-testid="nav-link-movies"]')
        await page.wait_for_timeout(1000)
        print("movies URL", page.url)
        await page.click('[data-testid="nav-link-series"]')
        await page.wait_for_timeout(1000)
        print("series URL", page.url)
        await page.click('[data-testid="nav-link-my-library"]')
        await page.wait_for_timeout(500)
        print("library URL", page.url)
        # error scan
        error_text = await page.evaluate("""() => { const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]')); return errorElements.map(el => el.textContent).join(", "); }""")
        print("errors", error_text or "none")
    except Exception as e:
        print("TEST ERROR", repr(e))
        raise
