import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Creator Thank-You Message Feature
 *
 * Tests the complete user journey for:
 * - Adding a thank-you message when creating payment links
 * - Viewing the custom message on confirmation page
 * - Message sanitization and validation
 */

test.describe('Creator Thank-You Message Feature', () => {
  test.describe('Address-based Payment Link with Message', () => {
    test('creator can add message to address-based link', async ({ page }) => {
      // Navigate to link generator
      await page.goto('/');

      // Enter valid Ethereum address
      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      // Add thank-you message
      const messageInput = page.getByLabel(/thank-you message/i);
      await messageInput.fill('Thank you for the coffee! ☕');

      // Verify character counter updates
      await expect(page.getByText(/characters remaining/i)).toBeVisible();
      await expect(page.getByText(/172 characters remaining/i)).toBeVisible();

      // Verify live preview appears
      await expect(page.getByTestId('message-preview')).toBeVisible();
      await expect(page.getByTestId('message-preview')).toContainText('Thank you for the coffee! ☕');

      // Verify payment URL includes message parameter
      const paymentLink = page.getByLabel(/generated payment link/i);
      const linkValue = await paymentLink.inputValue();
      expect(linkValue).toContain('message=');
      expect(linkValue).toContain('Thank%20you');
    });

    test('enforces 200 character limit', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const messageInput = page.getByLabel(/thank-you message/i);

      // Type 201 characters
      const longMessage = 'a'.repeat(201);
      await messageInput.fill(longMessage);

      // Should show validation error
      await expect(page.getByText(/message too long/i)).toBeVisible();

      // Verify character counter shows negative
      await expect(page.getByText(/characters remaining/i)).toBeVisible();
    });

    test('message is optional - link works without it', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      // Don't fill message field
      const paymentLink = page.getByLabel(/generated payment link/i);
      const linkValue = await paymentLink.inputValue();

      // URL should NOT contain message parameter
      expect(linkValue).not.toContain('message=');
      expect(linkValue).toContain('/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    test('preview only shows when message is entered', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      // Preview should not be visible initially
      await expect(page.getByTestId('message-preview')).not.toBeVisible();

      // Add message
      const messageInput = page.getByLabel(/thank-you message/i);
      await messageInput.fill('Thanks!');

      // Preview should appear
      await expect(page.getByTestId('message-preview')).toBeVisible();
    });
  });

  test.describe('Username-based Payment Link with Message', () => {
    test('creator can add message during username claim', async ({ page }) => {
      // Note: This test requires a mocked username claim flow
      // In a real scenario, you'd need to mock the wallet signature

      await page.goto('/');

      // Navigate to username claim section (adjust selector as needed)
      const usernameInput = page.getByPlaceholder(/@yourname/i);
      await usernameInput.fill('@testcreator');

      // Add thank-you message
      const messageInput = page.getByLabel(/thank-you message.*optional/i);
      await messageInput.fill('Thank you for supporting my work! ❤️');

      // Verify character counter
      await expect(page.getByText(/characters remaining/i)).toBeVisible();

      // Verify preview
      await expect(page.getByTestId('message-preview')).toBeVisible();
      await expect(page.getByTestId('message-preview')).toContainText('@testcreator says:');
    });

    test('message persists with username claim', async ({ page }) => {
      // This test verifies that the message is stored with the username
      // Requires backend mock or test database

      await page.goto('/');

      // TODO: Complete this test when username claim flow is fully set up
      // It should verify that after claiming a username with a message,
      // the message is returned by the username-lookup API
    });
  });

  test.describe('Confirmation Page Message Display', () => {
    test('displays custom message from URL parameter', async ({ page }) => {
      // Navigate directly to confirmation page with message parameter
      await page.goto('/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&message=Thank%20you%20for%20the%20coffee!');

      // Wait for page to load
      await expect(page.getByText(/your support means the world/i)).toBeVisible();

      // Verify custom message is displayed
      await expect(page.getByText(/thank you for the coffee!/i)).toBeVisible();
    });

    test('displays generic message when no custom message provided', async ({ page }) => {
      await page.goto('/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      await expect(page.getByText(/your support means the world/i)).toBeVisible();

      // Should show generic fallback
      await expect(page.getByText(/thank you for your support! ❤️/i)).toBeVisible();
    });

    test('sanitizes message to prevent XSS', async ({ page }) => {
      // Try to inject a script tag via URL parameter
      const maliciousMessage = encodeURIComponent('<script>alert("XSS")</script>Hello');

      await page.goto(`/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&message=${maliciousMessage}`);

      // Should display sanitized text only
      await expect(page.getByText('Hello')).toBeVisible();

      // Should NOT contain script tags in DOM
      const pageContent = await page.content();
      expect(pageContent).not.toContain('<script>');
      expect(pageContent).not.toContain('alert("XSS")');
    });

    test('handles emoji in messages correctly', async ({ page }) => {
      const emojiMessage = encodeURIComponent('Thank you! ❤️🙏☕');

      await page.goto(`/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&message=${emojiMessage}`);

      // Emoji should be displayed
      await expect(page.getByText(/thank you! ❤️🙏☕/i)).toBeVisible();
    });

    test('truncates very long messages to 200 chars', async ({ page }) => {
      const longMessage = encodeURIComponent('a'.repeat(300));

      await page.goto(`/confirmation?tx=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef&recipient=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&message=${longMessage}`);

      // Get the displayed message
      const messagebox = page.locator('.border-teal-light');
      const text = await messagebox.textContent();

      // Should be truncated to 200 chars (+ "says: " prefix)
      expect(text?.length).toBeLessThanOrEqual(220); // Allow for prefix
    });
  });

  test.describe('Accessibility', () => {
    test('message textarea has proper labels and ARIA attributes', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const messageInput = page.getByLabel(/thank-you message/i);

      // Check ARIA attributes
      await expect(messageInput).toHaveAttribute('aria-describedby');
      await expect(messageInput).toHaveAttribute('aria-label');

      // Check label exists
      const label = page.getByText(/thank-you message.*optional/i);
      await expect(label).toBeVisible();
    });

    test('character counter is announced to screen readers', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const charCounter = page.getByText(/characters remaining/i);

      // Should have aria-live for screen reader announcements
      const ariaLive = await charCounter.getAttribute('aria-live');
      expect(ariaLive).toBe('polite');
    });

    test('validation errors are announced to screen readers', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const messageInput = page.getByLabel(/thank-you message/i);
      await messageInput.fill('a'.repeat(201));

      const error = page.getByText(/message too long/i);

      // Error should have role="alert" for screen readers
      const role = await error.getAttribute('role');
      expect(role).toBe('alert');

      // Should have aria-live
      const ariaLive = await error.getAttribute('aria-live');
      expect(ariaLive).toBe('assertive');
    });

    test('preview has descriptive helper text', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const messageInput = page.getByLabel(/thank-you message/i);
      await messageInput.fill('Thanks!');

      // Should show helper text explaining the preview
      await expect(page.getByText(/this is how supporters will see/i)).toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('message textarea is usable on mobile', async ({ page }) => {
      await page.goto('/');

      const addressInput = page.getByLabel(/wallet address/i);
      await addressInput.fill('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      const messageInput = page.getByLabel(/thank-you message/i);

      // Should be visible and clickable
      await expect(messageInput).toBeVisible();

      // Should have minimum touch target size (44px)
      const box = await messageInput.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);

      // Should not cause horizontal scroll
      await messageInput.fill('This is a longer message to test mobile experience');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
