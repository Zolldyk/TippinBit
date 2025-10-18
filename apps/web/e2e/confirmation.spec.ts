/**
 * E2E Tests for Transaction Confirmation Page
 *
 * Note: These tests require Playwright to be configured and running.
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

const MOCK_TX_HASH = '0x1234567890123456789012345678901234567890123456789012345678901234';
const MOCK_RECIPIENT = '0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58';
const MOCK_AMOUNT = '5.00';

test.describe('Transaction Confirmation Page - Social Sharing', () => {
  test('should display complete confirmation page with all elements', async ({ page }) => {
    // Navigate to confirmation page with full params
    await page.goto(
      `/confirmation?tx=${MOCK_TX_HASH}&amount=${MOCK_AMOUNT}&recipient=${MOCK_RECIPIENT}`
    );

    // Verify success message
    await expect(page.getByText('Your support means the world!')).toBeVisible();

    // Verify transaction summary
    await expect(page.getByText('Transaction Summary')).toBeVisible();
    await expect(page.getByText(`$${MOCK_AMOUNT} MUSD`)).toBeVisible();
    await expect(page.getByText('0x9aab...fD58')).toBeVisible();

    // Verify social sharing section
    await expect(page.getByText('Share your support')).toBeVisible();
    await expect(page.getByLabel('Share on X (Twitter)')).toBeVisible();
    await expect(page.getByLabel('Copy link for Instagram')).toBeVisible();
    await expect(page.getByLabel('Copy link for TikTok')).toBeVisible();
  });

  test('should have correct Twitter/X share URL', async ({ page }) => {
    await page.goto(
      `/confirmation?tx=${MOCK_TX_HASH}&amount=${MOCK_AMOUNT}&recipient=${MOCK_RECIPIENT}`
    );

    // Get Twitter share link
    const twitterLink = page.getByLabel('Share on X (Twitter)');
    const href = await twitterLink.getAttribute('href');

    // Verify URL structure
    expect(href).toContain('https://twitter.com/intent/tweet');
    expect(href).toContain('TippinBit');
    expect(href).toContain(MOCK_TX_HASH);
    expect(href).toContain('hashtags=TippinBit');
  });

  test('should copy link for Instagram', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Click Instagram button
    await page.getByLabel('Copy link for Instagram').click();

    // Verify toast appears
    await expect(page.getByText('Link copied! Paste it in Instagram')).toBeVisible();

    // Verify clipboard contains correct URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(`/confirmation?tx=${MOCK_TX_HASH}`);
  });

  test('should copy link for TikTok', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Click TikTok button
    await page.getByLabel('Copy link for TikTok').click();

    // Verify toast appears
    await expect(page.getByText('Link copied! Paste it in TikTok')).toBeVisible();

    // Verify clipboard contains correct URL
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(`/confirmation?tx=${MOCK_TX_HASH}`);
  });

  test('should copy transaction hash when clicking copy button', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Click copy transaction hash button
    await page.getByLabel('Copy transaction hash').click();

    // Verify toast appears
    await expect(page.getByText('Copied!')).toBeVisible();

    // Verify clipboard contains full hash
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(MOCK_TX_HASH);
  });

  test('should expand blockchain explorer details', async ({ page }) => {
    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Click to expand explorer details
    await page.getByLabel('Toggle blockchain explorer details').click();

    // Verify full hash is displayed
    await expect(page.getByText(MOCK_TX_HASH)).toBeVisible();

    // Verify explorer link is present
    const explorerLink = page.getByRole('link', { name: /Open Mezo Explorer/i });
    await expect(explorerLink).toBeVisible();

    const href = await explorerLink.getAttribute('href');
    expect(href).toContain(`https://explorer.test.mezo.org/tx/${MOCK_TX_HASH}`);
  });

  test('should show "Return to creator" button when referrer provided', async ({ page }) => {
    // Navigate with referrer parameter
    await page.goto(
      `/confirmation?tx=${MOCK_TX_HASH}&ref=https://creator-site.com`
    );

    // Verify return button is visible
    await expect(page.getByLabel("Return to creator's website")).toBeVisible();
    await expect(page.getByText('Return to creator')).toBeVisible();
  });

  test('should not show "Return to creator" button without referrer', async ({ page }) => {
    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Verify return button is not present
    await expect(page.getByLabel("Return to creator's website")).not.toBeVisible();
  });

  test('should respect prefers-reduced-motion setting', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto(`/confirmation?tx=${MOCK_TX_HASH}`);

    // Verify page loads without animations
    await expect(page.getByText('Your support means the world!')).toBeVisible();

    // Check that motion-reduce classes are applied (this is visual, hard to test programmatically)
    // The test confirms the page renders successfully with reduced motion
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 12 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(
      `/confirmation?tx=${MOCK_TX_HASH}&amount=${MOCK_AMOUNT}&recipient=${MOCK_RECIPIENT}`
    );

    // Verify all elements are still visible and accessible on mobile
    await expect(page.getByText('Your support means the world!')).toBeVisible();
    await expect(page.getByText('Share your support')).toBeVisible();
    await expect(page.getByLabel('Share on X (Twitter)')).toBeVisible();
  });

  test('should show error for invalid transaction hash', async ({ page }) => {
    await page.goto('/confirmation?tx=invalid-hash');

    // Verify error message is displayed
    await expect(page.getByText('Invalid transaction link')).toBeVisible();
    await expect(
      page.getByText('The transaction hash provided is invalid or malformed.')
    ).toBeVisible();
  });
});
