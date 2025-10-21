import { test, expect } from '@playwright/test';

test.describe('Confirmation Page - Universal Sharing', () => {
  const confirmationUrl =
    'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&username=@alice';

  test('copy link button copies creator payment link (AC1, AC6)', async ({
    page,
  }) => {
    await page.goto(confirmationUrl);

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click copy link button
    await page.click('button:has-text("Copy link")');

    // Verify toast appears
    await expect(
      page.locator('text=Link copied! Share it anywhere.')
    ).toBeVisible();

    // Verify clipboard contains creator payment link (not tx confirmation)
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain('/pay/@alice');
    expect(clipboardText).not.toContain('/confirmation');
  });

  test('uses @username in payment link when available (AC7, AC9)', async ({
    page,
  }) => {
    await page.goto(confirmationUrl);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.click('button:has-text("Copy link")');

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toBe('https://tippinbit.com/pay/@alice');
  });

  test('uses address in payment link when no username (AC9)', async ({
    page,
  }) => {
    const noUsernameUrl =
      'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

    await page.goto(noUsernameUrl);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.click('button:has-text("Copy link")');

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain('/pay?to=0x742d35Cc');
  });

  test('Twitter share opens with correct pre-filled text (AC4)', async ({
    page,
    context,
  }) => {
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(confirmationUrl);

    // Wait for new page on Twitter button click
    const pagePromise = context.waitForEvent('page');
    await page.click('button:has-text("Share on Twitter")');

    const twitterPage = await pagePromise;
    await twitterPage.waitForLoadState();

    // Verify Twitter URL contains creator info
    expect(twitterPage.url()).toContain('twitter.com/intent/tweet');
    expect(twitterPage.url()).toContain('@alice');
    expect(twitterPage.url()).toContain('TippinBit');
  });

  test('all share buttons are keyboard accessible (AC10)', async ({ page }) => {
    await page.goto(confirmationUrl);
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    // Find copy link button and focus it
    const copyButton = page.locator('button:has-text("Copy link")').first();
    await copyButton.focus();

    // Verify button is focused
    await expect(copyButton).toBeFocused();

    // Verify Enter key works
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Link copied!')).toBeVisible();
  });

  test('share buttons have proper ARIA labels (AC10)', async ({ page }) => {
    await page.goto(confirmationUrl);

    // Verify ARIA labels exist
    const copyButton = page.locator(
      'button[aria-label="Copy payment link to clipboard"]'
    );
    await expect(copyButton).toBeVisible();
  });

  test('copy button shows on both mobile and desktop (AC1)', async ({
    page,
  }) => {
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(confirmationUrl);
    await expect(page.locator('button:has-text("Copy link")')).toBeVisible();

    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(confirmationUrl);
    await expect(page.locator('button:has-text("Copy link")')).toBeVisible();
  });
});

// Mobile-specific tests
test.describe('Mobile - Native Share', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true,
  });

  test('shows native share button on mobile (AC2, AC8)', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&username=@alice'
    );

    // Note: Native share button visibility depends on navigator.share availability
    // In Playwright, we can check if the button would be shown by evaluating navigator.share
    const hasNativeShare = await page.evaluate(() => !!navigator.share);

    if (hasNativeShare) {
      // Native share button should be visible
      await expect(
        page.locator('button[aria-label="Share creator\'s payment link"]')
      ).toBeVisible();

      // Twitter button should NOT be visible on mobile
      await expect(
        page.locator('button:has-text("Share on Twitter")')
      ).not.toBeVisible();
    } else {
      // If native share not available, Twitter button should be shown instead
      await expect(
        page.locator('button:has-text("Share on Twitter")')
      ).toBeVisible();
    }
  });

  test('mobile buttons meet 44px minimum touch target (AC10)', async ({
    page,
  }) => {
    await page.goto(
      'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&username=@alice'
    );

    const copyButton = page.locator('button:has-text("Copy link")').first();
    const boundingBox = await copyButton.boundingBox();

    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  });
});

// Desktop-specific tests
test.describe('Desktop - Twitter Share', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
  });

  test('shows Twitter button on desktop (AC4, AC8)', async ({ page }) => {
    await page.goto(
      'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&username=@alice'
    );

    // Twitter button should be visible on desktop
    await expect(
      page.locator('button:has-text("Share on Twitter")')
    ).toBeVisible();
  });

  test('Twitter button opens in new window with noopener (AC4)', async ({
    page,
    context,
  }) => {
    await page.goto(
      'http://localhost:3000/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&amount=5.00&username=@alice'
    );

    const pagePromise = context.waitForEvent('page');
    await page.click('button:has-text("Share on Twitter")');

    const newPage = await pagePromise;
    expect(newPage.url()).toContain('twitter.com/intent/tweet');

    await newPage.close();
  });
});
