async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width": 390, "height": 844})
        await page.wait_for_load_state('domcontentloaded'); await page.wait_for_timeout(1000)
        await page.locator('[data-testid="hero-watch-now"]').click(); await page.wait_for_selector('[data-testid="player-modal"]', timeout=8000)
        await page.evaluate("window.open('https://example.com')")
        await page.wait_for_timeout(200)
        badge = await page.locator('[data-testid="popup-defense-badge"]').inner_text()
        assert 'Popups blocked (1)' in badge, badge
        history_before = await page.evaluate("localStorage.getItem('voidstream:history')")
        await page.locator('[data-testid="source-pill-vidsrc"]').click(); await page.wait_for_timeout(300)
        history_after = await page.evaluate("localStorage.getItem('voidstream:history')")
        assert history_before == history_after
        assert await page.locator('[data-testid="click-shield"]').count() == 1
        assert await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        print('PASS: Beta popup trap, history preservation, shield re-arm, and 390px no overflow')
    except AssertionError as e:
        print('FINDING: assertion failed: '+str(e))
    except Exception as e:
        print('FINDING: test exception: '+str(e))
