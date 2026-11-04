async def run_test(page, output_dir, page_url):
    import re
    page.set_viewport_size({"width": 1920, "height": 1080})
    try:
        await page.wait_for_load_state("networkidle", timeout=30000)
        await page.wait_for_timeout(2500)
        card = page.locator('[data-testid="media-card"]').first
        await card.scroll_into_view_if_needed()
        await card.click()
        await page.wait_for_selector('[data-testid="player-modal"]', timeout=8000)
        await page.wait_for_timeout(3000)
        title = await page.locator('[data-testid="player-title"]').inner_text()
        synopsis = await page.locator('[data-testid="player-synopsis"]').inner_text()
        iframe = page.locator('[data-testid="player-frame"] iframe')
        initial_src = await iframe.get_attribute('src')
        print(f"PLAYER title={title!r} synopsis_len={len(synopsis)}")
        if not title or not synopsis: print("FINDING: player metadata did not load")
        await page.locator('[data-testid="server-pill-archer"]').click()
        await page.wait_for_timeout(500)
        updated_src = await iframe.get_attribute('src')
        print(f"SERVER src_changed={initial_src != updated_src} archer={'server=archer' in updated_src}")
        if 'server=archer' not in updated_src: print("FINDING: server pill did not update iframe")
        tv_controls = await page.locator('[data-testid="tv-controls"]').count()
        cast = await page.locator('[data-testid="player-cast"]').count()
        print(f"PLAYER tv_controls={tv_controls} cast_section={cast}")
        await page.locator('[data-testid="player-close"]').click()
        print("PASS: player modal open/details/server flow")
    except Exception as e:
        print(f"FINDING: player flow failed: {e}")
        raise
