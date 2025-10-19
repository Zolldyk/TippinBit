import { test, expect } from '@playwright/test';

/**
 * E2E tests for payment flow with BTC borrowing button
 *
 * Tests:
 * - BTC button visibility based on balance
 * - Responsive layout (mobile/desktop)
 * - Tooltip interactions
 * - Button states (enabled/disabled)
 */

test.describe('BTC Borrowing Button Visibility', () => {
  test('shows Tip with BTC button when wallet has BTC balance', async ({ page }) => {
    // Note: This test requires wallet connection setup with test wallet that has BTC balance
    // Implementation depends on E2E test infrastructure for wallet connection
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC balance (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Verify button appears
    await expect(page.locator('text=Tip with BTC')).toBeVisible();

    // Verify tooltip on hover
    await page.hover('text=Tip with BTC');
    await expect(page.locator('text=Borrow MUSD using your BTC as collateral')).toBeVisible();
  });

  test('hides button when wallet has zero BTC balance', async ({ page }) => {
    // Note: This test requires wallet connection setup with test wallet that has zero BTC
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with zero BTC balance (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0' });

    // Verify button does not appear
    await expect(page.locator('text=Tip with BTC')).not.toBeVisible();
  });

  test('buttons stack vertically on mobile viewport', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Get button positions
    const sendButton = page.locator('button:has-text("Send")').first();
    const btcButton = page.locator('text=Tip with BTC');

    const sendBox = await sendButton.boundingBox();
    const btcBox = await btcButton.boundingBox();

    // Verify vertical stacking (BTC button below Send button)
    expect(btcBox!.y).toBeGreaterThan(sendBox!.y + sendBox!.height);
  });

  test('buttons display side-by-side on desktop viewport', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Get button positions
    const sendButton = page.locator('button:has-text("Send")').first();
    const btcButton = page.locator('text=Tip with BTC');

    const sendBox = await sendButton.boundingBox();
    const btcBox = await btcButton.boundingBox();

    // Verify horizontal layout (buttons at similar Y position)
    expect(Math.abs(btcBox!.y - sendBox!.y)).toBeLessThan(10);
    expect(btcBox!.x).toBeGreaterThan(sendBox!.x);
  });

  test('button is disabled when BTC balance < minimum required', async ({ page }) => {
    // Note: This test requires wallet connection setup with insufficient BTC
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with insufficient BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.00001' });

    // Verify button is disabled
    const btcButton = page.locator('text=Tip with BTC');
    await expect(btcButton).toBeDisabled();

    // Verify disabled tooltip
    await page.hover('text=Tip with BTC');
    await expect(page.locator('text=/Minimum.*BTC required for borrowing/i')).toBeVisible();
  });
});

test.describe('BTC Borrowing Explainer Panel', () => {
  test('clicking Tip with BTC opens explainer modal on desktop', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC balance (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Click "Tip with BTC" button
    await page.click('text=Tip with BTC');

    // Verify explainer opens with correct content
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();
    await expect(page.locator('text=Lock your BTC as collateral')).toBeVisible();
  });

  test('clicking Tip with BTC opens bottom sheet on mobile', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC balance (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Click "Tip with BTC" button
    await page.click('text=Tip with BTC');

    // Verify bottom sheet opens
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Check for drag handle (mobile-specific)
    await expect(page.locator('.bg-\\[var\\(--color-neutral-300\\)\\].rounded-full')).toBeVisible();
  });

  test('Cancel button closes explainer and returns to payment form', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Click Cancel
    await page.click('button:has-text("Cancel")');

    // Verify explainer is closed
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();

    // Verify still on payment page
    await expect(page.locator('text=Tip with BTC')).toBeVisible();
  });

  test('X button closes explainer', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Click X button
    await page.click('button[aria-label="Close"]');

    // Verify explainer is closed
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();
  });

  test('ESC key closes explainer', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Press ESC key
    await page.keyboard.press('Escape');

    // Verify explainer is closed
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();
  });

  test('backdrop click closes explainer', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Click backdrop (outside dialog content)
    await page.click('.bg-black\\/50', { position: { x: 10, y: 10 } });

    // Verify explainer is closed
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();
  });

  test('Continue button closes explainer and triggers next step', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    const consoleMessages: string[] = [];
    page.on('console', (msg) => consoleMessages.push(msg.text()));

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Click Continue
    await page.click('button:has-text("Continue")');

    // Verify explainer is closed
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();

    // Verify placeholder log was triggered
    await page.waitForTimeout(500);
    expect(consoleMessages.some((msg) => msg.includes('Continue to borrowing flow'))).toBe(true);
  });

  test('displays visual diagram with all icons', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');

    // Verify all diagram labels are visible
    await expect(page.locator('text=BTC')).toBeVisible();
    await expect(page.locator('text=Collateral')).toBeVisible();
    await expect(page.locator('text=MUSD')).toBeVisible();
    await expect(page.locator('text=Creator')).toBeVisible();
  });

  test('displays dynamically calculated collateral amount', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');

    // Verify collateral calculation is displayed
    await expect(page.locator('text=/Requires.*BTC/i')).toBeVisible();
    await expect(page.locator('text=/~\\$.*at current rate/i')).toBeVisible();
    await expect(page.locator('text=/Safe 200% collateral ratio/i')).toBeVisible();
  });

  test('displays borrowing rate information', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');

    // Verify borrowing rate text
    await expect(page.locator('text=/1% borrowing rate via Mezo/i')).toBeVisible();
  });

  test('animations appear smooth', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Open explainer
    await page.click('text=Tip with BTC');

    // Check that backdrop is visible
    await expect(page.locator('.bg-black\\/50')).toBeVisible();

    // Check that dialog is visible
    await expect(page.locator('text=Support without selling your Bitcoin')).toBeVisible();

    // Verify opacity is near 1 (animated in)
    const dialog = page.locator('text=Support without selling your Bitcoin').locator('..');
    const opacity = await dialog.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });
});

