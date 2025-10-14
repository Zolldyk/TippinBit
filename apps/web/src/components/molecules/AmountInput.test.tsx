import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AmountInput } from './AmountInput';

// Controlled wrapper for stateful tests
interface ControlledAmountInputProps {
  onChange?: (value: string) => void;
  value?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

function ControlledAmountInput({ onChange, ...props }: ControlledAmountInputProps) {
  const [value, setValue] = useState(props.value || '');

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  return <AmountInput {...props} value={value} onChange={handleChange} />;
}

describe('AmountInput', () => {
  describe('Basic Rendering', () => {
    it('renders with default label', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const label = screen.getByText('Tip amount');
      expect(label).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(
        <AmountInput value="" onChange={vi.fn()} label="Custom Amount" />
      );
      const label = screen.getByText('Custom Amount');
      expect(label).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Enter any amount');
      expect(input).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(
        <AmountInput
          value=""
          onChange={vi.fn()}
          placeholder="Enter tip amount"
        />
      );
      const input = screen.getByPlaceholderText('Enter tip amount');
      expect(input).toBeInTheDocument();
    });

    it('displays dollar sign prefix for non-empty values', () => {
      render(<AmountInput value="5.00" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('$5.00');
    });

    it('displays empty value without dollar sign', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Numeric Input Validation (AC11)', () => {
    it('accepts numeric input and calls onChange with cleaned value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '123');
      // Should be called 3 times (once per character: '1', '12', '123')
      expect(handleChange).toHaveBeenCalledTimes(3);
      // Verify final call
      expect(handleChange).toHaveBeenLastCalledWith('123');
    });

    it('rejects non-numeric characters', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'abc');
      // onChange should be called with empty strings (parseAmountInput strips letters)
      expect(handleChange).toHaveBeenCalled();
      // All calls should result in empty string
      handleChange.mock.calls.forEach((call) => {
        expect(call[0]).toBe('');
      });
    });

    it('accepts decimal point', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '12.34');
      // Verify final call after typing '1', '2', '.', '3', '4'
      expect(handleChange).toHaveBeenCalledTimes(5);
      expect(handleChange).toHaveBeenLastCalledWith('12.34');
    });

    it('allows single decimal point, rejects multiple', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '12..34');
      // parseAmountInput should strip the second decimal
      // After typing '1', '2', '.', '.', '3', '4' → '1', '12', '12.', '12.', '12.3', '12.34'
      expect(handleChange).toHaveBeenCalledTimes(6);
      expect(handleChange).toHaveBeenLastCalledWith('12.34');
    });

    it('strips non-numeric characters from mixed input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '12a.34b');
      // parseAmountInput should extract '12.34'
      // After typing '1' -> '1'
      // After typing '2' -> '12'
      // After typing 'a' -> '12' (a is stripped)
      // After typing '.' -> '12.'
      // After typing '3' -> '12.3'
      // After typing '4' -> '12.34'
      // After typing 'b' -> '12.34' (b is stripped)
      expect(handleChange).toHaveBeenCalledTimes(7);
      expect(handleChange).toHaveBeenLastCalledWith('12.34');
    });
  });

  describe('Dollar Sign Handling (Critical Bug Fix)', () => {
    it('removes dollar sign before parsing input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput value="5" onChange={handleChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Input displays with dollar sign
      expect(input.value).toBe('$5');

      // Clear input and type new value
      await user.clear(input);
      await user.type(input, '10');

      // onChange should receive values without dollar sign: '1', '10'
      expect(handleChange).toHaveBeenCalledTimes(3); // clear + 2 characters
      expect(handleChange).toHaveBeenLastCalledWith('10');
    });

    it('handles dollar sign in display value without breaking input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="5.00" onChange={handleChange} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Display value has dollar sign
      expect(input.value).toBe('$5.00');

      // User appends a digit (typing at end)
      await user.click(input);
      await user.type(input, '0');

      // Should append to value, not lose it
      expect(handleChange).toHaveBeenLastCalledWith('5.000');
    });
  });

  describe('Auto-formatting on Blur (AC1, AC12)', () => {
    it('formats to 2 decimal places on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="5" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // formatCurrency should be called, result should be '5.00' (without $)
      expect(handleChange).toHaveBeenLastCalledWith('5.00');
    });

    it('rounds to 2 decimal places on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="5.4278" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // Should round 5.4278 -> 5.43
      expect(handleChange).toHaveBeenLastCalledWith('5.43');
    });

    it('handles single decimal digit on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="5.4" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // Should format 5.4 -> 5.40
      expect(handleChange).toHaveBeenLastCalledWith('5.40');
    });

    it('handles whole number formatting on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="100" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // Should format 100 -> 100.00
      expect(handleChange).toHaveBeenLastCalledWith('100.00');
    });

    it('does not format empty value on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // Should not call onChange for empty value
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('calls onBlur prop when provided', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<AmountInput value="5" onChange={vi.fn()} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('renders disabled input correctly', () => {
      render(<AmountInput value="" onChange={vi.fn()} disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="" onChange={handleChange} disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, '123');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('cannot be focused when disabled', async () => {
      const user = userEvent.setup();
      render(<AmountInput value="" onChange={vi.fn()} disabled />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      expect(input).not.toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Tip amount input');
    });

    it('associates label with input', () => {
      render(<AmountInput value="" onChange={vi.fn()} label="Amount" />);
      const label = screen.getByText('Amount');
      const input = screen.getByRole('textbox');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('has decimal inputMode for mobile keyboard', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('inputMode', 'decimal');
    });

    it('disables autocomplete', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'off');
    });

    it('disables spellcheck', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('spellCheck', 'false');
    });

    it('disables autocorrect', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoCorrect', 'off');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox');

      await user.tab();
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles leading decimal point', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '.5');
      // parseAmountInput should convert '.5' -> '0.5'
      expect(handleChange).toHaveBeenLastCalledWith('0.5');
    });

    it('handles lone decimal point', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '.');
      // parseAmountInput should convert '.' -> '0.'
      expect(handleChange).toHaveBeenLastCalledWith('0.');
    });

    it('handles leading zeros', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<ControlledAmountInput onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, '00.50');
      // parseAmountInput preserves leading zeros (formatter handles on blur)
      expect(handleChange).toHaveBeenLastCalledWith('00.50');
    });

    it('formats leading zeros on blur', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<AmountInput value="00.50" onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.click(input);
      await user.tab(); // Trigger blur

      // formatCurrency should normalize to '0.50'
      expect(handleChange).toHaveBeenLastCalledWith('0.50');
    });
  });

  describe('Integration with Input atom', () => {
    it('uses text input type (not number)', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.type).toBe('text');
    });
  });
});
