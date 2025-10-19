import { test, expect } from '@playwright/test';

/**
 * E2E tests for multi-step BTC borrowing transaction flow (Story 2.4)
 *
 * Tests:
 * - Full 3-step borrowing flow (Approve → Mint → Execute)
 * - Progress stepper UI updates
 * - Loading states and estimated time display
 * - Error handling and retry functionality
 * - Cancel flow with warning modal
 * - Auto-retry behavior
 */

test.describe('BTC Borrowing Multi-Step Flow', () => {
  test.beforeEach(async () => {
    // Note: These tests require wallet connection infrastructure with mocked contract interactions
    // Skipping until E2E test infrastructure is set up with:
    // - Test wallet with BTC balance
    // - Mocked contract calls for approve/deposit/execute
    // - Transaction confirmation simulation
  });

  test('completes full 3-step borrowing flow successfully', async ({ page }) => {
    test.skip(true, 'Requires wallet connection and contract mocking infrastructure');

    // Setup: Navigate to payment page with recipient
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

    // Connect test wallet with BTC balance
    // await connectTestWallet(page, { btcBalance: '0.01' });

    // Enter tip amount
    await page.fill('input[placeholder="Enter amount"]', '10');

    // Click "Tip with BTC" button
    await page.click('text=Tip with BTC');

    // Verify BorrowingExplainerPanel appears
    await expect(page.locator('text=How BTC Borrowing Works')).toBeVisible();

    // Click "Continue" in explainer panel
    await page.click('text=Continue');

    // Verify BorrowingFlowModal opens with stepper
    await expect(page.locator('text=Step 1: Approve collateral')).toBeVisible();
    await expect(page.locator('text=Step 2: Mint MUSD')).toBeVisible();
    await expect(page.locator('text=Step 3: Send to creator')).toBeVisible();

    // --- Step 1: Approve BTC Collateral ---

    // Verify Step 1 is highlighted (coral color)
    const step1 = page.locator('text=Step 1: Approve collateral').locator('..');
    await expect(step1).toHaveClass(/bg-coral/);

    // Verify loading state displayed
    await expect(page.locator('text=Approving BTC collateral...')).toBeVisible();
    await expect(page.locator('[data-testid="spinner"]')).toBeVisible();

    // Verify estimated time shown
    await expect(page.locator('text=~15 seconds')).toBeVisible();

    // Mock: Approve wallet transaction prompt
    // await confirmWalletTransaction(page);

    // Wait for Step 1 completion
    await expect(page.locator('[data-testid="step-1-checkmark"]')).toBeVisible({ timeout: 20000 });

    // --- Step 2: Mint MUSD ---

    // Verify Step 2 is now highlighted
    const step2 = page.locator('text=Step 2: Mint MUSD').locator('..');
    await expect(step2).toHaveClass(/bg-coral/);

    // Verify loading state
    await expect(page.locator('text=Minting MUSD from collateral...')).toBeVisible();

    // Mock: Confirm wallet transaction
    // await confirmWalletTransaction(page);

    // Wait for Step 2 completion
    await expect(page.locator('[data-testid="step-2-checkmark"]')).toBeVisible({ timeout: 25000 });

    // --- Step 3: Send to Creator ---

    // Verify Step 3 is now highlighted
    const step3 = page.locator('text=Step 3: Send to creator').locator('..');
    await expect(step3).toHaveClass(/bg-coral/);

    // Verify loading state
    await expect(page.locator('text=Sending MUSD to creator...')).toBeVisible();

    // Mock: Confirm wallet transaction
    // await confirmWalletTransaction(page);

    // Wait for Step 3 completion
    await expect(page.locator('[data-testid="step-3-checkmark"]')).toBeVisible({ timeout: 20000 });

    // Verify all steps show checkmarks (teal color)
    await expect(page.locator('[data-testid="step-1-checkmark"]')).toHaveClass(/text-teal/);
    await expect(page.locator('[data-testid="step-2-checkmark"]')).toHaveClass(/text-teal/);
    await expect(page.locator('[data-testid="step-3-checkmark"]')).toHaveClass(/text-teal/);

    // Verify redirect to confirmation page
    await expect(page).toHaveURL(/\/confirmation\?txHash=0x[a-f0-9]+&type=borrow/);

    // Verify confirmation page content
    await expect(page.locator('text=Tip sent successfully!')).toBeVisible();
  });

  test('displays stepper UI with correct step states', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Navigate and open borrowing flow modal
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    // await connectTestWallet(page, { btcBalance: '0.01' });
    await page.fill('input[placeholder="Enter amount"]', '10');
    await page.click('text=Tip with BTC');
    await page.click('text=Continue');

    // Verify stepper is visible
    await expect(page.locator('[data-testid="transaction-stepper"]')).toBeVisible();

    // Verify all 3 steps are displayed
    await expect(page.locator('text=Step 1: Approve collateral')).toBeVisible();
    await expect(page.locator('text=Step 2: Mint MUSD')).toBeVisible();
    await expect(page.locator('text=Step 3: Send to creator')).toBeVisible();

    // Verify Step 1 is active (coral), Steps 2 and 3 are pending (grey)
    const step1 = page.locator('[data-testid="step-1"]');
    const step2 = page.locator('[data-testid="step-2"]');
    const step3 = page.locator('[data-testid="step-3"]');

    await expect(step1).toHaveClass(/bg-coral/);
    await expect(step2).toHaveClass(/bg-gray/);
    await expect(step3).toHaveClass(/bg-gray/);

    // Verify estimated times are displayed
    await expect(page.locator('text=~15 seconds').first()).toBeVisible();
  });

  test('handles Step 2 failure with error message and retry button', async ({ page }) => {
    test.skip(true, 'Requires wallet connection and contract mocking infrastructure');

    // Setup flow and complete Step 1
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    // await connectTestWallet(page, { btcBalance: '0.01' });
    await page.fill('input[placeholder="Enter amount"]', '10');
    await page.click('text=Tip with BTC');
    await page.click('text=Continue');

    // Mock: Complete Step 1
    // await confirmWalletTransaction(page);
    await expect(page.locator('[data-testid="step-1-checkmark"]')).toBeVisible({ timeout: 20000 });

    // Mock: Reject Step 2 transaction
    // await rejectWalletTransaction(page);

    // Verify error message appears
    await expect(page.locator('text=Step 2 failed')).toBeVisible();
    await expect(page.locator('text=Unable to mint MUSD')).toBeVisible();

    // Verify retry button is displayed
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    // Verify cancel button is displayed
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('auto-retries Step 2 up to 3 times before showing manual retry', async ({ page }) => {
    test.skip(true, 'Requires wallet connection and contract mocking infrastructure');

    // Setup flow and complete Step 1
    // Navigate, connect wallet, enter amount, start flow...

    // Mock: Step 2 fails with network error (retryable)
    // await mockContractCallFailure(page, 'depositCollateral', 'Network timeout');

    // Verify retry attempt messages
    await expect(page.locator('text=Retrying... (Attempt 1 of 3)')).toBeVisible();
    await expect(page.locator('text=Retrying... (Attempt 2 of 3)')).toBeVisible();
    await expect(page.locator('text=Retrying... (Attempt 3 of 3)')).toBeVisible();

    // After 3 failed attempts, verify manual retry button appears
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    await expect(page.locator('text=Max retries reached')).toBeVisible();
  });

  test('shows cancel warning modal after Step 1 completion', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow and complete Step 1
    // Navigate, connect wallet, enter amount, start flow, complete Step 1...

    // Click Cancel button
    await page.click('button:has-text("Cancel")');

    // Verify warning modal appears
    await expect(page.locator('text=Your previous steps will not be reversed')).toBeVisible();
    await expect(page.locator('text=collateral may be locked')).toBeVisible();

    // Verify modal buttons
    await expect(page.locator('button:has-text("Go Back")')).toBeVisible();
    await expect(page.locator('button:has-text("Yes, Cancel")')).toBeVisible();
  });

  test('allows user to go back from cancel warning modal', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow, complete Step 1, click Cancel
    // ...

    // Click "Go Back" in warning modal
    await page.click('button:has-text("Go Back")');

    // Verify modal closes and flow continues
    await expect(page.locator('text=Your previous steps will not be reversed')).not.toBeVisible();

    // Verify Step 2 is still active
    await expect(page.locator('text=Step 2: Mint MUSD')).toBeVisible();
  });

  test('closes flow when user confirms cancellation', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow, complete Step 1, click Cancel
    // ...

    // Click "Yes, Cancel" in warning modal
    await page.click('button:has-text("Yes, Cancel")');

    // Verify modal closes
    await expect(page.locator('[data-testid="borrowing-flow-modal"]')).not.toBeVisible();

    // Verify user returns to payment form
    await expect(page.locator('input[placeholder="Enter amount"]')).toBeVisible();
  });

  test('displays user-friendly error message for wallet rejection', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow and start Step 1
    // ...

    // Mock: User rejects transaction
    // await rejectWalletTransaction(page);

    // Verify user-friendly error message
    await expect(page.locator('text=You cancelled the transaction')).toBeVisible();
    await expect(page.locator('text=Click retry to try again')).toBeVisible();

    // Verify retry button is shown
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('displays error message for insufficient gas', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow
    // ...

    // Mock: Transaction fails due to insufficient gas
    // await mockContractCallFailure(page, 'approve', 'Insufficient gas');

    // Verify error message
    await expect(page.locator('text=Transaction failed due to insufficient gas')).toBeVisible();
    await expect(page.locator('text=Please try again')).toBeVisible();
  });

  test('displays error message for network issues', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Setup flow
    // ...

    // Mock: Network error
    // await mockNetworkError(page);

    // Verify error message
    await expect(page.locator('text=Network error')).toBeVisible();
    await expect(page.locator('text=Check your connection and retry')).toBeVisible();
  });

  test('tracks transaction hashes for all 3 steps', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Complete full flow
    // ...

    // On confirmation page, verify all transaction hashes are displayed
    await expect(page).toHaveURL(/\/confirmation/);

    // Open transaction details accordion
    await page.click('text=Transaction Details');

    // Verify all 3 transaction hashes are listed
    await expect(page.locator('text=Approval Transaction')).toBeVisible();
    await expect(page.locator('text=Deposit Transaction')).toBeVisible();
    await expect(page.locator('text=Tip Transaction')).toBeVisible();

    // Verify transaction hashes are links to block explorer
    const txLinks = page.locator('a[href*="https://explorer.mezo.org/tx/"]');
    await expect(txLinks).toHaveCount(3);
  });

  test('responsive design: stepper displays vertically on mobile', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate and open borrowing flow modal
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    // await connectTestWallet(page, { btcBalance: '0.01' });
    await page.fill('input[placeholder="Enter amount"]', '10');
    await page.click('text=Tip with BTC');
    await page.click('text=Continue');

    // Verify stepper is vertical (flex-col class)
    const stepper = page.locator('[data-testid="transaction-stepper"]');
    await expect(stepper).toHaveClass(/flex-col/);

    // Verify all steps are still visible
    await expect(page.locator('text=Step 1: Approve collateral')).toBeVisible();
    await expect(page.locator('text=Step 2: Mint MUSD')).toBeVisible();
    await expect(page.locator('text=Step 3: Send to creator')).toBeVisible();
  });

  test('keyboard accessibility: can navigate and cancel with keyboard', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Navigate and open borrowing flow modal
    // ...

    // Verify modal has focus
    await expect(page.locator('[data-testid="borrowing-flow-modal"]')).toBeFocused();

    // Tab to Cancel button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter to trigger cancel
    await page.keyboard.press('Enter');

    // Verify cancel warning modal appears
    await expect(page.locator('text=Your previous steps will not be reversed')).toBeVisible();

    // Tab to "Go Back" button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verify modal closed
    await expect(page.locator('text=Your previous steps will not be reversed')).not.toBeVisible();
  });

  test('screen reader accessibility: ARIA labels present', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Navigate and open borrowing flow modal
    // ...

    // Verify ARIA labels on stepper steps
    await expect(page.locator('[aria-label="Step 1: Approve collateral"]')).toBeVisible();
    await expect(page.locator('[aria-label="Step 2: Mint MUSD"]')).toBeVisible();
    await expect(page.locator('[aria-label="Step 3: Send to creator"]')).toBeVisible();

    // Verify ARIA live region for status updates
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();

    // Verify ARIA busy state during loading
    const step1 = page.locator('[data-testid="step-1"]');
    await expect(step1).toHaveAttribute('aria-busy', 'true');
  });
});

test.describe('BTC Borrowing Flow - Edge Cases', () => {
  test('handles contract address not configured error', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Mock: Contract addresses not set in environment
    // await mockMissingContractAddresses(page);

    // Attempt to start flow
    await page.goto('http://localhost:3000/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    // await connectTestWallet(page, { btcBalance: '0.01' });
    await page.fill('input[placeholder="Enter amount"]', '10');
    await page.click('text=Tip with BTC');
    await page.click('text=Continue');

    // Verify error message
    await expect(page.locator('text=Contract addresses not configured')).toBeVisible();
  });

  test('handles invalid position ID error in Step 3', async ({ page }) => {
    test.skip(true, 'Requires wallet connection infrastructure');

    // Mock: Step 2 returns invalid position ID
    // await mockInvalidPositionId(page);

    // Complete Steps 1 and 2
    // ...

    // Verify Step 3 shows error
    await expect(page.locator('text=Invalid position ID')).toBeVisible();
  });
});
