async def run_test(page, output_dir, page_url):
    import re

    page.set_viewport_size({"width": 390, "height": 844})
    findings = []
    try:
        await page.wait_for_load_state("networkidle", timeout=30000)
        await page.wait_for_timeout(3000)
        cards = await page.locator('[data-testid="media-card"]').count()
        imgs = await page.locator('img').evaluate_all("els => els.map(e => e.currentSrc || e.src).filter(Boolean)")
        proxy_imgs = [u for u in imgs if '/api/tmdb/img/' in u]
        tmdb_imgs = [u for u in imgs if 'image.tmdb.org' in u]
        print(f"HOME cards={cards} proxy_images={len(proxy_imgs)} direct_tmdb_images={len(tmdb_imgs)}")
        if cards == 0: findings.append("home has no media cards")
        if not proxy_imgs: findings.append("home has no proxied poster images")
        if tmdb_imgs: findings.append("direct image.tmdb.org URLs remain")
        if await page.locator('body').evaluate("b => b.scrollWidth > b.clientWidth"):
            findings.append("horizontal overflow at mobile width")

        search_buttons = page.get_by_role("button", name=re.compile("search", re.I))
        if await search_buttons.count() == 0:
            findings.append("search button not found")
        else:
            btn = search_buttons.first
            await btn.scroll_into_view_if_needed(); await btn.click()
            await page.wait_for_selector('[data-testid="search-overlay"]', timeout=5000)
            inp = page.locator('[data-testid="search-input"]')
            await inp.fill("anime")
            await page.wait_for_timeout(2500)
            anime_cards = await page.locator('[data-testid="search-results"] [data-testid="media-card"]').count()
            print(f"ANIME results={anime_cards}")
            if anime_cards == 0: findings.append("anime search returned no cards")
            await inp.fill("batman")
            await page.wait_for_timeout(2500)
            batman_cards = await page.locator('[data-testid="search-results"] [data-testid="media-card"]').count()
            print(f"BATMAN results={batman_cards}")
            if batman_cards == 0: findings.append("batman search returned no cards")
            await page.locator('[data-testid="search-filter-movie"]').click()
            movie_cards = await page.locator('[data-testid="search-results"] [data-testid="media-card"]').count()
            print(f"MOVIE_FILTER results={movie_cards}")
            await page.locator('[data-testid="search-clear"]').click()
            if await inp.input_value() != "": findings.append("search clear did not clear input")
            await inp.fill("zzqqxx!!")
            await page.wait_for_timeout(2500)
            if not await page.locator('[data-testid="search-empty"]').is_visible(): findings.append("gibberish query missing no-results state")
            else: print("GIBBERISH no-results state visible")
            await page.locator('[data-testid="search-close"]').click()

        if findings: print("FINDINGS: " + "; ".join(findings))
        else: print("PASS: mobile home and search proxy flow")
    except Exception as e:
        print(f"FINDING: test flow failed: {e}")
        raise
