import { describe, it, expect } from 'vitest';
import { formatCurrency, parseAmountInput } from './formatting';

describe('formatCurrency', () => {
  it('formats whole numbers with 2 decimals', () => {
    expect(formatCurrency('5')).toBe('$5.00');
    expect(formatCurrency('100')).toBe('$100.00');
    expect(formatCurrency('1')).toBe('$1.00');
  });

  it('formats numbers with 1 decimal to 2 decimals', () => {
    expect(formatCurrency('5.4')).toBe('$5.40');
    expect(formatCurrency('12.5')).toBe('$12.50');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency('5.4278')).toBe('$5.43');
    expect(formatCurrency('10.995')).toBe('$11.00'); // Floating-point: .995 rounds up due to IEEE 754
    expect(formatCurrency('5.999')).toBe('$6.00');
    expect(formatCurrency('3.14159')).toBe('$3.14');
  });

  it('handles numeric input', () => {
    expect(formatCurrency(5.25)).toBe('$5.25');
    expect(formatCurrency(100)).toBe('$100.00');
    expect(formatCurrency(0.99)).toBe('$0.99');
  });

  it('handles zero', () => {
    expect(formatCurrency('0')).toBe('$0.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles invalid input', () => {
    expect(formatCurrency('abc')).toBe('$0.00');
    expect(formatCurrency('')).toBe('$0.00');
  });

  it('handles negative numbers', () => {
    expect(formatCurrency('-5')).toBe('$-5.00');
    expect(formatCurrency(-10.5)).toBe('$-10.50');
  });
});

describe('parseAmountInput', () => {
  it('returns numeric strings unchanged', () => {
    expect(parseAmountInput('123')).toBe('123');
    expect(parseAmountInput('12.34')).toBe('12.34');
    expect(parseAmountInput('0')).toBe('0');
  });

  it('strips non-numeric characters', () => {
    expect(parseAmountInput('abc')).toBe('');
    expect(parseAmountInput('12a.34b')).toBe('12.34');
    expect(parseAmountInput('$100')).toBe('100');
    expect(parseAmountInput('1,234.56')).toBe('1234.56');
  });

  it('allows single decimal point', () => {
    expect(parseAmountInput('12.34')).toBe('12.34');
    expect(parseAmountInput('0.5')).toBe('0.5');
  });

  it('handles multiple decimal points (keeps first)', () => {
    expect(parseAmountInput('12..34')).toBe('12.34');
    expect(parseAmountInput('1.2.3.4')).toBe('1.234');
  });

  it('handles edge case: starts with decimal point', () => {
    expect(parseAmountInput('.')).toBe('0.');
    expect(parseAmountInput('.5')).toBe('0.5');
    expect(parseAmountInput('.99')).toBe('0.99');
  });

  it('handles edge case: leading zeros', () => {
    expect(parseAmountInput('00.50')).toBe('00.50');
    expect(parseAmountInput('007')).toBe('007');
  });

  it('handles empty string', () => {
    expect(parseAmountInput('')).toBe('');
  });

  it('strips all non-numeric except decimal', () => {
    expect(parseAmountInput('abc123def')).toBe('123');
    expect(parseAmountInput('!@#$%^&*()12.34')).toBe('12.34');
  });
});
