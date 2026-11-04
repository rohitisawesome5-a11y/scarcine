async def run_test(page, output_dir, page_url):
    import re
    try:
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(1500)
        print("PASS: homepage loaded")
        hero = page.locator('[data-testid="hero-watch-now"]')
        await hero.scroll_into_view_if_needed()
        await hero.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=8000)
        frame = page.locator('[data-testid="player-modal"] iframe').first
        src = await frame.get_attribute('src')
        assert 'framextv.xyz/embed/' in src and 'server=pekka' in src and 'controls=1' in src
        assert await page.locator('[data-testid="source-pill-framextv"]').count() == 1
        assert await page.locator('[data-testid="source-pill-vidsrc"]').count() == 1
        assert await page.locator('[data-testid="source-pill-autoembed"]').count() == 1
        assert await page.locator('[data-testid="source-pill-multiembed"]').count() == 1
        assert await page.locator('[data-testid="server-pill-pekka"]').count() == 1
        print("PASS: Alpha default URL and four source pills")
        beta = page.locator('[data-testid="source-pill-vidsrc"]')
        await beta.scroll_into_view_if_needed(); await beta.click(); await page.wait_for_timeout(500)
        src = await frame.get_attribute('src')
        assert 'vidsrc.cc/v2/embed/movie/' in src and 'autoPlay=true' in src
        assert await page.locator('[data-testid="server-pill-pekka"]').count() == 0
        assert await page.locator('[data-testid="mode-sub"]').count() == 0
        assert await page.locator('[data-testid="subtitle-menu-trigger"]').count() == 0
        assert await page.locator('[data-testid="player-fullscreen"]').count() == 1
        assert 'allow-popups' not in (await frame.get_attribute('sandbox') or '')
        print("PASS: Beta URL, FrameX controls hidden, sandbox strict")
        # relax sandbox on active provider
        relax = page.locator('[data-testid="relax-sandbox"]'); await relax.scroll_into_view_if_needed(); await relax.click(); await page.wait_for_timeout(300)
        assert 'allow-popups' in (await frame.get_attribute('sandbox') or '')
        print("PASS: Relax Sandbox applies to Beta iframe")
        # provider cycle from Beta -> Gamma -> Delta -> Alpha
        expected = ['player.autoembed.cc/embed/movie/', 'multiembed.mov/?video_id=', 'framextv.xyz/embed/']
        for exp in expected:
            nxt = page.locator('[data-testid="fallback-next-server"]'); await nxt.scroll_into_view_if_needed(); await nxt.click(); await page.wait_for_timeout(350)
            src = await frame.get_attribute('src'); assert exp in src
            assert await page.locator('[data-testid="click-shield"]').count() == 1
            print('PASS: cycled to '+exp)
        assert await page.locator('[data-testid="server-pill-pekka"]').count() == 1
        print('PASS: Alpha restores FrameXTV controls')
        await page.locator('[data-testid="player-close"]').click()
        # series route and first card
        await page.goto(page_url + '/series'); await page.wait_for_timeout(1800)
        cards = page.locator('[data-testid^="card-play-"]')
        assert await cards.count() > 0
        await cards.first.scroll_into_view_if_needed(); await cards.first.click(); await page.wait_for_selector('[data-testid="player-modal"]', timeout=8000)
        frame = page.locator('[data-testid="player-modal"] iframe').first
        src = await frame.get_attribute('src'); assert '/embed/' in src
        await page.locator('[data-testid="source-pill-vidsrc"]').click(); await page.wait_for_timeout(400)
        src = await frame.get_attribute('src')
        assert re.search(r'vidsrc\.cc/v2/embed/tv/[^/]+/\d+/\d+\?autoPlay=true', src), src
        print('PASS: TV Beta URL includes id/season/episode')
        ep2 = page.locator('[data-testid="episode-pill-2"]')
        if await ep2.count():
            await ep2.click(); await page.wait_for_timeout(300); src2 = await frame.get_attribute('src'); assert '/2?autoPlay=true' in src2; print('PASS: episode updates provider URL')
        else:
            print('INFO: episode 2 not available in loaded season')
        await page.locator('[data-testid="player-close"]').click()
        error_text = await page.evaluate("""() => Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]')).map(el => el.textContent).join(', ')""")
        if error_text: print('FINDING: '+error_text)
        else: print('PASS: no page error elements detected')
    except AssertionError as e:
        print('FINDING: assertion failed: '+str(e))
    except Exception as e:
        print('FINDING: test exception: '+str(e))
