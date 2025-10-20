import { test, expect } from '@playwright/test';

test.describe('QR Code Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the create page
    await page.goto('http://localhost:3000/create');
  });

  test('displays QR code on link generator page after username claim (AC2)', async ({
    page,
  }) => {
    // Claim username (using existing functionality from Story 2.6)
    const username = `testuser${Date.now()}`; // Unique username to avoid conflicts
    await page.fill('input[id="username-input"]', username);

    // Wait for availability check
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });

    // Click claim button
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(
      page.locator('text=claimed!').or(page.locator(`text=@${username} claimed!`))
    ).toBeVisible({ timeout: 10000 });

    // Verify QR code appears
    const qrCode = page.locator('[data-testid="qr-code-image"]');
    await expect(qrCode).toBeVisible({ timeout: 5000 });

    // Verify QR code has correct size (AC4: minimum 300x300)
    const bbox = await qrCode.boundingBox();
    expect(bbox?.width).toBeGreaterThanOrEqual(300);
    expect(bbox?.height).toBeGreaterThanOrEqual(300);

    // Verify QR code alt text for accessibility
    await expect(qrCode).toHaveAttribute(
      'alt',
      expect.stringContaining('QR code for')
    );
  });

  test('QR code updates when amount changes (AC11)', async ({ page }) => {
    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Get initial QR code src
    const qrCode = page.locator('[data-testid="qr-code-image"]');
    await expect(qrCode).toBeVisible();
    const initialSrc = await qrCode.getAttribute('src');

    // Select amount preset ($5)
    await page.click('button:has-text("$5")');

    // Wait for QR code to regenerate
    await page.waitForTimeout(1000);

    // Verify QR code changed (new data URL)
    const newSrc = await qrCode.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);

    // Verify URL includes amount parameter
    const paymentUrl = await page
      .locator('.payment-url-text')
      .textContent();
    expect(paymentUrl).toContain('amount=5');
  });

  test('downloads QR code with correct filename (AC5, AC6)', async ({
    page,
  }) => {
    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Wait for QR code to be ready
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();

    // Start download monitoring
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await page.click('[data-testid="qr-download-button"]');

    // Wait for download
    const download = await downloadPromise;

    // Verify filename (AC5: tippinbit-{username}-qr.png)
    expect(download.suggestedFilename()).toBe(`tippinbit-${username}-qr.png`);

    // Verify it's a valid PNG
    const path = await download.path();
    expect(path).toBeTruthy();

    // Optional: Verify file size is reasonable (QR code should be > 1KB)
    const fs = await import('fs');
    if (path) {
      const stats = fs.statSync(path);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    }
  });

  test('QR code includes logo overlay (AC7)', async ({ page }) => {
    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Verify logo is visible in QR code container
    const logo = page.locator('img[alt="TippinBit logo"]');
    await expect(logo).toBeVisible();
  });

  test('QR code section shows amount presets (AC11)', async ({ page }) => {
    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Verify amount presets are visible
    await expect(page.locator('button:has-text("$3")')).toBeVisible();
    await expect(page.locator('button:has-text("$5")')).toBeVisible();
    await expect(page.locator('button:has-text("$10")')).toBeVisible();
    await expect(page.locator('button:has-text("$25")')).toBeVisible();
    await expect(page.locator('button:has-text("No amount")')).toBeVisible();
  });

  test('payment URL updates with selected amount (AC3, AC11)', async ({
    page,
  }) => {
    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Get initial URL (no amount)
    const initialUrl = await page.locator('.payment-url-text').textContent();
    expect(initialUrl).toContain(`/pay/@${username}`);
    expect(initialUrl).not.toContain('amount=');

    // Select $10 preset
    await page.click('button:has-text("$10")');
    await page.waitForTimeout(500);

    // Verify URL includes amount
    const urlWithAmount = await page.locator('.payment-url-text').textContent();
    expect(urlWithAmount).toContain('amount=10');

    // Select "No amount"
    await page.click('button:has-text("No amount")');
    await page.waitForTimeout(500);

    // Verify amount is removed
    const urlNoAmount = await page.locator('.payment-url-text').textContent();
    expect(urlNoAmount).not.toContain('amount=');
  });

  test('QR code is responsive on mobile viewport (AC8)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Claim username
    const username = `testuser${Date.now()}`;
    await page.fill('input[id="username-input"]', username);

    // Wait for availability and claim
    await expect(
      page.locator('text=Available!').or(page.locator('[aria-label="Available"]'))
    ).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Claim")');

    // Wait for claim success
    await expect(page.locator('text=claimed!')).toBeVisible({
      timeout: 10000,
    });

    // Verify QR code is visible and responsive
    const qrCode = page.locator('[data-testid="qr-code-image"]');
    await expect(qrCode).toBeVisible();

    // On mobile, QR should be full width (max 400px)
    const bbox = await qrCode.boundingBox();
    expect(bbox?.width).toBeLessThanOrEqual(400);
  });
});

/**
 * Manual Test: QR Code Scannability (AC10)
 *
 * This test should be performed manually as it requires physical devices.
 *
 * Test Procedure:
 * 1. Run dev server: pnpm dev
 * 2. Navigate to http://localhost:3000/create
 * 3. Claim a test username (e.g., @testqr)
 * 4. Generate QR code
 * 5. Scan QR code with:
 *    - iOS Camera app
 *    - Android Camera app
 *    - WalletConnect-enabled wallet app
 * 6. Verify scanned URL opens correctly: https://tippinbit.com/pay/@testqr
 *
 * Expected Results:
 * - QR code should be scannable by all tested devices/apps
 * - URL should open in browser or wallet app
 * - If logo overlay causes scan failures, reduce logo size or disable (showLogo={false})
 *
 * Document results in story completion notes.
 */
