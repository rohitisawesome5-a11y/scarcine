async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":1440,"height":1080})
        await page.evaluate("localStorage.setItem('preferred_stream_mode','dub')")
        await page.reload()
        await page.wait_for_selector('[data-testid="hero-watch-now"]', timeout=15000)
        hero=page.locator('[data-testid="hero-watch-now"]'); await hero.scroll_into_view_if_needed(); await hero.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=10000)
        src=await page.locator('[data-testid="player-frame"] iframe').get_attribute('src')
        print('Reopen src:',src)
        assert 'server=archer' in src
        print('PASS: stored DUB preference selects archer on new opening')
        await page.locator('[data-testid="subtitle-menu-trigger"]').click(); await page.wait_for_selector('[data-testid="subtitle-menu"]')
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        print('After Escape: player=',await page.locator('[data-testid="player-modal"]').count(),'menu=',await page.locator('[data-testid="subtitle-menu"]').count())
        assert await page.locator('[data-testid="player-modal"]').count()==0
        print('PASS: Escape closes player (menu overlay does not block modal handler)')
    except AssertionError as e: print(f'FINDING: assertion failed: {e}')
    except Exception as e: print(f'FINDING: execution failed: {e}')
