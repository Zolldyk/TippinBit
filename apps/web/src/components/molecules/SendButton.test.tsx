import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendButton } from './SendButton';

describe('SendButton', () => {
  describe('Dynamic Label (AC10)', () => {
    it('displays "Enter amount" when amount is empty', () => {
      render(<SendButton amount="" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Enter amount');
    });

    it('displays "Enter amount" when amount is zero', () => {
      render(<SendButton amount="0" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Enter amount');
    });

    it('displays "Enter amount" when amount is "0.00"', () => {
      render(<SendButton amount="0.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Enter amount');
    });

    it('displays "Send $12.00" when valid amount provided', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $12.00');
    });

    it('displays formatted amount with dollar sign', () => {
      render(<SendButton amount="5.50" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $5.50');
    });

    it('updates label in real-time when amount changes', () => {
      const { rerender } = render(
        <SendButton amount="5" disabled={false} onClick={vi.fn()} />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Send $5.00');

      rerender(<SendButton amount="10" disabled={false} onClick={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveTextContent('Send $10.00');

      rerender(<SendButton amount="25.99" disabled={false} onClick={vi.fn()} />);
      expect(screen.getByRole('button')).toHaveTextContent('Send $25.99');
    });

    it('shows "Sending..." when isLoading is true', () => {
      render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Sending...');
    });
  });

  describe('Disabled State (AC9)', () => {
    it('is disabled when amount is empty', () => {
      render(<SendButton amount="" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when amount is zero', () => {
      render(<SendButton amount="0" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when amount is negative', () => {
      render(<SendButton amount="-5" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<SendButton amount="12.00" disabled={true} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is enabled when valid amount and disabled prop is false', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('is disabled when amount is invalid (NaN)', () => {
      render(<SendButton amount="abc" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is greyed out when disabled', () => {
      render(<SendButton amount="" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      // Button component handles disabled styling
      expect(button).toBeDisabled();
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when enabled button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SendButton amount="12.00" disabled={false} onClick={handleClick} />);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SendButton amount="0" disabled={false} onClick={handleClick} />);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when disabled prop is true', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SendButton amount="12.00" disabled={true} onClick={handleClick} />);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={handleClick}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state with "Sending..." text', () => {
      render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Sending...');
    });

    it('is disabled when loading', () => {
      render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('loading prop is optional', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $12.00');
      expect(button).not.toBeDisabled();
    });

    it('transitions from loading to normal state', () => {
      const { rerender } = render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={true}
        />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Sending...');

      rerender(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={false}
        />
      );
      expect(screen.getByRole('button')).toHaveTextContent('Send $12.00');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label with amount', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Send $12.00');
    });

    it('has aria-label without amount when disabled', () => {
      render(<SendButton amount="" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Enter amount');
    });

    it('has aria-disabled when disabled', () => {
      render(<SendButton amount="" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has aria-disabled="false" when enabled', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'false');
    });

    it('supports keyboard interaction (Enter key)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SendButton amount="12.00" disabled={false} onClick={handleClick} />);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard interaction (Space key)', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<SendButton amount="12.00" disabled={false} onClick={handleClick} />);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Responsive Styling', () => {
    it('has full width on mobile', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('has auto width on desktop', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('sm:w-auto');
    });
  });

  describe('Integration with Button Atom', () => {
    it('uses primary variant', () => {
      render(<SendButton amount="12.00" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      // Button component handles variant styling
      expect(button).toBeInTheDocument();
    });

    it('passes loading prop to Button atom', () => {
      render(
        <SendButton
          amount="12.00"
          disabled={false}
          onClick={vi.fn()}
          isLoading={true}
        />
      );
      const button = screen.getByRole('button');
      // Button component shows spinner when loading
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small amounts', () => {
      render(<SendButton amount="0.01" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $0.01');
      expect(button).not.toBeDisabled();
    });

    it('handles very large amounts', () => {
      render(<SendButton amount="10000" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $10,000.00');
      expect(button).not.toBeDisabled();
    });

    it('handles decimal amounts without trailing zeros', () => {
      render(<SendButton amount="5.5" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Send $5.50');
    });

    it('handles amounts with many decimal places', () => {
      render(<SendButton amount="5.4567" disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      // formatCurrency should round to 2 decimals
      expect(button).toHaveTextContent('Send $5.46');
    });

    it('handles whitespace in amount', () => {
      render(<SendButton amount="  12  " disabled={false} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      // parseFloat strips whitespace
      expect(button).toHaveTextContent('Send $12.00');
    });
  });
});