/**
 * E2E tests for real-time BTC collateral calculation (Story 2.3)
 *
 * Tests:
 * - Real-time collateral updates when tip amount changes
 * - Insufficient balance warnings
 * - "Send your max" button functionality
 * - Price staleness indicators and refresh
 * - BTC price API integration with caching
 */
test.describe('BTC Collateral Calculation and Display', () => {
  test('shows loading state while fetching BTC price', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock slow BTC price API response
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await page.waitForTimeout(2000); // Simulate 2s delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now(),
          source: 'CoinGecko',
          cached: false,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');

    // Verify loading state
    await expect(page.locator('text=Fetching BTC price...')).toBeVisible();
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();
  });

  test('displays collateral calculation for $10 tip at $50k BTC', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API with $50,000
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now(),
          source: 'CoinGecko',
          cached: false,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount of $10
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');

    // Wait for price fetch
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify collateral calculation
    // $10 tip * 2.1525 effective ratio / $50,000 ≈ 0.0004305 BTC
    await expect(page.locator('text=/Requires 0\\.000\\d+ BTC/i')).toBeVisible();
    await expect(page.locator('text=/~\\$21\\.\\d+ at current rate/i')).toBeVisible();
    await expect(page.locator('text=/Safe 215% collateral ratio/i')).toBeVisible();
  });

  test('updates collateral in real-time when tip amount changes', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now(),
          source: 'CoinGecko',
          cached: false,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter initial tip amount of $5
    await page.fill('input[type="text"]', '5');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Capture initial collateral text
    const initialCollateral = await page
      .locator('text=/Requires 0\\.\\d+ BTC/i')
      .textContent();

    // NOTE: In the current implementation, the explainer panel closes when amount changes
    // This test validates the current behavior. Future stories may implement
    // real-time updates within the open panel.

    // Close explainer
    await page.click('button:has-text("Cancel")');

    // Change tip amount to $20 (4x larger)
    await page.fill('input[type="text"]', '20');

    // Reopen explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Capture new collateral text
    const newCollateral = await page.locator('text=/Requires 0\\.\\d+ BTC/i').textContent();

    // Verify collateral increased (different text content)
    expect(newCollateral).not.toBe(initialCollateral);
  });

  test('shows insufficient balance warning when BTC < required collateral', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now(),
          source: 'CoinGecko',
          cached: false,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with insufficient BTC (0.0001 BTC, ~$5 worth)
    // await connectTestWallet(page, { btcBalance: '0.0001' });

    // Enter large tip amount ($100)
    await page.fill('input[type="text"]', '100');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify insufficient balance warning appears
    await expect(page.locator('text=/You have 0\\.\\d+ BTC/i')).toBeVisible();
    await expect(page.locator('text=/Need 0\\.\\d+ BTC/i')).toBeVisible();
    await expect(page.locator('text=/Reduce tip amount or use MUSD instead/i')).toBeVisible();

    // Verify Continue button is disabled
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeDisabled();
  });

  test('"Send your max" button calculates maximum tip from BTC balance', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now(),
          source: 'CoinGecko',
          cached: false,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with 0.001 BTC (~$50 worth)
    // await connectTestWallet(page, { btcBalance: '0.001' });

    // Enter large tip that exceeds balance ($100)
    await page.fill('input[type="text"]', '100');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify "Send your max" button appears
    await expect(page.locator('button:has-text("Send your max")')).toBeVisible();

    // Click "Send your max" button
    await page.click('button:has-text("Send your max")');

    // Verify explainer closes
    await expect(page.locator('text=Support without selling your Bitcoin')).not.toBeVisible();

    // Verify tip amount was updated to max affordable amount
    // 0.001 BTC * $50,000 / 2.1525 ≈ $23.24
    const inputValue = await page.inputValue('input[type="text"]');
    const numericValue = parseFloat(inputValue);
    expect(numericValue).toBeGreaterThan(20);
    expect(numericValue).toBeLessThan(25);
  });

  test('shows price staleness warning for 15-minute-old price', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API with stale timestamp (15 minutes ago)
    const staleTimestamp = Date.now() - 15 * 60 * 1000;
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: staleTimestamp,
          source: 'Cache',
          cached: true,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify staleness warning appears
    await expect(page.locator('text=/BTC price may be outdated/i')).toBeVisible();
    await expect(page.locator('text=/last updated.*ago/i')).toBeVisible();

    // Verify refresh button is visible
    await expect(page.locator('button[aria-label="Refresh price"]')).toBeVisible();
  });

  test('refresh button fetches fresh BTC price', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    let fetchCount = 0;
    const staleTimestamp = Date.now() - 15 * 60 * 1000;

    // Mock BTC price API - first call returns stale, second returns fresh
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      fetchCount++;
      if (fetchCount === 1) {
        // First call: stale price
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            price: 50000,
            timestamp: staleTimestamp,
            source: 'Cache',
            cached: true,
          }),
        });
      } else {
        // Second call: fresh price
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            price: 51000,
            timestamp: Date.now(),
            source: 'CoinGecko',
            cached: false,
          }),
        });
      }
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify staleness warning appears
    await expect(page.locator('text=/BTC price may be outdated/i')).toBeVisible();

    // Click refresh button
    await page.click('button[aria-label="Refresh price"]');

    // Wait for refresh to complete
    await page.waitForTimeout(1000);

    // Verify staleness warning disappears
    await expect(page.locator('text=/BTC price may be outdated/i')).not.toBeVisible();

    // Verify fetchCount increased
    expect(fetchCount).toBe(2);
  });

  test('shows error state when BTC price API fails', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API to fail
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unable to fetch BTC price',
          code: 'PRICE_FEED_UNAVAILABLE',
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');

    // Verify error state appears
    await expect(page.locator('text=/Unable to fetch BTC price/i')).toBeVisible();
    await expect(page.locator('text=/Try again or use MUSD flow/i')).toBeVisible();

    // Verify Retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Verify fallback button
    await expect(page.locator('button:has-text("Use MUSD instead")')).toBeVisible();
  });

  test('"Use MUSD instead" button closes explainer on error', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API to fail
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unable to fetch BTC price',
          code: 'PRICE_FEED_UNAVAILABLE',
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');

    // Wait for error state
    await expect(page.locator('text=/Unable to fetch BTC price/i')).toBeVisible();

    // Click "Use MUSD instead"
    await page.click('button:has-text("Use MUSD instead")');

    // Verify explainer closes
    await expect(page.locator('text=/Unable to fetch BTC price/i')).not.toBeVisible();

    // Verify returned to payment form
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });

  test('displays cached price indicator from server', async ({ page }) => {
    // Note: This test requires wallet connection setup
    test.skip(true, 'Requires wallet connection test infrastructure');

    // Mock BTC price API with cached response
    await page.route('**/.netlify/functions/btc-price/btc-price', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          price: 50000,
          timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago (within fresh threshold)
          source: 'Cache',
          cached: true,
        }),
      });
    });

    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect wallet with BTC (test infrastructure needed)
    // await connectTestWallet(page, { btcBalance: '0.005' });

    // Enter tip amount
    await page.fill('input[type="text"]', '10');

    // Open explainer
    await page.click('text=Tip with BTC');
    await expect(page.locator('text=Fetching BTC price...')).not.toBeVisible({ timeout: 5000 });

    // Verify collateral calculation works with cached price
    await expect(page.locator('text=/Requires 0\\.\\d+ BTC/i')).toBeVisible();

    // Verify no staleness warning (price is fresh even though cached)
    await expect(page.locator('text=/BTC price may be outdated/i')).not.toBeVisible();
  });
});
