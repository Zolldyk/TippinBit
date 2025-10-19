/**
 * E2E Tests for Username Claiming Flow
 *
 * Tests the complete username claiming flow including:
 * - Navigation to /create route
 * - Tab selection (address vs username)
 * - Username input and availability checking
 * - Validation feedback
 * - Username suggestions
 * - Mobile responsiveness
 *
 * Note: Full wallet signature flow requires manual testing or
 * advanced mocking beyond Playwright's standard capabilities.
 *
 * Run with: npx playwright test username-claim
 */

import { test, expect } from '@playwright/test';

test.describe('Username Claim Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to create page
    await page.goto('/create');
  });

  test('should display /create route with correct title', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Create Your Payment Link/);

    // Verify heading
    await expect(page.getByRole('heading', { name: 'Create Payment Link' })).toBeVisible();
  });

  test('should have tab selector with two options', async ({ page }) => {
    // Verify both tabs exist
    const addressTab = page.getByRole('tab', { name: 'Use wallet address' });
    const usernameTab = page.getByRole('tab', { name: 'Claim @username' });

    await expect(addressTab).toBeVisible();
    await expect(usernameTab).toBeVisible();
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Username tab should be selected by default
    const usernameTab = page.getByRole('tab', { name: 'Claim @username' });
    await expect(usernameTab).toHaveAttribute('aria-selected', 'true');

    // Click address tab
    const addressTab = page.getByRole('tab', { name: 'Use wallet address' });
    await addressTab.click();

    // Address tab should now be selected
    await expect(addressTab).toHaveAttribute('aria-selected', 'true');
    await expect(usernameTab).toHaveAttribute('aria-selected', 'false');

    // Should show address tab content
    await expect(page.getByText('Address-based payment links coming soon!')).toBeVisible();

    // Click username tab again
    await usernameTab.click();

    // Username tab should be selected
    await expect(usernameTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display username input with placeholder', async ({ page }) => {
    // Verify input exists
    const input = page.getByPlaceholderText('@yourname');
    await expect(input).toBeVisible();

    // Verify label
    await expect(page.getByText('Choose your username')).toBeVisible();
  });

  test('should automatically prepend @ when typing username', async ({ page }) => {
    const input = page.getByPlaceholderText('@yourname');

    // Type without @
    await input.fill('alice');

    // Should have @ prepended
    await expect(input).toHaveValue('@alice');
  });

  test('should show validation error for short username', async ({ page }) => {
    const input = page.getByPlaceholderText('@yourname');

    // Type short username
    await input.fill('ab');

    // Should show validation error
    await expect(page.getByText(/username must be at least 3 characters/i)).toBeVisible();
  });

  test('should show validation error for long username', async ({ page }) => {
    const input = page.getByPlaceholderText('@yourname');

    // Type long username (>20 characters)
    await input.fill('thisusernameiswaytoolongforsure');

    // Should show validation error
    await expect(page.getByText(/username must be at most 20 characters/i)).toBeVisible();
  });

  test('should show validation error for invalid characters', async ({ page }) => {
    const input = page.getByPlaceholderText('@yourname');

    // Type username with invalid characters
    await input.fill('alice@bob!');

    // Should show validation error
    await expect(page.getByText(/username can only contain/i)).toBeVisible();
  });

  test('should have claim button disabled by default', async ({ page }) => {
    const button = page.getByRole('button', { name: /claim username/i });

    // Button should be disabled initially
    await expect(button).toBeDisabled();
  });

  test('should display helper text about payment link', async ({ page }) => {
    // Verify helper text
    await expect(page.getByText(/your username will be linked to your wallet/i)).toBeVisible();
    await expect(page.getByText(/tippinbit.com\/pay\/@yourname/i)).toBeVisible();
  });

  test('should update button text with username when entered', async ({ page }) => {
    // Note: This test assumes username is available
    // In real scenario, would need to mock API response

    const input = page.getByPlaceholderText('@yourname');
    await input.fill('alice');

    // Wait a bit for button text to update
    await page.waitForTimeout(600); // Debounce delay

    // Button text should include username
    await expect(page.getByText(/claim @alice/i)).toBeVisible();
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('should have full-width layout on mobile', async ({ page }) => {
      await page.goto('/create');

      const input = page.getByPlaceholderText('@yourname');

      // Input should be visible and take full width
      await expect(input).toBeVisible();

      // Check container has proper mobile padding
      const container = page.locator('.container');
      await expect(container).toBeVisible();
    });

    test('should have minimum 44px touch target on claim button', async ({ page }) => {
      await page.goto('/create');

      const button = page.getByRole('button', { name: /claim/i });

      // Get button height
      const boundingBox = await button.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('should have proper spacing on mobile', async ({ page }) => {
      await page.goto('/create');

      // All key elements should be visible and not overlapping
      await expect(page.getByText('Choose your username')).toBeVisible();
      await expect(page.getByPlaceholderText('@yourname')).toBeVisible();
      await expect(page.getByRole('button', { name: /claim/i })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Tab list
      const tablist = page.getByRole('tablist');
      await expect(tablist).toHaveAttribute('aria-label', 'Link generator options');

      // Tabs
      const addressTab = page.getByRole('tab', { name: 'Use wallet address' });
      await expect(addressTab).toHaveAttribute('aria-controls', 'address-panel');

      const usernameTab = page.getByRole('tab', { name: 'Claim @username' });
      await expect(usernameTab).toHaveAttribute('aria-controls', 'username-panel');
    });

    test('should have live region for availability status', async ({ page }) => {
      const input = page.getByPlaceholderText('@yourname');
      await input.fill('alice');

      // Status region should exist with aria-live
      const status = page.getByRole('status');
      await expect(status).toBeVisible();
      await expect(status).toHaveAttribute('aria-live', 'polite');
    });

    test('should have proper label association', async ({ page }) => {
      const input = page.getByPlaceholderText('@yourname');

      // Input should have associated label
      await expect(input).toHaveAttribute('id', 'username-input');

      const label = page.getByText('Choose your username');
      await expect(label).toHaveAttribute('for', 'username-input');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to navigate to tabs
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be focused on first tab
      const addressTab = page.getByRole('tab', { name: 'Use wallet address' });
      await expect(addressTab).toBeFocused();

      // Tab to second tab
      await page.keyboard.press('Tab');
      const usernameTab = page.getByRole('tab', { name: 'Claim @username' });
      await expect(usernameTab).toBeFocused();

      // Enter to activate
      await page.keyboard.press('Enter');
      await expect(usernameTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Navigation', () => {
    test('should be accessible from header navigation', async ({ page }) => {
      // Go to home page
      await page.goto('/');

      // Click "Create Link" in navigation
      const createLink = page.getByRole('link', { name: 'Create Link' });
      await expect(createLink).toBeVisible();
      await createLink.click();

      // Should navigate to /create
      await expect(page).toHaveURL('/create');
    });

    test('should have "Create Link" in header navigation', async ({ page }) => {
      const createLink = page.getByRole('link', { name: 'Create Link' });
      await expect(createLink).toBeVisible();
      await expect(createLink).toHaveAttribute('href', '/create');
    });
  });
});

test.describe('Username Claim - API Integration', () => {
  test.skip('should show checking state while validating username', async ({ page }) => {
    // This test would require API mocking
    // Skipped for now - implement with Playwright API mocking when ready
  });

  test.skip('should show available indicator for unclaimed username', async ({ page }) => {
    // This test would require API mocking
    // Skipped for now
  });

  test.skip('should show taken indicator and suggestions for claimed username', async ({ page }) => {
    // This test would require API mocking
    // Skipped for now
  });

  test.skip('should complete full claim flow with wallet signature', async ({ page }) => {
    // This test would require wallet mocking
    // Skipped for now - requires MetaMask test dapp or similar
  });
});
