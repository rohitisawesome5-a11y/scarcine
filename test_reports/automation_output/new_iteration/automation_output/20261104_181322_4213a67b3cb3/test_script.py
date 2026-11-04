async def run_test(page, output_dir, page_url):
    import re
    from playwright.async_api import TimeoutError as PlaywrightTimeoutError

    try:
        await page.set_viewport_size({"width": 1920, "height": 1080})
        errors=[]
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-browser"]', timeout=15000)
        print("PASS: Discover genre browser loaded")
        await page.wait_for_selector('[data-testid="genre-chip-28"]', timeout=15000)
        print("PASS: Movie Action chip loaded")
        chip=page.locator('[data-testid="genre-chip-28"]')
        await chip.scroll_into_view_if_needed(); await chip.click()
        await page.wait_for_selector('[data-testid="genre-grid"]', timeout=15000)
        await page.wait_for_timeout(1500)
        cards=page.locator('[data-testid^="card-play-"]')
        print(f"INFO: Discover action grid play cards={await cards.count()}")
        if await cards.count()==0: print("FINDING: Action grid loaded without playable cards")
        await chip.click(); await page.wait_for_timeout(400)
        if await page.locator('[data-testid="genre-grid"]').count()==0: print("PASS: Active Action chip clears grid")
        else: print("FINDING: Active Action chip did not clear grid")

        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/movies", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-chips"]', timeout=15000)
        print("PASS: Movies genre chips loaded")
        movie_chips=await page.locator('[data-testid^="genre-chip-"]').all_text_contents()
        print("INFO: Movie chips sample", movie_chips[:5])
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/series", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-chips"]', timeout=15000)
        tv_text=" ".join(await page.locator('[data-testid^="genre-chip-"]').all_text_contents())
        print("INFO: TV chips", tv_text)
        for expected in ["ACTION & ADVENTURE","KIDS","REALITY","SCI-FI & FANTASY"]:
            if expected not in tv_text: print(f"FINDING: TV genre missing {expected}")
        print("PASS: TV-flavored genres rendered")

        # return movies and play first action result
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/movies", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="genre-chip-28"]', timeout=15000)
        await page.locator('[data-testid="genre-chip-28"]').click(); await page.wait_for_selector('[data-testid="genre-grid"]', timeout=15000); await page.wait_for_timeout(1200)
        play=page.locator('[data-testid^="card-play-"]').first; await play.scroll_into_view_if_needed(); await play.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        frame_src=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src')
        print("PASS: Genre card opened player", frame_src)
        if not frame_src or "framextv.xyz/embed" not in frame_src: print("FINDING: Player iframe URL invalid")
        await page.wait_for_selector('[data-testid="player-cast"] button', timeout=15000)
        cast=page.locator('[data-testid^="cast-member-"]').first; await cast.scroll_into_view_if_needed(); await cast.click()
        await page.wait_for_selector('[data-testid="person-modal"]', timeout=15000)
        print("PASS: Cast click opened person modal")
        await page.wait_for_selector('[data-testid="person-name"]', timeout=15000)
        print("INFO: Person", await page.locator('[data-testid="person-name"]').inner_text())
        if await page.locator('[data-testid="person-photo"]').count()==0: print("FINDING: Person modal has no photo")
        if await page.locator('[data-testid="person-bio"]').count()==0: print("FINDING: Person modal has no bio")
        if await page.locator('[data-testid="person-bio-toggle"]').count():
            bio=page.locator('[data-testid="person-bio"]'); before=await bio.bounding_box(); await page.locator('[data-testid="person-bio-toggle"]').click(); await page.wait_for_timeout(200); after=await bio.bounding_box(); print("PASS: Read more toggled", before, after)
        else: print("INFO: Biography shorter than toggle threshold")
        if await page.locator('[data-testid="person-grid"] [data-testid^="card-play-"]').count()==0: print("FINDING: Person known-for grid has no playable cards")
        else: print("PASS: Known-for grid rendered")
        await page.keyboard.press("Escape")
        if await page.locator('[data-testid="person-modal"]').count()==0: print("PASS: Escape closes person modal")
        else: print("FINDING: Escape did not close person modal")

        # PWA/browser registration and navbar
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="networkidle")
        if await page.locator('[data-testid="nav-install"]').count()==0: print("PASS: Install button absent without beforeinstallprompt")
        else: print("INFO: Install button present")
        sw=await page.evaluate("""async () => ({supported: 'serviceWorker' in navigator, registrations: await navigator.serviceWorker.getRegistrations()})""")
        print("INFO: SW supported/registrations", sw['supported'], len(sw['registrations']))
        if sw['supported'] and len(sw['registrations'])==0: print("FINDING: Service worker not registered")
        sw_errors=[x for x in errors if 'service-worker' in x.lower()]
        if sw_errors: print("FINDING: Service worker console errors: "+str(sw_errors))
        else: print("PASS: No service-worker console errors")
        await page.set_viewport_size({"width":390,"height":844}); await page.wait_for_timeout(500)
        overflow=await page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        if overflow: print("FINDING: Mobile horizontal overflow")
        else: print("PASS: Mobile viewport has no horizontal overflow")
    except Exception as e:
        print("FINDING: Test execution error", repr(e))
        raise
