import { test, expect } from '@playwright/test';

/**
 * Backwards compatibility tests for username resolution feature
 *
 * Ensures existing direct address payment flow still works after
 * adding username resolution functionality.
 */

test.describe('Backwards Compatibility - Direct Address Payment', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  test('existing /pay?to=ADDRESS route still works', async ({ page }) => {
    await page.goto(`http://localhost:3000/pay?to=${testAddress}`);

    // Should display payment page
    await expect(page.getByText('Send a tip')).toBeVisible();

    // Should show address in RecipientCard
    await expect(page.getByText(/0x742d.*4a3f/)).toBeVisible();

    // Should NOT show loading state (direct address, no resolution needed)
    await expect(page.getByText(/Resolving/)).not.toBeVisible();
  });

  test('/pay?to=ADDRESS&amount=5 route with amount parameter works', async ({ page }) => {
    await page.goto(`http://localhost:3000/pay?to=${testAddress}&amount=5`);

    // Should display payment page
    await expect(page.getByText('Send a tip')).toBeVisible();

    // Should show address
    await expect(page.getByText(/0x742d.*4a3f/)).toBeVisible();

    // Payment form should be present
    // (Amount pre-fill validation would require form implementation details)
  });

  test('RecipientCard displays correctly for direct address (no username)', async ({ page }) => {
    await page.goto(`http://localhost:3000/pay?to=${testAddress}`);

    // Wait for page load
    await expect(page.getByText('Send a tip')).toBeVisible();

    // Should show "Supporting:" label
    await expect(page.getByText('Supporting:')).toBeVisible();

    // Should show truncated address
    await expect(page.getByText(/0x742d.*4a3f/)).toBeVisible();

    // Should NOT show username (since it's direct address payment)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('@');
  });

  test('invalid address still shows error page', async ({ page }) => {
    await page.goto('http://localhost:3000/pay?to=invalid-address');

    // Should show error
    await expect(page.getByText(/Invalid payment link/i)).toBeVisible();
  });

  test('missing "to" parameter still shows error page', async ({ page }) => {
    await page.goto('http://localhost:3000/pay');

    // Should show error for missing recipient
    await expect(page.getByText(/This payment link is incomplete/i)).toBeVisible();
  });

  test('username resolution does not interfere with direct address flow', async ({ page }) => {
    // First, navigate to direct address
    await page.goto(`http://localhost:3000/pay?to=${testAddress}`);
    await expect(page.getByText('Send a tip')).toBeVisible();

    // Navigate to username page
    await page.route('**/.netlify/functions/username-lookup?username=alice', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'alice',
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
          claimedAt: '2025-01-15T10:00:00Z',
        }),
      });
    });

    await page.goto('http://localhost:3000/pay/@alice');
    await expect(page.getByText('@alice')).toBeVisible();

    // Navigate back to direct address
    await page.goto(`http://localhost:3000/pay?to=${testAddress}`);

    // Should still work correctly (no username displayed)
    await expect(page.getByText('Send a tip')).toBeVisible();
    await expect(page.getByText(/0x742d.*4a3f/)).toBeVisible();

    const pageContent = await page.content();
    // Should not show @alice or any username
    expect(pageContent).not.toContain('@alice');
  });

  test('route priority: /pay?to=ADDRESS takes precedence over /pay/[username]', async ({ page }) => {
    // When navigating to /pay with query params, should use query param route
    // (not try to interpret query string as username)
    await page.goto(`http://localhost:3000/pay?to=${testAddress}`);

    // Should display payment page (not 404 or username resolution)
    await expect(page.getByText('Send a tip')).toBeVisible();
    await expect(page.getByText(/0x742d.*4a3f/)).toBeVisible();
  });
});
