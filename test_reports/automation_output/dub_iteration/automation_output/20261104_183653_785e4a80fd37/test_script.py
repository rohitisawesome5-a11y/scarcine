async def run_test(page, output_dir, page_url):
    import re

    try:
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com", wait_until="domcontentloaded")
        await page.wait_for_timeout(1800)
        await page.evaluate("localStorage.removeItem('preferred_stream_mode')")
        await page.reload(wait_until="domcontentloaded")
        await page.wait_for_timeout(1600)
        print("Loaded app")

        # Locate search input and search Classroom of the Elite.
        search = page.locator('[data-testid="search-input"]').first
        await search.wait_for(timeout=5000)
        await search.fill("classroom")
        await page.wait_for_timeout(1800)
        print("Search completed")

        # Inspect visible text to identify result and open it.
        body_text = await page.locator("body").inner_text()
        assert "Classroom of the Elite" in body_text, "Classroom of the Elite result not visible"
        result = page.get_by_text("Classroom of the Elite", exact=True).first
        await result.scroll_into_view_if_needed()
        await result.click()
        await page.wait_for_timeout(1400)
        await page.locator('[data-testid="player-modal"]').wait_for(timeout=5000)
        print("Opened Classroom player")

        # Fresh open must not show hint or mode selection.
        assert await page.locator('[data-testid="dub-hint"]').count() == 0, "Fresh player incorrectly shows dub hint"
        assert await page.locator('[data-testid="mode-dub"]').count() == 1
        print("Fresh-open hint state passed")

        frame = page.locator('[data-testid="player-frame"] iframe')
        fresh_src = await frame.get_attribute("src")
        assert "server=pekka" in fresh_src, f"Unexpected fresh server: {fresh_src}"

        # DUB mode must select Archer and show hint.
        dub = page.locator('[data-testid="mode-dub"]')
        await dub.scroll_into_view_if_needed()
        await dub.click()
        await page.wait_for_timeout(500)
        dub_src = await frame.get_attribute("src")
        assert "server=archer" in dub_src and "controls=1" in dub_src and "autoplay=1" in dub_src, f"Unexpected dub src: {dub_src}"
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        print("DUB mode server/src/hint passed")

        # Switching back SUB selects Barbarian and removes hint.
        sub = page.locator('[data-testid="mode-sub"]')
        await sub.scroll_into_view_if_needed()
        await sub.click()
        await page.wait_for_timeout(500)
        sub_src = await frame.get_attribute("src")
        assert "server=barbarian" in sub_src, f"Unexpected sub src: {sub_src}"
        assert await page.locator('[data-testid="dub-hint"]').count() == 0
        print("SUB mode server/hint removal passed")

        # Manual server choice clears stream mode/hint.
        await dub.click()
        await page.wait_for_timeout(300)
        assert await page.locator('[data-testid="dub-hint"]').is_visible()
        archer = page.locator('[data-testid="server-pill-archer"]')
        await archer.scroll_into_view_if_needed()
        await archer.click()
        await page.wait_for_timeout(400)
        assert await page.locator('[data-testid="dub-hint"]').count() == 0
        print("Manual server clears hint passed")

        # Subtitle menu closes after ON and OFF.
        trigger = page.locator('[data-testid="subtitle-menu-trigger"]')
        await trigger.scroll_into_view_if_needed()
        await trigger.click()
        await page.wait_for_timeout(200)
        assert await page.locator('[data-testid="subtitle-menu"]').is_visible()
        await page.locator('[data-testid="subtitle-on"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count() == 0
        await trigger.click()
        await page.wait_for_timeout(200)
        await page.locator('[data-testid="subtitle-off"]').click()
        assert await page.locator('[data-testid="subtitle-menu"]').count() == 0
        print("Subtitle menu dismissal passed")

        # Close and verify persisted preference applies to next title/open.
        await page.evaluate("localStorage.setItem('preferred_stream_mode', 'dub')")
        await page.locator('[data-testid="player-close"]').click()
        await page.wait_for_timeout(500)
        # Re-open same visible search result.
        result = page.get_by_text("Classroom of the Elite", exact=True).first
        await result.scroll_into_view_if_needed()
        await result.click()
        await page.wait_for_timeout(800)
        assert await page.locator('[data-testid="dub-hint"]').is_visible(), "Persisted DUB preference did not apply"
        persisted_src = await page.locator('[data-testid="player-frame"] iframe').get_attribute("src")
        assert "server=archer" in persisted_src
        print("Persisted DUB preference passed")

        # Mobile horizontal overflow check.
        overflow = await page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "Horizontal overflow detected at 390px"
        print("Mobile overflow check passed")

        errors = await page.evaluate("""() => {
          const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
          return errorElements.map(el => el.textContent).join(', ');
        }""")
        if errors:
            print(f"Found error message: {errors}")
        else:
            print("No error messages found on the page")
        print("PASS: requested player regression flows completed")
    except AssertionError as e:
        print(f"FINDING: {e}")
    except Exception as e:
        print(f"TEST ERROR: {e}")
        raise
