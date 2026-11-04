async def run_test(page, output_dir, page_url):
    try:
     await page.set_viewport_size({"width":1920,"height":1080}); await page.goto("https://void-cinema-2--1jvdlnpg.preview.emergentagent.com/",wait_until="domcontentloaded",timeout=30000); await page.wait_for_timeout(2500); await page.evaluate("localStorage.clear()"); await page.reload(wait_until="domcontentloaded"); await page.wait_for_timeout(2500)
     b=page.locator('[data-testid="hero-bookmark"]'); print('hero bookmark count',await b.count()); await b.click(); await page.wait_for_timeout(300); print('stored',await page.evaluate("localStorage.getItem('voidstream:bookmarks')")); await page.click('[data-testid="nav-link-my-library"]'); await page.wait_for_timeout(500); print('library cards',await page.locator('[data-testid^="library-bookmark-"]').count(),await page.locator('[data-testid^="card-bookmark-"]').count())
    except Exception as e: print('TEST ERROR',repr(e)); raise
