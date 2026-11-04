async def run_test(page, output_dir, page_url):
    try:
        await page.set_viewport_size({"width":390,"height":844})
        await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/", wait_until="domcontentloaded")
        await page.wait_for_selector('[data-testid="hero-billboard"]', timeout=15000)
        await page.wait_for_timeout(2500)
        overflow = await page.evaluate("() => ({overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth})")
        print("mobile dimensions", overflow)
        assert not overflow["overflow"]
        print("PASS mobile home no horizontal overflow")
    except AssertionError as e:
        print(f"FINDING: {e}")
    except Exception as e:
        print(f"SCRIPT ERROR: {e}"); raise
