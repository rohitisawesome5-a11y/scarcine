async def run_test(page, output_dir, page_url):
    import json

    try:
        await page.set_viewport_size({"width": 1440, "height": 1080})
        await page.evaluate("localStorage.removeItem('preferred_stream_mode'); localStorage.removeItem('voidstream:history')")
        await page.reload()
        await page.wait_for_selector('[data-testid="hero-watch-now"]', timeout=15000)
        print('PASS: home loaded')
        await page.locator('[data-testid="hero-watch-now"]').scroll_into_view_if_needed()
        await page.locator('[data-testid="hero-watch-now"]').click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        frame = page.locator('[data-testid="player-frame"] iframe')
        src = await frame.get_attribute('src')
        assert 'server=pekka' in src and 'controls=1' in src
        assert await page.locator('[data-testid="stream-mode-switch"]').is_visible()
        assert await page.locator('[data-testid="subtitle-menu-trigger"]').is_visible()
        print('PASS: toolbar renders and fresh default is pekka')

        await page.locator('[data-testid="mode-dub"]').click()
        await page.wait_for_timeout(300)
        src = await frame.get_attribute('src')
        pref = await page.evaluate("localStorage.getItem('preferred_stream_mode')")
        assert 'server=archer' in src and pref == 'dub'
        assert 'bg-[#e50914]' in (await page.locator('[data-testid="mode-dub"]').get_attribute('class'))
        print('PASS: DUB switches archer, highlights, persists')

        await page.locator('[data-testid="subtitle-menu-trigger"]').click()
        await page.wait_for_selector('[data-testid="subtitle-menu"]')
        await page.locator('[data-testid="subtitle-on"]').click()
        assert not await page.locator('[data-testid="subtitle-menu"]').is_visible()
        await page.locator('[data-testid="subtitle-menu-trigger"]').click()
        await page.wait_for_selector('[data-testid="subtitle-menu"]')
        await page.locator('[data-testid="subtitle-off"]').click()
        assert not await page.locator('[data-testid="subtitle-menu"]').is_visible()
        print('PASS: subtitle ON/OFF close menu')

        await page.locator('[data-testid="server-pill-goblin"]').click()
        src = await frame.get_attribute('src')
        assert 'server=goblin' in src and await page.evaluate("localStorage.getItem('preferred_stream_mode')") == 'dub'
        assert 'bg-[#e50914]' not in (await page.locator('[data-testid="mode-dub"]').get_attribute('class'))
        print('PASS: manual server clears mode highlight without changing preference')

        await page.locator('[data-testid="subtitle-menu-trigger"]').click()
        await page.wait_for_selector('[data-testid="subtitle-menu"]')
        await page.keyboard.press('Escape')
        assert await page.locator('[data-testid="player-modal"]').is_visible()
        print('PASS: Escape does not close player')
        await page.locator('[data-testid="player-close"]').click()
        await page.wait_for_timeout(300)
        assert not await page.locator('[data-testid="player-modal"]').is_visible()
        await page.locator('[data-testid="hero-watch-now"]').click()
        await page.wait_for_selector('[data-testid="player-modal"]')
        src2 = await page.locator('[data-testid="player-frame"] iframe').get_attribute('src')
        assert 'server=archer' in src2
        print('PASS: reopening title honors persisted DUB preference')

        await page.locator('[data-testid="player-close"]').click()
        await page.set_viewport_size({"width":390,"height":844})
        await page.locator('[data-testid="hero-watch-now"]').click()
        await page.wait_for_selector('[data-testid="player-modal"]')
        box = await page.locator('body').bounding_box()
        scroll_width = await page.evaluate('document.documentElement.scrollWidth')
        client_width = await page.evaluate('document.documentElement.clientWidth')
        assert scroll_width <= client_width + 1
        assert await page.locator('[data-testid="stream-mode-switch"]').is_visible()
        print(f'PASS: mobile toolbar visible, no horizontal overflow ({scroll_width}/{client_width})')

        error_text = await page.evaluate("""() => { const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]')); return errorElements.map(el => el.textContent).join(', '); }""")
        print('No app error messages found' if not error_text else f'Found error message: {error_text}')
    except AssertionError as e:
        print(f'FINDING: assertion failed: {e}')
    except Exception as e:
        print(f'FINDING: test execution failed: {e}')
