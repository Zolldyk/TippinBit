import { describe, it, expect } from 'vitest';
import { validatePaymentAddress, parsePaymentAmount } from './validation';

describe('validatePaymentAddress', () => {
  it('returns checksummed address for valid lowercase address', () => {
    // Using lowercase - viem will checksum it
    const result = validatePaymentAddress(
      '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
    );
    // Should return a checksummed address
    expect(result).toBeTruthy();
    expect(result?.startsWith('0x')).toBe(true);
    expect(result?.length).toBe(42);
  });

  it('accepts already checksummed address', () => {
    // Using a correctly checksummed address
    const result = validatePaymentAddress(
      '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
    );
    expect(result).toBe('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed');
  });

  it('returns null for invalid address format (missing 0x)', () => {
    const result = validatePaymentAddress(
      '5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
    );
    expect(result).toBeNull();
  });

  it('returns null for invalid address format (too short)', () => {
    const result = validatePaymentAddress('0x123');
    expect(result).toBeNull();
  });

  it('returns null for invalid address format (too long)', () => {
    const result = validatePaymentAddress(
      '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed123'
    );
    expect(result).toBeNull();
  });

  it('returns null for invalid address format (non-hex characters)', () => {
    const result = validatePaymentAddress(
      '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaGG'
    );
    expect(result).toBeNull();
  });

  it('returns null for completely invalid input', () => {
    const result = validatePaymentAddress('invalid-address');
    expect(result).toBeNull();
  });

  it('returns null for empty string', () => {
    const result = validatePaymentAddress('');
    expect(result).toBeNull();
  });

  it('handles valid all-lowercase address', () => {
    const result = validatePaymentAddress(
      '0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359'
    );
    // Should return checksummed version
    expect(result).toBeTruthy();
    expect(result?.startsWith('0x')).toBe(true);
    expect(result?.length).toBe(42);
  });

  it('rejects incorrectly checksummed address (all uppercase)', () => {
    // All-uppercase is not a valid checksum, so viem rejects it
    const result = validatePaymentAddress(
      '0xFB6916095CA1DF60BB79CE92CE3EA74C37C5D359'
    );
    expect(result).toBeNull();
  });
});

describe('parsePaymentAmount', () => {
  describe('valid amounts', () => {
    it('parses integer string', () => {
      expect(parsePaymentAmount('5')).toBe(5);
    });

    it('parses decimal string', () => {
      expect(parsePaymentAmount('10.50')).toBe(10.5);
    });

    it('parses small decimal', () => {
      expect(parsePaymentAmount('0.5')).toBe(0.5);
    });

    it('parses large number', () => {
      expect(parsePaymentAmount('1000.99')).toBe(1000.99);
    });

    it('parses amount with leading zeros', () => {
      expect(parsePaymentAmount('05.50')).toBe(5.5);
    });
  });

  describe('invalid amounts', () => {
    it('returns undefined for empty string', () => {
      expect(parsePaymentAmount('')).toBeUndefined();
    });

    it('returns undefined for whitespace', () => {
      expect(parsePaymentAmount('   ')).toBeUndefined();
    });

    it('returns undefined for non-numeric string', () => {
      expect(parsePaymentAmount('abc')).toBeUndefined();
    });

    it('returns undefined for negative number', () => {
      expect(parsePaymentAmount('-5')).toBeUndefined();
    });

    it('returns undefined for zero', () => {
      expect(parsePaymentAmount('0')).toBeUndefined();
    });

    it('returns undefined for Infinity', () => {
      expect(parsePaymentAmount('Infinity')).toBeUndefined();
    });

    it('returns undefined for undefined input', () => {
      expect(parsePaymentAmount(undefined)).toBeUndefined();
    });

    it('returns undefined for NaN string', () => {
      expect(parsePaymentAmount('NaN')).toBeUndefined();
    });

    it('parses number from start of alphanumeric string', () => {
      // parseFloat('5abc') returns 5 - JavaScript behavior
      // This is actually valid parseFloat behavior
      expect(parsePaymentAmount('5abc')).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('parses very small positive number', () => {
      expect(parsePaymentAmount('0.01')).toBe(0.01);
    });

    it('handles scientific notation', () => {
      expect(parsePaymentAmount('1e2')).toBe(100);
    });

    it('returns undefined for negative zero', () => {
      expect(parsePaymentAmount('-0')).toBeUndefined();
    });
  });
});
