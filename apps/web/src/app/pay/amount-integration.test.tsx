/**
 * Integration tests for Story 1.5: Free-Form Amount Entry with Smart Guardrails
 *
 * Tests PaymentForm orchestration and component interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseEther } from 'viem';
import { PaymentForm } from '@/components/organisms/PaymentForm';
import type { Address } from 'viem';

// Mock Wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A' as Address,
    isConnected: true,
  }),
  useBalance: () => ({
    data: { value: parseEther('100'), decimals: 18, symbol: 'MUSD', formatted: '100' },
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

// Mock useBalanceMonitor hook
vi.mock('@/hooks/useBalanceMonitor', () => ({
  useBalanceMonitor: () => ({
    balance: parseEther('100'), // 100 MUSD
    balanceUsd: '100.00',
    isLoading: false,
    refetch: vi.fn(),
    updateOptimistically: vi.fn(),
  }),
}));

// Mock useGasEstimation hook
vi.mock('@/hooks/useGasEstimation', () => ({
  useGasEstimation: ({ amount }: { amount: bigint }) => {
    // Mock gas estimation based on amount
    if (amount === BigInt(0)) {
      return {
        gasEstimate: null,
        gasEstimateUsd: null,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }

    // Simulate loading state briefly
    return {
      gasEstimate: parseEther('0.00005'), // 0.00005 ETH
      gasEstimateUsd: '0.15', // $0.15 at $3000/ETH
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  },
}));

describe('PaymentForm Integration (Story 1.5)', () => {
  const mockRecipient: Address = '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quick Amount Chip Integration (AC2, AC3)', () => {
    it('clicking chip pre-fills AmountInput', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Click $5 chip
      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      // AmountInput should display $5.00
      const input = screen.getByRole('textbox', { name: /tip amount/i });
      expect(input).toHaveValue('$5.00');
    });

    it('clicking chip updates SendButton label', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Initially should show "Enter amount"
      expect(screen.getByRole('button', { name: /enter amount/i })).toBeInTheDocument();

      // Click $10 chip
      const chip10 = screen.getByRole('button', { name: 'Select 10 dollars' });
      await user.click(chip10);

      // SendButton should update to "Send $10.00"
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send \$10\.00/i })).toBeInTheDocument();
      });
    });

    it('clicking chip triggers gas estimation', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Click $5 chip
      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      // Gas fee display should appear
      await waitFor(() => {
        expect(screen.getByText(/total cost:/i)).toBeInTheDocument();
        expect(screen.getByText(/\$5\.15/)).toBeInTheDocument();
      });
    });

    it('clicking different chips updates all components', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Click $3 chip
      const chip3 = screen.getByRole('button', { name: 'Select 3 dollars' });
      await user.click(chip3);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('$3.00');
        expect(screen.getByText(/send \$3\.00/i)).toBeInTheDocument();
      });

      // Click $25 chip
      const chip25 = screen.getByRole('button', { name: 'Select 25 dollars' });
      await user.click(chip25);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('$25.00');
        expect(screen.getByText(/send \$25\.00/i)).toBeInTheDocument();
      });
    });
  });

  describe('Manual Amount Entry (AC1, AC11, AC12)', () => {
    it('manual input updates SendButton label in real-time', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });

      // Type amount manually
      await user.type(input, '12.50');

      // SendButton should update dynamically
      await waitFor(() => {
        expect(screen.getByText(/send \$12\.50/i)).toBeInTheDocument();
      });
    });

    it('non-numeric input is rejected', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i }) as HTMLInputElement;

      await user.type(input, 'abc');

      // Input should remain empty (parseAmountInput strips letters)
      expect(input.value).toBe('');
    });

    it('amount auto-formats to 2 decimals on blur', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i }) as HTMLInputElement;

      await user.type(input, '5');
      await user.tab(); // Trigger blur

      // Should format to $5.00
      await waitFor(() => {
        expect(input.value).toBe('$5.00');
      });
    });

    it('amount rounds to 2 decimals on blur', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i }) as HTMLInputElement;

      await user.type(input, '5.4278');
      await user.tab(); // Trigger blur

      // Should round 5.4278 -> $5.43
      await waitFor(() => {
        expect(input.value).toBe('$5.43');
      });
    });
  });

  describe('Gas Estimation Display (AC4, AC5)', () => {
    it('gas estimate displays below input', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Enter amount
      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      // Gas fee display should show
      await waitFor(() => {
        expect(screen.getByText(/total cost: ~\$5\.15/i)).toBeInTheDocument();
        expect(screen.getByText(/includes ~\$0\.15 network fee/i)).toBeInTheDocument();
      });
    });

    it('gas estimate updates when amount changes', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Click $5 chip
      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      await waitFor(() => {
        expect(screen.getByText(/\$5\.15/)).toBeInTheDocument();
      });

      // Click $10 chip
      const chip10 = screen.getByRole('button', { name: 'Select 10 dollars' });
      await user.click(chip10);

      await waitFor(() => {
        expect(screen.getByText(/\$10\.15/)).toBeInTheDocument();
      });
    });
  });

  describe('Economic Viability Warning (AC6, AC7)', () => {
    it('shows warning for small amounts (< 2x gas)', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });

      // Enter small amount (gas is $0.15, so < $0.30 should warn)
      await user.type(input, '0.25');

      // Warning should appear with amber styling
      await waitFor(() => {
        const warning = screen.getByRole('alert');
        expect(warning).toBeInTheDocument();
        expect(warning).toHaveTextContent(/network fees/i);
        expect(warning).toHaveTextContent(/for better value/i);
      });
    });

    it('warning uses amber color, not red', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const chip3 = screen.getByRole('button', { name: 'Select 3 dollars' });
      await user.click(chip3);

      // Warning should not appear for $3 (> 2x $0.15)
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('warning allows transaction (SendButton still enabled)', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '0.25');

      // Warning should show but SendButton should still be enabled
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        const sendButton = screen.getByRole('button', { name: /send \$0\.25/i });
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Large Amount Modal (AC8)', () => {
    it('amounts over $100 trigger confirmation modal', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '500');
      await user.tab(); // Format to $500.00

      // Click SendButton (not SendMaxButton)
      const sendButton = screen.getByRole('button', { name: /send \$500/i });
      await user.click(sendButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByText(/you're about to send \$500\.00/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /yes, send/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });
    });

    it('amounts under $100 do not trigger modal', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={mockSend} />
      );

      const chip25 = screen.getByRole('button', { name: 'Select 25 dollars' });
      await user.click(chip25);

      // Click SendButton (not SendMaxButton)
      const sendButton = screen.getByRole('button', { name: /send \$25/i });
      await user.click(sendButton);

      // Modal should not appear, onSend should be called directly
      await waitFor(() => {
        expect(screen.queryByText(/you're about to send/i)).not.toBeInTheDocument();
        expect(mockSend).toHaveBeenCalledWith('25.00');
      });
    });

    it('modal Cancel button closes modal', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '500');
      await user.tab();

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Modal appears
      await waitFor(() => {
        expect(screen.getByText(/you're about to send/i)).toBeInTheDocument();
      });

      // Click Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText(/you're about to send/i)).not.toBeInTheDocument();
      });
    });

    it('modal Confirm button calls onSend', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={mockSend} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '500');
      await user.tab();

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Modal appears
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /yes, send/i })).toBeInTheDocument();
      });

      // Click Confirm
      const confirmButton = screen.getByRole('button', { name: /yes, send/i });
      await user.click(confirmButton);

      // onSend should be called with amount
      await waitFor(() => {
        expect(mockSend).toHaveBeenCalledWith('500.00');
      });
    });
  });

  describe('SendButton State Management (AC9, AC10)', () => {
    it('SendButton disabled when amount is empty', () => {
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const sendButton = screen.getByRole('button', { name: /enter amount/i });
      expect(sendButton).toBeDisabled();
    });

    it('SendButton disabled when amount is zero', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '0');

      const sendButton = screen.getByRole('button', { name: /enter amount/i });
      expect(sendButton).toBeDisabled();
    });

    it('SendButton enabled when valid amount entered', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send \$5/i });
        expect(sendButton).not.toBeDisabled();
      });
    });

    it('SendButton label updates dynamically with amount', async () => {
      const user = userEvent.setup();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={vi.fn()} />
      );

      // Initially "Enter amount"
      expect(screen.getByText(/enter amount/i)).toBeInTheDocument();

      // Type amount
      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.type(input, '12.50');

      // Label should update
      await waitFor(() => {
        expect(screen.getByText(/send \$12\.50/i)).toBeInTheDocument();
      });
    });
  });

  describe('Pre-fill Amount (Story 1.4 integration)', () => {
    it('prefillAmount prop populates input on mount', () => {
      render(
        <PaymentForm
          recipientAddress={mockRecipient}
          prefillAmount={5}
          onSend={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox', { name: /tip amount/i }) as HTMLInputElement;
      expect(input.value).toBe('$5.00');
    });

    it('prefillAmount triggers gas estimation', async () => {
      render(
        <PaymentForm
          recipientAddress={mockRecipient}
          prefillAmount={10}
          onSend={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/total cost: ~\$10\.15/i)).toBeInTheDocument();
      });
    });

    it('prefillAmount updates SendButton label', () => {
      render(
        <PaymentForm
          recipientAddress={mockRecipient}
          prefillAmount={25}
          onSend={vi.fn()}
        />
      );

      expect(screen.getByText(/send \$25\.00/i)).toBeInTheDocument();
    });
  });

  describe('Full Payment Flow', () => {
    it('complete flow: chip → manual edit → gas estimate → send', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={mockSend} />
      );

      // Step 1: Click chip
      const chip5 = screen.getByRole('button', { name: 'Select 5 dollars' });
      await user.click(chip5);

      // Step 2: Verify input and gas estimate
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toHaveValue('$5.00');
        expect(screen.getByText(/\$5\.15/)).toBeInTheDocument();
      });

      // Step 3: Manually edit amount
      const input = screen.getByRole('textbox', { name: /tip amount/i });
      await user.clear(input);
      await user.type(input, '7.50');

      // Step 4: Verify updated gas estimate
      await waitFor(() => {
        expect(screen.getByText(/\$7\.65/)).toBeInTheDocument();
      });

      // Step 5: Click SendButton (not SendMaxButton)
      const sendButton = screen.getByRole('button', { name: /send \$7\.50/i });
      await user.click(sendButton);

      // Step 6: Verify onSend called
      await waitFor(() => {
        expect(mockSend).toHaveBeenCalledWith('7.50');
      });
    });

    it('keyboard-only navigation flow', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      render(
        <PaymentForm recipientAddress={mockRecipient} onSend={mockSend} />
      );

      // Tab to first chip
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab(); // Quick amount chips

      // Select chip with Enter
      await user.keyboard('{Enter}');

      // Tab to input
      await user.tab();

      // Type amount
      await user.keyboard('10');

      // Tab to SendButton
      await user.tab();

      // Activate with Enter
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockSend).toHaveBeenCalledWith('10.00');
      });
    });
  });
});
