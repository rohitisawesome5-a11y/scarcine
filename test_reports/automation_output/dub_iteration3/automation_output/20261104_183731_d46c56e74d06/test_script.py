async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded"); await page.wait_for_timeout(1000)
        await page.get_by_role("button", name="Search").click(); await page.wait_for_timeout(200)
        await page.locator('[data-testid="search-input"]').fill("classroom"); await page.wait_for_timeout(1200)
        matches=page.get_by_text("Classroom of the Elite", exact=True)
        print(f"Exact title matches: {await matches.count()}")
        for i in range(await matches.count()):
            el=matches.nth(i)
            print(f"match {i}: tag={await el.evaluate('(e)=>e.tagName')} html={(await el.evaluate('(e)=>e.parentElement.outerHTML'))[:500]}")
        # Search result card's play button is the likely action.
        play_buttons=page.locator('button').filter(has=page.locator('svg'))
        # click title's nearest button/card if available
        el=matches.first
        ancestor=el.locator("xpath=ancestor::button[1]")
        if await ancestor.count():
            await ancestor.click()
        else:
            card=el.locator("xpath=ancestor::*[self::div or self::article][.//button][1]")
            print(f"card count {await card.count()}")
            await card.click()
        await page.wait_for_timeout(900)
        if await page.locator('[data-testid="player-modal"]').count()==0:
            # click first visible play button in search overlay
            visible=[]
            for b in await page.locator('button').all():
                if await b.is_visible():
                    txt=(await b.inner_text()).strip()
                    aria=await b.get_attribute('aria-label')
                    if txt=='' or 'play' in (aria or '').lower(): visible.append(b)
            print(f"visible icon/play buttons {len(visible)}")
            if visible: await visible[0].click()
            await page.wait_for_timeout(900)
        assert await page.locator('[data-testid="player-modal"]').count()==1, "Could not open Classroom result player"
        print("Classroom player opened")
        await page.locator('[data-testid="mode-dub"]').click(); await page.wait_for_timeout(350)
        src=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src')
        assert 'server=archer' in src and 'controls=1' in src and 'autoplay=1' in src
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        print("PASS: Classroom dub flow")
    except AssertionError as e: print(f"FINDING: {e}")
    except Exception as e: print(f"TEST ERROR: {e}"); raise
