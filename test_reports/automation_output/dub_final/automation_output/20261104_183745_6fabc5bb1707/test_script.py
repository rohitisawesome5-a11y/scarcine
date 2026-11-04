async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded"); await page.wait_for_timeout(1000)
        await page.evaluate("localStorage.removeItem('preferred_stream_mode')")
        await page.get_by_role("button", name="Search").click(); await page.wait_for_timeout(150)
        await page.locator('[data-testid="search-input"]').fill("classroom"); await page.wait_for_timeout(1000)
        title=page.get_by_text("Classroom of the Elite", exact=True).first
        await title.locator("xpath=ancestor::*[self::div or self::article][.//button][1]").click(); await page.wait_for_timeout(700)
        assert await page.locator('[data-testid="player-modal"]').count()==1
        # Fresh no hint, then dub and manual server clear.
        assert await page.locator('[data-testid="dub-hint"]').count()==0
        await page.locator('[data-testid="mode-dub"]').click(); await page.wait_for_timeout(250)
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        await page.locator('[data-testid="server-pill-archer"]').click(); await page.wait_for_timeout(200)
        assert await page.locator('[data-testid="dub-hint"]').count()==0
        print("Manual server hint clearing passed")
        # Subtitle menu both actions close.
        trigger=page.locator('[data-testid="subtitle-menu-trigger"]')
        await trigger.click(); await page.wait_for_timeout(100); await page.locator('[data-testid="subtitle-on"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count()==0
        await trigger.click(); await page.wait_for_timeout(100); await page.locator('[data-testid="subtitle-off"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count()==0
        print("Subtitle ON/OFF closure passed")
        # Preference persists and applies to a newly opened player.
        await page.evaluate("localStorage.setItem('preferred_stream_mode','dub')")
        await page.locator('[data-testid="player-close"]').click(); await page.wait_for_timeout(350)
        await title.locator("xpath=ancestor::*[self::div or self::article][.//button][1]").click(); await page.wait_for_timeout(600)
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        src=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src')
        assert 'server=archer' in src
        print("Persisted preference passed")
        overflow=await page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "horizontal overflow at 390px"
        print("Mobile overflow passed")
        errs=await page.evaluate("""() => { const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]')); return errorElements.map(el => el.textContent).join(', '); }""")
        if errs: print(f"Found error message: {errs}")
        else: print("No error messages found on the page")
        print("PASS: final requested regression suite")
    except AssertionError as e: print(f"FINDING: {e}")
    except Exception as e: print(f"TEST ERROR: {e}"); raise
