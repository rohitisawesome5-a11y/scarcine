async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        await page.evaluate("localStorage.removeItem('preferred_stream_mode')")
        # Search icon is the compact header button; use its first button with aria-label/title if available.
        buttons = await page.locator("button").all()
        labels = []
        for b in buttons[:12]:
            labels.append((await b.get_attribute("aria-label"), await b.get_attribute("title"), (await b.inner_text())[:30]))
        print(f"Header buttons: {labels}")
        search_button = page.locator('button[aria-label*="earch"], button[title*="earch"]').first
        if await search_button.count() == 0:
            search_button = page.locator("header button").first
        await search_button.click()
        await page.wait_for_timeout(300)
        search = page.locator('[data-testid="search-input"]').first
        await search.wait_for(timeout=5000)
        await search.fill("classroom")
        await page.wait_for_timeout(1600)
        assert "Classroom of the Elite" in await page.locator("body").inner_text()
        await page.get_by_text("Classroom of the Elite", exact=True).first.click()
        await page.wait_for_timeout(1200)
        await page.locator('[data-testid="player-modal"]').wait_for(timeout=5000)
        print("Opened Classroom player")
        assert await page.locator('[data-testid="dub-hint"]').count() == 0
        frame=page.locator('[data-testid="player-frame"] iframe')
        src=await frame.get_attribute("src")
        assert "server=pekka" in src
        await page.locator('[data-testid="mode-dub"]').click()
        await page.wait_for_timeout(400)
        src=await frame.get_attribute("src")
        assert all(x in src for x in ["server=archer","controls=1","autoplay=1"])
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        print("Dub flow passed")
        await page.locator('[data-testid="mode-sub"]').click()
        await page.wait_for_timeout(300)
        assert "server=barbarian" in await frame.get_attribute("src")
        assert await page.locator('[data-testid="dub-hint"]').count()==0
        await page.locator('[data-testid="mode-dub"]').click()
        await page.locator('[data-testid="server-pill-archer"]').click()
        assert await page.locator('[data-testid="dub-hint"]').count()==0
        print("Sub/manual server flow passed")
        await page.locator('[data-testid="subtitle-menu-trigger"]').click(); await page.wait_for_timeout(150)
        await page.locator('[data-testid="subtitle-on"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count()==0
        await page.locator('[data-testid="subtitle-menu-trigger"]').click(); await page.wait_for_timeout(150)
        await page.locator('[data-testid="subtitle-off"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count()==0
        print("Subtitle dismissal passed")
        overflow=await page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow
        print("Mobile overflow passed")
        print("PASS: core requested flows")
    except AssertionError as e:
        print(f"FINDING: {e}")
    except Exception as e:
        print(f"TEST ERROR: {e}"); raise
