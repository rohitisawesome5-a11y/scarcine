async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844})
        await page.evaluate("localStorage.removeItem('preferred_stream_mode')")
        await page.reload(); await page.wait_for_selector('[data-testid="hero-watch-now"]',timeout=15000)
        hero=page.locator('[data-testid="hero-watch-now"]'); await hero.scroll_into_view_if_needed(); await hero.click()
        await page.wait_for_selector('[data-testid="player-modal"]',timeout=10000)
        frame=page.locator('[data-testid="player-frame"] iframe'); src=await frame.get_attribute('src')
        assert 'server=pekka' in src
        assert await page.locator('[data-testid="mode-sub"]').is_visible()
        assert await page.locator('[data-testid="mode-dub"]').is_visible()
        await page.locator('[data-testid="mode-sub"]').click(); await page.wait_for_timeout(200)
        assert 'server=barbarian' in await frame.get_attribute('src')
        assert await page.evaluate("localStorage.getItem('preferred_stream_mode')")=='sub'
        width=await page.evaluate('document.documentElement.scrollWidth'); client=await page.evaluate('document.documentElement.clientWidth')
        assert width <= client+1
        print(f'PASS: fresh mobile default, SUB switch, and no horizontal overflow ({width}/{client})')
    except AssertionError as e: print(f'FINDING: assertion failed: {e}')
    except Exception as e: print(f'FINDING: execution failed: {e}')
